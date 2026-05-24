import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Fornecedor, CategoriaType, StatusType } from "@/types/wedding";

interface Settings {
  noivos: string;
  dataCasamento: string; // ISO
}

interface WeddingStore {
  fornecedores: Fornecedor[];
  orcamentoTotal: number;
  darkMode: boolean;
  settings: Settings;

  addFornecedor: (f: Omit<Fornecedor, "id">) => void;
  restoreFornecedor: (f: Fornecedor) => void;
  updateFornecedor: (id: string, f: Partial<Fornecedor>) => void;
  deleteFornecedor: (id: string) => void;
  toggleParcelaPaga: (fornecedorId: string, numero: number) => void;
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

export const useWeddingStore = create<WeddingStore>()(
  persist(
    (set) => ({
      fornecedores: [],
      orcamentoTotal: 45000,
      darkMode: false,
      settings: {
        noivos: "Bruna & Cláudio",
        dataCasamento: "2026-10-10",
      },

      addFornecedor: (f) =>
        set((s) => ({
          fornecedores: [
            ...s.fornecedores,
            { ...f, id: crypto.randomUUID(), status: computeStatus(f) },
          ],
        })),

      updateFornecedor: (id, updates) =>
        set((s) => ({
          fornecedores: s.fornecedores.map((f) => {
            if (f.id !== id) return f;
            const merged = { ...f, ...updates };
            return { ...merged, status: computeStatus(merged) };
          }),
        })),

      deleteFornecedor: (id) =>
        set((s) => ({
          fornecedores: s.fornecedores.filter((f) => f.id !== id),
        })),

      toggleParcelaPaga: (fornecedorId, numero) =>
        set((s) => ({
          fornecedores: s.fornecedores.map((f) => {
            if (f.id !== fornecedorId) return f;
            const parcelas = f.parcelas.map((p) =>
              p.numero === numero ? { ...p, pago: !p.pago } : p,
            );
            return { ...f, parcelas, status: computeStatus({ parcelas }) };
          }),
        })),

      setOrcamentoTotal: (v) => set({ orcamentoTotal: v }),
      setSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    { name: "wedding-store-v2" },
  ),
);

export function totalPago(f: Fornecedor) {
  return f.parcelas.filter((p) => p.pago).reduce((a, p) => a + p.valor, 0);
}
export function totalPendente(f: Fornecedor) {
  return f.parcelas.filter((p) => !p.pago).reduce((a, p) => a + p.valor, 0);
}
