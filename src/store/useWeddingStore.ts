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

  addFornecedor: async (f) => {
    const userId = get().userId;
    if (!userId) return;
    const newF: Fornecedor = { ...f, id: crypto.randomUUID(), status: computeStatus(f) };
    const prev = get().fornecedores;
    set({ fornecedores: [...prev, newF] });
    get().logActivity({
      type: "add",
      fornecedorNome: newF.nome,
      description:
        newF.tipo === "avulso"
          ? `Compra avulsa adicionada: ${newF.nome}`
          : `Fornecedor adicionado: ${newF.nome}`,
    });
    try {
      await sfCreateFornecedor({ data: newF });
    } catch (e) {
      console.error("[wedding] addFornecedor failed", e);
      set({ fornecedores: prev });
      toast.error("Não foi possível salvar", {
        description: extractErrorMessage(e, `Falha ao adicionar ${newF.nome}.`),
      });
      // swallow: rollback + toast already handled
    }
  },

  restoreFornecedor: async (f) => {
    const userId = get().userId;
    if (!userId) return;
    const prev = get().fornecedores;
    set({ fornecedores: [...prev, f] });
    get().logActivity({
      type: "add",
      fornecedorNome: f.nome,
      description: `"${f.nome}" restaurado`,
    });
    try {
      await sfCreateFornecedor({ data: f });
    } catch (e) {
      console.error("[wedding] restoreFornecedor failed", e);
      set({ fornecedores: prev });
      toast.error("Não foi possível restaurar", {
        description: extractErrorMessage(e, `Falha ao restaurar ${f.nome}.`),
      });
      // swallow: rollback + toast already handled
    }
  },

  updateFornecedor: async (id, updates) => {
    const userId = get().userId;
    if (!userId) return;
    const prev = get().fornecedores;
    let updated: Fornecedor | null = null;
    set({
      fornecedores: prev.map((f) => {
        if (f.id !== id) return f;
        const merged = { ...f, ...updates };
        const next = { ...merged, status: computeStatus(merged) };
        updated = next;
        return next;
      }),
    });
    if (!updated) return;
    const u: Fornecedor = updated;
    get().logActivity({
      type: "update",
      fornecedorNome: u.nome,
      description: `${u.nome} atualizado`,
    });
    try {
      await sfUpdateFornecedor({ data: u });
    } catch (e) {
      console.error("[wedding] updateFornecedor failed", e);
      set({ fornecedores: prev });
      toast.error("Não foi possível atualizar", {
        description: extractErrorMessage(e, `Falha ao atualizar ${u.nome}.`),
      });
      // swallow: rollback + toast already handled
    }
  },

  deleteFornecedor: async (id) => {
    const prev = get().fornecedores;
    const target = prev.find((f) => f.id === id);
    set({ fornecedores: prev.filter((f) => f.id !== id) });
    if (target) {
      get().logActivity({
        type: "delete",
        fornecedorNome: target.nome,
        description: `${target.nome} removido`,
      });
    }
    try {
      await sfDeleteFornecedor({ data: { id } });
    } catch (e) {
      console.error("[wedding] deleteFornecedor failed", e);
      set({ fornecedores: prev });
      toast.error("Não foi possível remover", {
        description: extractErrorMessage(e, target ? `Falha ao remover ${target.nome}.` : "Tente novamente."),
      });
      // swallow: rollback + toast already handled
    }
  },

  toggleParcelaPaga: async (fornecedorId, numero) => {
    const userId = get().userId;
    if (!userId) return;
    const prev = get().fornecedores;
    let updated: Fornecedor | null = null;
    let wasPago = false;
    set({
      fornecedores: prev.map((f) => {
        if (f.id !== fornecedorId) return f;
        const parcelas = f.parcelas.map((p) => {
          if (p.numero !== numero) return p;
          wasPago = p.pago;
          return { ...p, pago: !p.pago };
        });
        const next = { ...f, parcelas, status: computeStatus({ parcelas }) };
        updated = next;
        return next;
      }),
    });
    if (!updated) return;
    const u: Fornecedor = updated;
    const parcela = u.parcelas.find((p) => p.numero === numero);
    get().logActivity({
      type: wasPago ? "unpay" : "pay",
      fornecedorNome: u.nome,
      description: wasPago
        ? `Parcela #${numero} de ${u.nome} desmarcada`
        : `Parcela #${numero} de ${u.nome} paga${parcela ? ` (R$ ${parcela.valor.toLocaleString("pt-BR")})` : ""}`,
    });
    try {
      await updateFornecedorParcelas({
        data: { id: fornecedorId, parcelas: u.parcelas, status: u.status },
      });
    } catch (e) {
      console.error("[wedding] toggleParcelaPaga failed", e);
      set({ fornecedores: prev });
      toast.error("Não foi possível salvar a parcela", {
        description: extractErrorMessage(e, `Falha ao atualizar parcela #${numero}.`),
      });
      // swallow: rollback + toast already handled
    }
  },


  setOrcamentoTotal: (v) => {
    const userId = get().userId;
    set({ orcamentoTotal: v });
    if (userId) {
      const state = get();
      void saveUserSettings({
        data: {
          noivos: state.settings.noivos || "Casal",
          dataCasamento: state.settings.dataCasamento,
          orcamentoTotal: v,
          darkMode: state.darkMode,
        },
      }).catch((e) => console.error("[wedding] setOrcamentoTotal failed", e));
    }
  },

  setSettings: (s) => {
    const userId = get().userId;
    set((state) => ({ settings: { ...state.settings, ...s } }));
    if (userId) {
      const state = get();
      void saveUserSettings({
        data: {
          noivos: state.settings.noivos || "Casal",
          dataCasamento: state.settings.dataCasamento,
          orcamentoTotal: state.orcamentoTotal,
          darkMode: state.darkMode,
        },
      }).catch((e) => console.error("[wedding] setSettings failed", e));
    }
  },

  saveSettings: async (nextSettings, nextOrcamentoTotal) => {
    const userId = get().userId;
    if (!userId) return false;
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
    const userId = get().userId;
    const next = !get().darkMode;
    set({ darkMode: next });
    if (userId) {
      const state = get();
      void saveUserSettings({
        data: {
          noivos: state.settings.noivos || "Casal",
          dataCasamento: state.settings.dataCasamento,
          orcamentoTotal: state.orcamentoTotal,
          darkMode: next,
        },
      }).catch((e) => console.error("[wedding] toggleDarkMode failed", e));
    }
  },
}));

export function totalPago(f: Fornecedor) {
  return f.parcelas.filter((p) => p.pago).reduce((a, p) => a + p.valor, 0);
}
export function totalPendente(f: Fornecedor) {
  return f.parcelas.filter((p) => !p.pago).reduce((a, p) => a + p.valor, 0);
}
