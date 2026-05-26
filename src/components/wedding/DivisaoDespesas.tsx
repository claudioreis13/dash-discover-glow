import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useWeddingStore, totalPago, totalPendente } from "@/store/useWeddingStore";
import { PAGO_POR_LABELS, type PagoPorType } from "@/types/wedding";
import { formatCurrency } from "@/hooks/useFinancialCalculations";

interface Bucket {
  key: PagoPorType | "indefinido";
  label: string;
  total: number;
  pago: number;
  pendente: number;
  count: number;
}

export function DivisaoDespesas() {
  const fornecedores = useWeddingStore((s) => s.fornecedores);

  const map = new Map<string, Bucket>();
  for (const f of fornecedores) {
    const key = (f.pagoPor ?? "indefinido") as Bucket["key"];
    const label =
      key === "indefinido" ? "Não especificado" : PAGO_POR_LABELS[key as PagoPorType];
    const cur = map.get(key) ?? { key, label, total: 0, pago: 0, pendente: 0, count: 0 };
    cur.total += f.valorTotal;
    cur.pago += totalPago(f);
    cur.pendente += totalPendente(f);
    cur.count += 1;
    map.set(key, cur);
  }

  const buckets = Array.from(map.values()).sort((a, b) => b.total - a.total);
  const grandTotal = buckets.reduce((a, b) => a + b.total, 0);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-sage" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Divisão de despesas
        </h3>
      </div>

      {buckets.length === 0 || grandTotal === 0 ? (
        <p className="text-sm text-muted-foreground">
          Defina <span className="font-medium text-foreground">"pago por"</span> em
          cada fornecedor para ver a divisão entre noivos e famílias.
        </p>
      ) : (
        <div className="space-y-3">
          {buckets.map((b) => {
            const pct = grandTotal > 0 ? (b.total / grandTotal) * 100 : 0;
            return (
              <div key={b.key}>
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <span className="font-medium">{b.label}</span>
                  <span className="tabular-nums text-muted-foreground text-xs">
                    {formatCurrency(b.total)} · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {b.count} {b.count === 1 ? "item" : "itens"} ·{" "}
                  {formatCurrency(b.pago)} pago · {formatCurrency(b.pendente)} a pagar
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
