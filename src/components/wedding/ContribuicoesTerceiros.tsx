import { motion } from "motion/react";
import { Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "./SectionHeader";
import { formatCurrency, type TerceiroBucket } from "@/hooks/useFinancialCalculations";

interface Props {
  buckets: TerceiroBucket[];
}

export function ContribuicoesTerceiros({ buckets }: Props) {
  if (buckets.length === 0) return null;

  const totalGeral = buckets.reduce((a, b) => a + b.total, 0);

  return (
    <section className="space-y-5">
      <SectionHeader
        kicker="Apoio"
        title="Contribuições de terceiros"
        hint={`${formatCurrency(totalGeral)} em apoio recebido`}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map((b, idx) => (
          <motion.div
            key={b.pagoPor}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: idx * 0.05,
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Card className="p-5 h-full border-l-4 border-l-primary/60 bg-accent/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg p-1.5 bg-primary/10 text-primary">
                  <Gift className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{b.label}</p>
                <span className="ml-auto text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {b.count} {b.count === 1 ? "item" : "itens"}
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground mb-1">
                {formatCurrency(b.total)}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {formatCurrency(b.pago)} pago · {formatCurrency(b.pendente)} a pagar
              </p>
              <ul className="space-y-1.5">
                {b.fornecedores.map((f) => (
                  <li
                    key={f.nome}
                    className="flex items-center justify-between text-xs text-muted-foreground"
                  >
                    <span className="truncate pr-2">{f.nome}</span>
                    <span className="tabular-nums shrink-0">{formatCurrency(f.valorTotal)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
