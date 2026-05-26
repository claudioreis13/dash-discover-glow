import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSignature,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MetricCard } from "./MetricCard";
import { BudgetDonut } from "./BudgetDonut";
import { PaymentTimeline } from "./PaymentTimeline";
import { HeroCard } from "./HeroCard";
import { ActivityFeed } from "./ActivityFeed";
import { PaymentCalendar } from "./PaymentCalendar";
import { SectionHeader } from "./SectionHeader";
import { ParcelStrip } from "./ParcelStrip";
import { OverviewSkeleton } from "./OverviewSkeleton";
import { SmartAlerts } from "./SmartAlerts";
import { DivisaoDespesas } from "./DivisaoDespesas";
import {
  formatCurrency,
  useFinancialCalculations,
} from "@/hooks/useFinancialCalculations";
import { useWeddingStore } from "@/store/useWeddingStore";
import type { CategoriaType } from "@/types/wedding";


const formatPct = (n: number) => `${n.toFixed(1)}%`;

export function Overview() {
  const fornecedores = useWeddingStore((s) => s.fornecedores);
  const hydrated = useWeddingStore((s) => s.hydrated);
  const { dashboard, gastosPorCategoria, proximasParcelas } =
    useFinancialCalculations();

  if (!hydrated) {
    return <OverviewSkeleton />;
  }

  if (fornecedores.length === 0) {
    return (
      <div className="space-y-8">
        <HeroCard />
        <Card className="p-10 text-center text-sm text-muted-foreground border-dashed">
          Nenhum fornecedor cadastrado ainda. Vá para a aba{" "}
          <span className="font-medium text-foreground">Início</span> para
          adicionar o primeiro.
        </Card>
      </div>
    );
  }


  const pctPago =
    dashboard.valorComprometido > 0
      ? (dashboard.valorPago / dashboard.valorComprometido) * 100
      : 0;

  // Parcelas por categoria, ordenadas por data → sequência paga/pendente para o sparkline
  const parcelasPorCategoria = new Map<CategoriaType, boolean[]>();
  for (const f of fornecedores) {
    const sorted = [...f.parcelas].sort((a, b) =>
      a.dataPagamento.localeCompare(b.dataPagamento),
    );
    const arr = parcelasPorCategoria.get(f.categoria) ?? [];
    arr.push(...sorted.map((p) => p.pago));
    parcelasPorCategoria.set(f.categoria, arr);
  }

  return (
    <div className="space-y-10">
      <HeroCard />

      <SmartAlerts />



      {/* ───────────── Finanças ───────────── */}
      <section className="space-y-5">
        <SectionHeader
          kicker="Finanças"
          title="Resumo financeiro"
          hint={`${dashboard.contratosTotal} ${dashboard.contratosTotal === 1 ? "fornecedor" : "fornecedores"}`}
        />

        {/* Bento: 4 stat cards + donut spanning 2 cols on the right */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total contratado"
            numeric={dashboard.valorComprometido}
            formatValor={formatCurrency}
            icon={<FileSignature className="w-4 h-4" />}
            tone="default"
            hint={`${dashboard.contratosTotal} ${dashboard.contratosTotal === 1 ? "lançamento" : "lançamentos"}`}
            delay={0}
          />
          <MetricCard
            label="Já pago"
            numeric={dashboard.valorPago}
            formatValor={formatCurrency}
            icon={<CheckCircle2 className="w-4 h-4" />}
            tone="success"
            hint={
              dashboard.valorComprometido > 0
                ? `${pctPago.toFixed(0)}% do contratado`
                : undefined
            }
            delay={0.05}
          />
          <MetricCard
            label="A pagar"
            numeric={dashboard.valorPendente}
            formatValor={formatCurrency}
            icon={<Clock className="w-4 h-4" />}
            tone="warning"
            hint={`${proximasParcelas.length} ${proximasParcelas.length === 1 ? "parcela pendente" : "parcelas pendentes"}`}
            delay={0.1}
          />
          <MetricCard
            label="% do orçamento"
            numeric={dashboard.percentualUtilizado}
            formatValor={formatPct}
            icon={<TrendingUp className="w-4 h-4" />}
            tone={dashboard.percentualUtilizado > 100 ? "destructive" : "accent"}
            hint={
              dashboard.percentualUtilizado > 100
                ? `Estourou em ${formatCurrency(Math.abs(dashboard.saldoRestante))}`
                : dashboard.comprometidoTerceiros > 0
                  ? `Restam ${formatCurrency(dashboard.saldoRestante)} · ${formatCurrency(dashboard.comprometidoTerceiros)} por terceiros`
                  : `Restam ${formatCurrency(dashboard.saldoRestante)}`
            }
            delay={0.15}
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
              comprometido={dashboard.comprometidoCasal}
            />
          </div>
          <PaymentTimeline items={proximasParcelas} />
        </div>
      </section>

      {/* ───────────── Cronograma ───────────── */}
      <section className="space-y-5">
        <SectionHeader
          kicker="Cronograma"
          title="Pagamentos & atividade"
          hint={`${proximasParcelas.length} ${proximasParcelas.length === 1 ? "próxima parcela" : "próximas parcelas"}`}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PaymentCalendar />
          </div>
          <ActivityFeed />
        </div>
      </section>

      <DivisaoDespesas />


      {/* ───────────── Categorias ───────────── */}
      <section className="space-y-5">
        <SectionHeader
          kicker="Categorias"
          title="Gastos por categoria"
          hint={`${gastosPorCategoria.length} ${gastosPorCategoria.length === 1 ? "categoria" : "categorias"}`}
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gastosPorCategoria.map((g, idx) => {
            const parcelas = parcelasPorCategoria.get(g.categoria) ?? [];
            const pagas = parcelas.filter(Boolean).length;
            return (
              <motion.div
                key={g.categoria}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: idx * 0.04,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Card
                  variant="soft"
                  className="p-4 h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:border-sage/40"
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
                  {parcelas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <ParcelStrip parcelas={parcelas} />
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                        {pagas}/{parcelas.length}
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
