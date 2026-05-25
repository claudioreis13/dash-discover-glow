import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Fornecedor, StatusType } from "@/types/wedding";

interface Settings {
  noivos: string;
  dataCasamento: string; // ISO yyyy-mm-dd
}

interface WeddingStore {
  fornecedores: Fornecedor[];
  orcamentoTotal: number;
  darkMode: boolean;
  settings: Settings;
  hydrated: boolean;
  userId: string | null;

  loadForUser: (userId: string) => Promise<void>;
  resetLocal: () => void;

  addFornecedor: (f: Omit<Fornecedor, "id">) => Promise<void>;
  restoreFornecedor: (f: Fornecedor) => Promise<void>;
  updateFornecedor: (id: string, f: Partial<Fornecedor>) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
  toggleParcelaPaga: (fornecedorId: string, numero: number) => Promise<void>;
  setOrcamentoTotal: (v: number) => void;
  setSettings: (s: Partial<Settings>) => void;
  toggleDarkMode: () => void;
}

export function computeStatus(f: Pick<Fornecedor, "parcelas">): StatusType {
  const total = f.parcelas.length;
  const pagas = f.parcelas.filter((p) => p.pago).length;
  if (total === 0) return "pendente";
  if (pagas === total) return "pago";
  const hoje = new Date();
  const atrasada = f.parcelas.some(
    (p) => !p.pago && new Date(p.dataPagamento) < hoje,
  );
  if (atrasada) return "atrasado";
  if (pagas === 0) return "pendente";
  return "parcial";
}

// DB row → Fornecedor
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

function fornecedorToRow(f: Fornecedor, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    nome: f.nome,
    categoria: f.categoria,
    valor_total: f.valorTotal,
    data_cont: f.dataCont || null,
    vencimento: f.vencimento || null,
    parcelas: f.parcelas,
    status: f.status,
    prioridade: f.prioridade,
    observacoes: f.observacoes ?? "",
    contato: f.contato ?? null,
    email: f.email ?? null,
    tipo: f.tipo ?? null,
  };
}

const DEFAULT_SETTINGS: Settings = {
  noivos: "Casal",
  dataCasamento: "",
};

export const useWeddingStore = create<WeddingStore>()((set, get) => ({
  fornecedores: [],
  orcamentoTotal: 45000,
  darkMode: false,
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  userId: null,

  resetLocal: () =>
    set({
      fornecedores: [],
      orcamentoTotal: 45000,
      settings: DEFAULT_SETTINGS,
      hydrated: false,
      userId: null,
    }),

  loadForUser: async (userId) => {
    set({ userId, hydrated: false });
    const [fornRes, settingsRes] = await Promise.all([
      supabase.from("fornecedores").select("*").order("created_at", { ascending: true }),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const fornecedores = (fornRes.data ?? []).map((r) => rowToFornecedor(r as FornecedorRow));

    let settings = DEFAULT_SETTINGS;
    let orcamentoTotal = 45000;
    let darkMode = false;

    if (settingsRes.data) {
      settings = {
        noivos: settingsRes.data.noivos ?? "Casal",
        dataCasamento: settingsRes.data.data_casamento ?? "",
      };
      orcamentoTotal = Number(settingsRes.data.orcamento_total) || 45000;
      darkMode = !!settingsRes.data.dark_mode;
    } else {
      // ensure row exists
      await supabase.from("user_settings").insert({ user_id: userId });
    }

    set({ fornecedores, settings, orcamentoTotal, darkMode, hydrated: true });
  },

  addFornecedor: async (f) => {
    const userId = get().userId;
    if (!userId) return;
    const newF: Fornecedor = { ...f, id: crypto.randomUUID(), status: computeStatus(f) };
    set((s) => ({ fornecedores: [...s.fornecedores, newF] }));
    await supabase.from("fornecedores").insert(fornecedorToRow(newF, userId));
  },

  restoreFornecedor: async (f) => {
    const userId = get().userId;
    if (!userId) return;
    set((s) => ({ fornecedores: [...s.fornecedores, f] }));
    await supabase.from("fornecedores").insert(fornecedorToRow(f, userId));
  },

  updateFornecedor: async (id, updates) => {
    const userId = get().userId;
    if (!userId) return;
    let updated: Fornecedor | null = null;
    set((s) => ({
      fornecedores: s.fornecedores.map((f) => {
        if (f.id !== id) return f;
        const merged = { ...f, ...updates };
        const next = { ...merged, status: computeStatus(merged) };
        updated = next;
        return next;
      }),
    }));
    if (updated) {
      const row = fornecedorToRow(updated, userId);
      const { id: _id, user_id: _u, ...rest } = row;
      await supabase.from("fornecedores").update(rest).eq("id", id);
    }
  },

  deleteFornecedor: async (id) => {
    set((s) => ({ fornecedores: s.fornecedores.filter((f) => f.id !== id) }));
    await supabase.from("fornecedores").delete().eq("id", id);
  },

  toggleParcelaPaga: async (fornecedorId, numero) => {
    const userId = get().userId;
    if (!userId) return;
    let updated: Fornecedor | null = null;
    set((s) => ({
      fornecedores: s.fornecedores.map((f) => {
        if (f.id !== fornecedorId) return f;
        const parcelas = f.parcelas.map((p) =>
          p.numero === numero ? { ...p, pago: !p.pago } : p,
        );
        const next = { ...f, parcelas, status: computeStatus({ parcelas }) };
        updated = next;
        return next;
      }),
    }));
    if (updated) {
      await supabase
        .from("fornecedores")
        .update({ parcelas: updated.parcelas, status: updated.status })
        .eq("id", fornecedorId);
    }
  },

  setOrcamentoTotal: (v) => {
    const userId = get().userId;
    set({ orcamentoTotal: v });
    if (userId) {
      void supabase.from("user_settings").update({ orcamento_total: v }).eq("user_id", userId);
    }
  },

  setSettings: (s) => {
    const userId = get().userId;
    set((state) => ({ settings: { ...state.settings, ...s } }));
    if (userId) {
      const payload: Record<string, unknown> = {};
      if (s.noivos !== undefined) payload.noivos = s.noivos;
      if (s.dataCasamento !== undefined) payload.data_casamento = s.dataCasamento || null;
      if (Object.keys(payload).length > 0) {
        void supabase.from("user_settings").update(payload).eq("user_id", userId);
      }
    }
  },

  toggleDarkMode: () => {
    const userId = get().userId;
    const next = !get().darkMode;
    set({ darkMode: next });
    if (userId) {
      void supabase.from("user_settings").update({ dark_mode: next }).eq("user_id", userId);
    }
  },
}));

export function totalPago(f: Fornecedor) {
  return f.parcelas.filter((p) => p.pago).reduce((a, p) => a + p.valor, 0);
}
export function totalPendente(f: Fornecedor) {
  return f.parcelas.filter((p) => !p.pago).reduce((a, p) => a + p.valor, 0);
}
