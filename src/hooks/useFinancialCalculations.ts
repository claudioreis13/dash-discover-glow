import { useMemo } from "react";
import {
  useWeddingStore,
  totalPago,
  totalPendente,
} from "@/store/useWeddingStore";
import type { CategoriaType, PagoPorType } from "@/types/wedding";
import { CATEGORIA_LABELS, PAGO_POR_LABELS } from "@/types/wedding";

export interface TerceiroBucket {
  pagoPor: PagoPorType;
  label: string;
  fornecedores: { nome: string; valorTotal: number; pago: number; pendente: number }[];
  total: number;
  pago: number;
  pendente: number;
  count: number;
}

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
    // "Casal" = noivo, noiva, compartilhado, ou não especificado.
    // Pagamentos feitos por terceiros (pais, tios, madrinha, padrinho) ainda
    // aparecem no total contratado, mas NÃO subtraem do orçamento do casal.
    const isCasal = (f: (typeof fornecedores)[number]) =>
      !f.pagoPor ||
      f.pagoPor === "noivo" ||
      f.pagoPor === "noiva" ||
      f.pagoPor === "compartilhado";

    const valorComprometido = fornecedores.reduce(
      (a, f) => a + f.valorTotal,
      0,
    );
    const valorPago = fornecedores.reduce((a, f) => a + totalPago(f), 0);
    const valorPendente = fornecedores.reduce(
      (a, f) => a + totalPendente(f),
      0,
    );

    const comprometidoCasal = fornecedores
      .filter(isCasal)
      .reduce((a, f) => a + f.valorTotal, 0);
    const comprometidoTerceiros = valorComprometido - comprometidoCasal;

    const saldoRestante = orcamentoTotal - comprometidoCasal;
    const percentualUtilizado =
      orcamentoTotal > 0 ? (comprometidoCasal / orcamentoTotal) * 100 : 0;

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

    // Contribuições de terceiros detalhadas
    const terceirosMap = new Map<PagoPorType, TerceiroBucket>();
    for (const f of fornecedores) {
      if (isCasal(f)) continue;
      const key = f.pagoPor as PagoPorType;
      const cur = terceirosMap.get(key) ?? {
        pagoPor: key,
        label: PAGO_POR_LABELS[key],
        fornecedores: [],
        total: 0,
        pago: 0,
        pendente: 0,
        count: 0,
      };
      cur.fornecedores.push({
        nome: f.nome,
        valorTotal: f.valorTotal,
        pago: totalPago(f),
        pendente: totalPendente(f),
      });
      cur.total += f.valorTotal;
      cur.pago += totalPago(f);
      cur.pendente += totalPendente(f);
      cur.count += 1;
      terceirosMap.set(key, cur);
    }
    const terceirosDetalhes = Array.from(terceirosMap.values()).sort((a, b) => b.total - a.total);

    return {
      dashboard: {
        orcamentoTotal,
        valorPago,
        valorPendente,
        valorComprometido,
        comprometidoCasal,
        comprometidoTerceiros,
        saldoRestante,
        percentualUtilizado,
        contratosTotal: fornecedores.length,
      },
      gastosPorCategoria,
      proximasParcelas: proximas,
      terceirosDetalhes,
    };
  }, [fornecedores, orcamentoTotal]);
}
