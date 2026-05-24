import { motion } from "motion/react";
import {
  Wallet,
  CheckCircle2,
  Clock,
  TrendingUp,
  PiggyBank,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MetricCard";
import { BudgetDonut } from "./BudgetDonut";
import { PaymentTimeline } from "./PaymentTimeline";
import {
  formatCurrency,
  useFinancialCalculations,
} from "@/hooks/useFinancialCalculations";

export function Overview() {
  const { dashboard, gastosPorCategoria, proximasParcelas } =
    useFinancialCalculations();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Orçamento"
          valor={formatCurrency(dashboard.orcamentoTotal)}
          icon={<Wallet className="w-4 h-4" />}
          delay={0}
        />
        <MetricCard
          label="Já pago"
          valor={formatCurrency(dashboard.valorPago)}
          icon={<CheckCircle2 className="w-4 h-4" />}
          tone="success"
          delay={0.05}
        />
        <MetricCard
          label="A pagar"
          valor={formatCurrency(dashboard.valorPendente)}
          icon={<Clock className="w-4 h-4" />}
          tone="warning"
          delay={0.1}
        />
        <MetricCard
          label="% utilizado"
          valor={`${dashboard.percentualUtilizado.toFixed(1)}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          tone={dashboard.percentualUtilizado > 100 ? "destructive" : "default"}
          delay={0.15}
        />
        <MetricCard
          label="Saldo disponível"
          valor={formatCurrency(dashboard.saldoRestante)}
          icon={<PiggyBank className="w-4 h-4" />}
          tone={dashboard.saldoRestante < 0 ? "destructive" : "accent"}
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BudgetDonut
            data={gastosPorCategoria.map((g) => ({
              label: g.label,
              value: g.total,
            }))}
            orcamentoTotal={dashboard.orcamentoTotal}
            comprometido={dashboard.valorComprometido}
          />
        </div>
        <PaymentTimeline items={proximasParcelas} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Gastos por categoria
          </h3>
          {gastosPorCategoria.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Adicione fornecedores na aba ao lado para visualizar.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gastosPorCategoria.map((g) => (
                <div
                  key={g.categoria}
                  className="p-4 rounded-xl border border-border/60 bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium">{g.label}</p>
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {g.percentual.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatCurrency(g.total)}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Pago: {formatCurrency(g.pago)}
                  </p>
                  <Progress
                    value={g.total > 0 ? (g.pago / g.total) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
