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
  } as never;
}

const DEFAULT_SETTINGS: Settings = {
  noivos: "Casal",
  dataCasamento: "",
};

function settingsToRow(
  userId: string,
  settings: Settings,
  orcamentoTotal: number,
  darkMode: boolean,
) {
  return {
    user_id: userId,
    noivos: settings.noivos || "Casal",
    data_casamento: settings.dataCasamento || null,
    orcamento_total: orcamentoTotal,
    dark_mode: darkMode,
  } as never;
}

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
      const u: Fornecedor = updated;
      const row = fornecedorToRow(u, userId) as Record<string, unknown>;
      delete row.id;
      delete row.user_id;
      await supabase.from("fornecedores").update(row as never).eq("id", id);
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
      const u: Fornecedor = updated;
      await supabase
        .from("fornecedores")
        .update({ parcelas: u.parcelas as unknown as object, status: u.status } as never)
        .eq("id", fornecedorId);
    }
  },

  setOrcamentoTotal: (v) => {
    const userId = get().userId;
    set({ orcamentoTotal: v });
    if (userId) {
      const state = get();
      void supabase.from("user_settings").upsert(
        settingsToRow(userId, state.settings, v, state.darkMode),
        { onConflict: "user_id" },
      );
    }
  },

  setSettings: (s) => {
    const userId = get().userId;
    set((state) => ({ settings: { ...state.settings, ...s } }));
    if (userId) {
      const state = get();
      void supabase.from("user_settings").upsert(
        settingsToRow(userId, state.settings, state.orcamentoTotal, state.darkMode),
        { onConflict: "user_id" },
      );
    }
  },

  toggleDarkMode: () => {
    const userId = get().userId;
    const next = !get().darkMode;
    set({ darkMode: next });
    if (userId) {
      const state = get();
      void supabase.from("user_settings").upsert(
        settingsToRow(userId, state.settings, state.orcamentoTotal, next),
        { onConflict: "user_id" },
      );
    }
  },
}));

export function totalPago(f: Fornecedor) {
  return f.parcelas.filter((p) => p.pago).reduce((a, p) => a + p.valor, 0);
}
export function totalPendente(f: Fornecedor) {
  return f.parcelas.filter((p) => !p.pago).reduce((a, p) => a + p.valor, 0);
}
