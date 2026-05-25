import { create } from "zustand";
import { toast } from "sonner";
import type { Fornecedor, StatusType } from "@/types/wedding";
import {
  loadWeddingData,
  createFornecedor as sfCreateFornecedor,
  updateFornecedor as sfUpdateFornecedor,
  deleteFornecedor as sfDeleteFornecedor,
  updateFornecedorParcelas,
  saveUserSettings,
} from "@/lib/wedding.functions";

function extractErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string") return e;
  return fallback;
}

interface Settings {
  noivos: string;
  dataCasamento: string; // ISO yyyy-mm-dd
}

export type ActivityType = "add" | "update" | "delete" | "pay" | "unpay";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  fornecedorNome?: string;
  timestamp: number;
}

const ACTIVITY_LIMIT = 30;
const activityKey = (userId: string) => `wedding_activity_${userId}`;

function loadActivity(userId: string): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(activityKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, ACTIVITY_LIMIT) : [];
  } catch {
    return [];
  }
}

function persistActivity(userId: string, list: ActivityEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(activityKey(userId), JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

interface WeddingStore {
  fornecedores: Fornecedor[];
  orcamentoTotal: number;
  darkMode: boolean;
  settings: Settings;
  hydrated: boolean;
  userId: string | null;
  activity: ActivityEntry[];

  loadForUser: (userId: string) => Promise<void>;
  resetLocal: () => void;

  addFornecedor: (f: Omit<Fornecedor, "id">) => Promise<void>;
  restoreFornecedor: (f: Fornecedor) => Promise<void>;
  updateFornecedor: (id: string, f: Partial<Fornecedor>) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
  toggleParcelaPaga: (fornecedorId: string, numero: number) => Promise<void>;
  setOrcamentoTotal: (v: number) => void;
  setSettings: (s: Partial<Settings>) => void;
  saveSettings: (settings: Settings, orcamentoTotal: number) => Promise<boolean>;
  toggleDarkMode: () => void;
  logActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  clearActivity: () => void;
}

export function computeStatus(f: Pick<Fornecedor, "parcelas">): StatusType {
  const total = f.parcelas.length;
  const pagas = f.parcelas.filter((p) => p.pago).length;
  if (total === 0) return "pendente";
  if (pagas === total) return "pago";
  const hoje = new Date();
  const atrasada = f.parcelas.some((p) => !p.pago && new Date(p.dataPagamento) < hoje);
  if (atrasada) return "atrasado";
  if (pagas === 0) return "pendente";
  return "parcial";
}

type FornecedorRow = {
  id: string;
  nome: string;
  categoria: string;
  valor_total: number | string;
  data_cont: string | null;
  vencimento: string | null;
  parcelas: unknown;
  status: string;
  prioridade: string;
  observacoes: string | null;
  contato: string | null;
  email: string | null;
  tipo: string | null;
};

function rowToFornecedor(r: FornecedorRow): Fornecedor {
  return {
    id: r.id,
    nome: r.nome,
    categoria: r.categoria as Fornecedor["categoria"],
    valorTotal: Number(r.valor_total) || 0,
    dataCont: r.data_cont ?? "",
    vencimento: r.vencimento ?? "",
    parcelas: Array.isArray(r.parcelas) ? (r.parcelas as Fornecedor["parcelas"]) : [],
    status: r.status as StatusType,
    prioridade: r.prioridade as Fornecedor["prioridade"],
    observacoes: r.observacoes ?? "",
    contato: r.contato ?? undefined,
    email: r.email ?? undefined,
    tipo: (r.tipo as Fornecedor["tipo"]) ?? undefined,
  };
}

const DEFAULT_SETTINGS: Settings = {
  noivos: "Casal",
  dataCasamento: "",
};

export const useWeddingStore = create<WeddingStore>()((set, get) => {
  let settingsTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelPendingSettingsSave = () => {
    if (settingsTimer) {
      clearTimeout(settingsTimer);
      settingsTimer = null;
    }
  };

  const flushSettingsSave = () => {
    cancelPendingSettingsSave();
    const state = get();
    if (!state.userId) return;
    void saveUserSettings({
      data: {
        noivos: state.settings.noivos || "Casal",
        dataCasamento: state.settings.dataCasamento,
        orcamentoTotal: state.orcamentoTotal,
        darkMode: state.darkMode,
      },
    }).catch((e) => console.error("[wedding] flushSettingsSave failed", e));
  };

  const debouncedSaveSettings = (ms = 800) => {
    cancelPendingSettingsSave();
    settingsTimer = setTimeout(() => {
      settingsTimer = null;
      const state = get();
      if (!state.userId) return;
      void saveUserSettings({
        data: {
          noivos: state.settings.noivos || "Casal",
          dataCasamento: state.settings.dataCasamento,
          orcamentoTotal: state.orcamentoTotal,
          darkMode: state.darkMode,
        },
      }).catch((e) => console.error("[wedding] debouncedSaveSettings failed", e));
    }, ms);
  };

  // Generic optimistic mutation helper for fornecedores list.
  // Pattern: snapshot → apply → log activity → server call → rollback+toast on error.
  async function runOptimistic<T>(opts: {
    requireAuth?: boolean;
    apply: (prev: Fornecedor[]) => { next: Fornecedor[]; payload: T } | null;
    activity?: (payload: T) => Omit<ActivityEntry, "id" | "timestamp"> | null;
    server: (payload: T) => Promise<unknown>;
    errorTitle: string;
    errorFallback: (payload: T) => string;
    logTag: string;
  }): Promise<void> {
    if (opts.requireAuth && !get().userId) return;
    const prev = get().fornecedores;
    const result = opts.apply(prev);
    if (!result) return;
    const { next, payload } = result;
    set({ fornecedores: next });
    const entry = opts.activity?.(payload);
    if (entry) get().logActivity(entry);
    try {
      await opts.server(payload);
    } catch (e) {
      console.error(`[wedding] ${opts.logTag} failed`, e);
      set({ fornecedores: prev });
      toast.error(opts.errorTitle, {
        description: extractErrorMessage(e, opts.errorFallback(payload)),
      });
    }
  }

  return {
    fornecedores: [],
    orcamentoTotal: 45000,
    darkMode: false,
    settings: DEFAULT_SETTINGS,
    hydrated: false,
    userId: null,
    activity: [],

    resetLocal: () =>
      set({
        fornecedores: [],
        orcamentoTotal: 45000,
        settings: DEFAULT_SETTINGS,
        hydrated: false,
        userId: null,
        activity: [],
      }),

    logActivity: (entry) => {
      const userId = get().userId;
      const next: ActivityEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      set((s) => {
        const list = [next, ...s.activity].slice(0, ACTIVITY_LIMIT);
        if (userId) persistActivity(userId, list);
        return { activity: list };
      });
    },

    clearActivity: () => {
      const userId = get().userId;
      set({ activity: [] });
      if (userId) persistActivity(userId, []);
    },

    loadForUser: async (userId) => {
      set({ userId, hydrated: false, activity: loadActivity(userId) });
      try {
        const res = await loadWeddingData();
        const fornecedores = (res.fornecedores ?? []).map((r) =>
          rowToFornecedor(r as FornecedorRow),
        );
        const s = res.settings;
        const settings: Settings = {
          noivos: s?.noivos ?? "Casal",
          dataCasamento: s?.data_casamento ?? "",
        };
        const orcamentoTotal = Number(s?.orcamento_total) || 45000;
        const darkMode = !!s?.dark_mode;
        set({ fornecedores, settings, orcamentoTotal, darkMode, hydrated: true });
      } catch (e) {
        console.error("[wedding] loadForUser failed", e);
        set({ hydrated: true });
      }
    },

    addFornecedor: (f) =>
      runOptimistic<Fornecedor>({
        requireAuth: true,
        apply: (prev) => {
          const newF: Fornecedor = { ...f, id: crypto.randomUUID(), status: computeStatus(f) };
          return { next: [...prev, newF], payload: newF };
        },
        activity: (newF) => ({
          type: "add",
          fornecedorNome: newF.nome,
          description:
            newF.tipo === "avulso"
              ? `Compra avulsa adicionada: ${newF.nome}`
              : `Fornecedor adicionado: ${newF.nome}`,
        }),
        server: (newF) => sfCreateFornecedor({ data: newF }),
        errorTitle: "Não foi possível salvar",
        errorFallback: (newF) => `Falha ao adicionar ${newF.nome}.`,
        logTag: "addFornecedor",
      }),

    restoreFornecedor: (f) =>
      runOptimistic<Fornecedor>({
        requireAuth: true,
        apply: (prev) => ({ next: [...prev, f], payload: f }),
        activity: (f) => ({
          type: "add",
          fornecedorNome: f.nome,
          description: `"${f.nome}" restaurado`,
        }),
        server: (f) => sfCreateFornecedor({ data: f }),
        errorTitle: "Não foi possível restaurar",
        errorFallback: (f) => `Falha ao restaurar ${f.nome}.`,
        logTag: "restoreFornecedor",
      }),

    updateFornecedor: (id, updates) =>
      runOptimistic<Fornecedor>({
        requireAuth: true,
        apply: (prev) => {
          let updated: Fornecedor | null = null;
          const next = prev.map((f) => {
            if (f.id !== id) return f;
            const merged = { ...f, ...updates };
            const result = { ...merged, status: computeStatus(merged) };
            updated = result;
            return result;
          });
          return updated ? { next, payload: updated } : null;
        },
        activity: (u) => ({
          type: "update",
          fornecedorNome: u.nome,
          description: `${u.nome} atualizado`,
        }),
        server: (u) => sfUpdateFornecedor({ data: u }),
        errorTitle: "Não foi possível atualizar",
        errorFallback: (u) => `Falha ao atualizar ${u.nome}.`,
        logTag: "updateFornecedor",
      }),

    deleteFornecedor: (id) =>
      runOptimistic<{ id: string; nome: string | null }>({
        apply: (prev) => {
          const target = prev.find((f) => f.id === id);
          return {
            next: prev.filter((f) => f.id !== id),
            payload: { id, nome: target?.nome ?? null },
          };
        },
        activity: ({ nome }) =>
          nome
            ? { type: "delete", fornecedorNome: nome, description: `${nome} removido` }
            : null,
        server: ({ id }) => sfDeleteFornecedor({ data: { id } }),
        errorTitle: "Não foi possível remover",
        errorFallback: ({ nome }) =>
          nome ? `Falha ao remover ${nome}.` : "Tente novamente.",
        logTag: "deleteFornecedor",
      }),

    toggleParcelaPaga: (fornecedorId, numero) =>
      runOptimistic<{ updated: Fornecedor; wasPago: boolean }>({
        requireAuth: true,
        apply: (prev) => {
          let updated: Fornecedor | null = null;
          let wasPago = false;
          const next = prev.map((f) => {
            if (f.id !== fornecedorId) return f;
            const parcelas = f.parcelas.map((p) => {
              if (p.numero !== numero) return p;
              wasPago = p.pago;
              return { ...p, pago: !p.pago };
            });
            const result = { ...f, parcelas, status: computeStatus({ parcelas }) };
            updated = result;
            return result;
          });
          return updated ? { next, payload: { updated, wasPago } } : null;
        },
        activity: ({ updated, wasPago }) => {
          const parcela = updated.parcelas.find((p) => p.numero === numero);
          return {
            type: wasPago ? "unpay" : "pay",
            fornecedorNome: updated.nome,
            description: wasPago
              ? `Parcela #${numero} de ${updated.nome} desmarcada`
              : `Parcela #${numero} de ${updated.nome} paga${parcela ? ` (R$ ${parcela.valor.toLocaleString("pt-BR")})` : ""}`,
          };
        },
        server: ({ updated }) =>
          updateFornecedorParcelas({
            data: { id: fornecedorId, parcelas: updated.parcelas, status: updated.status },
          }),
        errorTitle: "Não foi possível salvar a parcela",
        errorFallback: () => `Falha ao atualizar parcela #${numero}.`,
        logTag: "toggleParcelaPaga",
      }),




  setOrcamentoTotal: (v) => {
    set({ orcamentoTotal: v });
    debouncedSaveSettings();
  },

  setSettings: (s) => {
    set((state) => ({ settings: { ...state.settings, ...s } }));
    debouncedSaveSettings();
  },

  saveSettings: async (nextSettings, nextOrcamentoTotal) => {
    const userId = get().userId;
    if (!userId) return false;
    cancelPendingSettingsSave();
    const normalizedSettings = {
      noivos: nextSettings.noivos || "Casal",
      dataCasamento: nextSettings.dataCasamento,
    };
    try {
      await saveUserSettings({
        data: {
          noivos: normalizedSettings.noivos,
          dataCasamento: normalizedSettings.dataCasamento,
          orcamentoTotal: nextOrcamentoTotal,
          darkMode: get().darkMode,
        },
      });
      set({ settings: normalizedSettings, orcamentoTotal: nextOrcamentoTotal });
      return true;
    } catch (e) {
      console.error("[wedding] saveSettings failed", e);
      return false;
    }
  },

  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    debouncedSaveSettings();
  },
  };
});

export function totalPago(f: Fornecedor) {
  return f.parcelas.filter((p) => p.pago).reduce((a, p) => a + p.valor, 0);
}
export function totalPendente(f: Fornecedor) {
  return f.parcelas.filter((p) => !p.pago).reduce((a, p) => a + p.valor, 0);
}
