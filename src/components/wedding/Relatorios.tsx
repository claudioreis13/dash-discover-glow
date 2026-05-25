import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  formatCurrency,
  useFinancialCalculations,
} from "@/hooks/useFinancialCalculations";
import { useWeddingStore } from "@/store/useWeddingStore";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Relatorios() {
  const { fornecedores } = useWeddingStore();
  const { gastosPorCategoria, dashboard } = useFinancialCalculations();

  // Pagamentos por mês (todos)
  const porMes = new Map<string, { pago: number; previsto: number }>();
  for (const f of fornecedores) {
    for (const p of f.parcelas) {
      if (!p.dataPagamento || p.dataPagamento.length < 7) continue;
      const key = p.dataPagamento.slice(0, 7);
      const cur = porMes.get(key) ?? { pago: 0, previsto: 0 };
      if (p.pago) cur.pago += p.valor;
      else cur.previsto += p.valor;
      porMes.set(key, cur);
    }
  }
  const mesesData = Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const d = parseISO(key + "-01");
      const mes = isNaN(d.getTime())
        ? key
        : format(d, "MMM/yy", { locale: ptBR });
      return { mes, ...v };
    });

  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Contratos
          </p>
          <p className="text-2xl font-semibold mt-2">
            {dashboard.contratosTotal}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Ticket médio
          </p>
          <p className="text-2xl font-semibold mt-2 tabular-nums">
            {formatCurrency(
              dashboard.contratosTotal > 0
                ? dashboard.valorComprometido / dashboard.contratosTotal
                : 0,
            )}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Saldo disponível
          </p>
          <p
            className={`text-2xl font-semibold mt-2 tabular-nums ${
              dashboard.saldoRestante < 0 ? "text-destructive" : ""
            }`}
          >
            {formatCurrency(dashboard.saldoRestante)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pagamentos por mês</h3>
        <div className="w-full h-72">
          {mesesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Cadastre fornecedores para visualizar
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={mesesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="pago"
                  name="Pago"
                  fill="var(--success)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="previsto"
                  name="Previsto"
                  fill="var(--olive)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Resumo por categoria
        </h3>
        {gastosPorCategoria.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem dados ainda
          </p>
        ) : (
          <div className="space-y-3">
            {gastosPorCategoria.map((g) => (
              <div key={g.categoria}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{g.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(g.pago)} / {formatCurrency(g.total)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${g.total > 0 ? (g.pago / g.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
