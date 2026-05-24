import { useMemo } from "react";
import {
  useWeddingStore,
  totalPago,
  totalPendente,
} from "@/store/useWeddingStore";
import type { CategoriaType } from "@/types/wedding";
import { CATEGORIA_LABELS } from "@/types/wedding";

export function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function useFinancialCalculations() {
  const { fornecedores, orcamentoTotal } = useWeddingStore();

  return useMemo(() => {
    const valorComprometido = fornecedores.reduce(
      (a, f) => a + f.valorTotal,
      0,
    );
    const valorPago = fornecedores.reduce((a, f) => a + totalPago(f), 0);
    const valorPendente = fornecedores.reduce(
      (a, f) => a + totalPendente(f),
      0,
    );
    const saldoRestante = orcamentoTotal - valorComprometido;
    const percentualUtilizado =
      orcamentoTotal > 0 ? (valorComprometido / orcamentoTotal) * 100 : 0;

    const porCategoria = new Map<
      CategoriaType,
      { total: number; pago: number; pendente: number }
    >();
    for (const f of fornecedores) {
      const cur = porCategoria.get(f.categoria) ?? {
        total: 0,
        pago: 0,
        pendente: 0,
      };
      cur.total += f.valorTotal;
      cur.pago += totalPago(f);
      cur.pendente += totalPendente(f);
      porCategoria.set(f.categoria, cur);
    }
    const gastosPorCategoria = Array.from(porCategoria.entries())
      .map(([categoria, v]) => ({
        categoria,
        label: CATEGORIA_LABELS[categoria],
        ...v,
        percentual: valorComprometido > 0 ? (v.total / valorComprometido) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Próximos vencimentos (parcelas não pagas, próximos 60 dias)
    const hoje = new Date();
    const proximas = fornecedores
      .flatMap((f) =>
        f.parcelas
          .filter((p) => !p.pago)
          .map((p) => ({
            fornecedorId: f.id,
            fornecedorNome: f.nome,
            categoria: f.categoria,
            numero: p.numero,
            valor: p.valor,
            data: p.dataPagamento,
            diasRestantes: Math.floor(
              (new Date(p.dataPagamento).getTime() - hoje.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          })),
      )
      .sort((a, b) => a.data.localeCompare(b.data));

    return {
      dashboard: {
        orcamentoTotal,
        valorPago,
        valorPendente,
        valorComprometido,
        saldoRestante,
        percentualUtilizado,
        contratosTotal: fornecedores.length,
      },
      gastosPorCategoria,
      proximasParcelas: proximas,
    };
  }, [fornecedores, orcamentoTotal]);
}
