import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useWeddingStore } from "@/store/useWeddingStore";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import { CATEGORIA_LABELS } from "@/types/wedding";
import { TrendingUp } from "lucide-react";

export function ParetoCard() {
  const { fornecedores } = useWeddingStore();

  const data = useMemo(() => {
    const ranked = [...fornecedores]
      .filter((f) => f.valorTotal > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal);
    const total = ranked.reduce((a, f) => a + f.valorTotal, 0);
    if (total === 0) return { ranked: [], total: 0, top: [], pctTop: 0, countTop: 0 };

    // Pareto: encontra menor N cujo acumulado >= 80%
    let acc = 0;
    let countTop = 0;
    for (let i = 0; i < ranked.length; i++) {
      acc += ranked[i].valorTotal;
      countTop = i + 1;
      if (acc / total >= 0.8) break;
    }
    const top = ranked.slice(0, countTop);
    const pctTop = (countTop / ranked.length) * 100;
    return { ranked, total, top, pctTop, countTop };
  }, [fornecedores]);

  if (data.total === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-1">Análise de concentração (Pareto)</h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem dados ainda
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Análise de concentração (Pareto)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identifica os poucos fornecedores que somam a maior parte do gasto.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
        <p className="text-sm">
          <strong className="text-primary text-base">{data.pctTop.toFixed(0)}%</strong>{" "}
          dos fornecedores ({data.countTop} de {data.ranked.length}) representam{" "}
          <strong className="text-primary">80%</strong> do gasto total.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Foco de negociação: cortar 10% nesses {data.countTop} pode economizar{" "}
          <strong className="text-foreground">
            {formatCurrency(data.top.reduce((a, f) => a + f.valorTotal, 0) * 0.1)}
          </strong>
          .
        </p>
      </div>

      <div className="space-y-2">
        {data.ranked.slice(0, 8).map((f, i) => {
          const pct = (f.valorTotal / data.total) * 100;
          const isTop = i < data.countTop;
          return (
            <div key={f.id} className="space-y-1">
              <div className="flex justify-between text-sm gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isTop
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="truncate font-medium">{f.nome}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {CATEGORIA_LABELS[f.categoria]}
                  </span>
                </span>
                <span className="tabular-nums text-muted-foreground shrink-0">
                  {formatCurrency(f.valorTotal)}{" "}
                  <span className="text-xs">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${isTop ? "bg-primary" : "bg-muted-foreground/40"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.ranked.length > 8 && (
          <p className="text-xs text-muted-foreground pt-2 text-center">
            + {data.ranked.length - 8} fornecedores menores
          </p>
        )}
      </div>
    </Card>
  );
}
