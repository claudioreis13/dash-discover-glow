import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useWeddingStore } from "@/store/useWeddingStore";
import { useFinancialCalculations, formatCurrency } from "@/hooks/useFinancialCalculations";
import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Heart } from "lucide-react";

function getMonogram(noivos: string): string {
  if (!noivos) return "♥";
  const parts = noivos
    .split(/\s*(?:&|e|\+|y)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  const words = noivos.trim().split(/\s+/);
  return (words[0]?.[0] ?? "♥").toUpperCase();
}

export function HeroCard() {
  const { settings, fornecedores } = useWeddingStore();
  const { dashboard } = useFinancialCalculations();

  const dataCasamento = parseISO(settings.dataCasamento);
  const dataValida = !isNaN(dataCasamento.getTime());

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hoje = mounted ? new Date() : (dataValida ? dataCasamento : new Date());
  const diasRestantes =
    mounted && dataValida ? differenceInCalendarDays(dataCasamento, hoje) : 0;

  // Tempo: começa na contratação mais antiga (ou hoje se nenhum)
  const inicio = fornecedores.length
    ? fornecedores
        .map((f) => parseISO(f.dataCont).getTime())
        .reduce((a, b) => Math.min(a, b), hoje.getTime())
    : hoje.getTime();
  const totalDias = dataValida
    ? Math.max(1, differenceInCalendarDays(dataCasamento, new Date(inicio)))
    : 1;
  const passadosDias = Math.max(
    0,
    differenceInCalendarDays(hoje, new Date(inicio)),
  );
  const pctTempo =
    mounted && dataValida ? Math.min(100, (passadosDias / totalDias) * 100) : 0;


  const pctFin =
    dashboard.valorComprometido > 0
      ? (dashboard.valorPago / dashboard.valorComprometido) * 100
      : 0;

  const adiantado = pctFin >= pctTempo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-primary/8 via-card to-accent/30 border-primary/20 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative grid md:grid-cols-[1fr_auto] gap-5 md:gap-6 md:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Saldo disponível
              </p>
            </div>
            <div>
              <p
                className={`text-3xl sm:text-4xl md:text-5xl font-semibold tabular-nums break-words ${
                  dashboard.saldoRestante < 0
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {formatCurrency(dashboard.saldoRestante)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                de {formatCurrency(dashboard.orcamentoTotal)} —{" "}
                {formatCurrency(dashboard.valorComprometido)} comprometido
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <ProgressLine
                label="Tempo até o casamento"
                pct={pctTempo}
                hint={
                  dataValida
                    ? `${diasRestantes >= 0 ? diasRestantes : 0} dias restantes`
                    : "defina a data nas configurações"
                }
                tone="time"
              />
              <ProgressLine
                label="Pagamentos efetuados"
                pct={pctFin}
                hint={`${formatCurrency(dashboard.valorPago)} pagos`}
                tone="money"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 md:pt-0 md:border-t-0 md:border-l md:pl-6 md:border-border/60">
            <p className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">
              Ritmo
            </p>
            <p
              className={`text-2xl font-semibold mt-1 ${
                adiantado ? "text-[var(--success)]" : "text-[var(--warning)]"
              }`}
            >
              {adiantado ? "Em dia" : "Atrás"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 md:max-w-[180px]">
              {adiantado
                ? "Pagamentos acompanham o cronograma."
                : `Pagamentos ${(pctTempo - pctFin).toFixed(0)}pp atrás do tempo passado.`}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ProgressLine({
  label,
  pct,
  hint,
  tone,
}: {
  label: string;
  pct: number;
  hint: string;
  tone: "time" | "money";
}) {
  const color = tone === "time" ? "bg-sage" : "bg-primary";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">
          {pct.toFixed(0)}% • {hint}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
