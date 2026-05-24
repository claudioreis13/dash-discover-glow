import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/hooks/useFinancialCalculations";

interface Props {
  data: { label: string; value: number }[];
  orcamentoTotal: number;
  comprometido: number;
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--olive)",
  "var(--sage)",
  "var(--blush)",
];

export function BudgetDonut({ data, orcamentoTotal, comprometido }: Props) {
  const livre = Math.max(orcamentoTotal - comprometido, 0);
  const chartData =
    data.length > 0
      ? [...data, { label: "Disponível", value: livre }]
      : [{ label: "Disponível", value: orcamentoTotal }];

  const pct = orcamentoTotal > 0 ? (comprometido / orcamentoTotal) * 100 : 0;

  return (
    <Card className="p-6 h-full">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Distribuição do orçamento
        </h3>
        <span className="text-xs text-muted-foreground">
          {pct.toFixed(1)}% comprometido
        </span>
      </div>
      <div className="relative w-full h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={entry.label}
                  fill={
                    entry.label === "Disponível"
                      ? "var(--muted)"
                      : COLORS[idx % COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Comprometido</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(comprometido)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            de {formatCurrency(orcamentoTotal)}
          </p>
        </div>
      </div>
    </Card>
  );
}
