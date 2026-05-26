import { useMemo } from "react";
import { useFinancialCalculations, formatCurrency } from "./useFinancialCalculations";

export type AlertSeverity = "info" | "warning" | "destructive";

export interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
}

const CATEGORIA_THRESHOLD = 35; // % do orçamento

export function useSmartAlerts(): SmartAlert[] {
  const { dashboard, gastosPorCategoria, proximasParcelas } = useFinancialCalculations();

  return useMemo(() => {
    const alerts: SmartAlert[] = [];

    // 1. Orçamento estourado
    if (dashboard.orcamentoTotal > 0 && dashboard.percentualUtilizado > 100) {
      alerts.push({
        id: "budget-over",
        severity: "destructive",
        title: "Orçamento estourado",
        description: `Você comprometeu ${formatCurrency(
          Math.abs(dashboard.saldoRestante),
        )} acima do orçamento de ${formatCurrency(dashboard.orcamentoTotal)}.`,
      });
    } else if (dashboard.orcamentoTotal > 0 && dashboard.percentualUtilizado >= 85) {
      alerts.push({
        id: "budget-near",
        severity: "warning",
        title: "Orçamento próximo do limite",
        description: `${dashboard.percentualUtilizado.toFixed(0)}% do orçamento já está comprometido. Restam ${formatCurrency(dashboard.saldoRestante)}.`,
      });
    }

    // 2. Categoria concentrando muito do orçamento
    if (dashboard.orcamentoTotal > 0) {
      for (const g of gastosPorCategoria) {
        const pctOrcamento = (g.total / dashboard.orcamentoTotal) * 100;
        if (pctOrcamento >= CATEGORIA_THRESHOLD) {
          alerts.push({
            id: `cat-${g.categoria}`,
            severity: pctOrcamento >= 50 ? "destructive" : "warning",
            title: `${g.label} concentra ${pctOrcamento.toFixed(0)}% do orçamento`,
            description: `${formatCurrency(g.total)} contratados nessa categoria. Reavalie se está dentro do esperado.`,
          });
        }
      }
    }

    // 3. Parcelas atrasadas
    const atrasadas = proximasParcelas.filter((p) => p.diasRestantes < 0);
    if (atrasadas.length > 0) {
      const total = atrasadas.reduce((a, p) => a + p.valor, 0);
      alerts.push({
        id: "atrasadas",
        severity: "destructive",
        title: `${atrasadas.length} ${atrasadas.length === 1 ? "parcela atrasada" : "parcelas atrasadas"}`,
        description: `${formatCurrency(total)} em pagamentos vencidos. Verifique com ${atrasadas
          .slice(0, 3)
          .map((p) => p.fornecedorNome)
          .join(", ")}${atrasadas.length > 3 ? "…" : "."}`,
      });
    }

    // 4. Parcelas vencendo nos próximos 7 dias
    const proximas7 = proximasParcelas.filter(
      (p) => p.diasRestantes >= 0 && p.diasRestantes <= 7,
    );
    if (proximas7.length > 0) {
      const total = proximas7.reduce((a, p) => a + p.valor, 0);
      alerts.push({
        id: "proximas-7d",
        severity: "warning",
        title: `${proximas7.length} ${proximas7.length === 1 ? "parcela vence" : "parcelas vencem"} em 7 dias`,
        description: `${formatCurrency(total)} a pagar até ${proximas7[proximas7.length - 1]?.data ?? ""}.`,
      });
    }

    return alerts;
  }, [dashboard, gastosPorCategoria, proximasParcelas]);
}
