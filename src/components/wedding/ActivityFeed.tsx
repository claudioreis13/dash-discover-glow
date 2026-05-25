import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWeddingStore, type ActivityType } from "@/store/useWeddingStore";

const iconMap: Record<
  ActivityType,
  { Icon: typeof Plus; tone: string }
> = {
  add: { Icon: Plus, tone: "bg-[var(--success)]/15 text-[var(--success)]" },
  update: { Icon: Pencil, tone: "bg-primary/10 text-primary" },
  delete: { Icon: Trash2, tone: "bg-destructive/10 text-destructive" },
  pay: {
    Icon: CheckCircle2,
    tone: "bg-[var(--success)]/15 text-[var(--success)]",
  },
  unpay: { Icon: Circle, tone: "bg-muted text-muted-foreground" },
};

export function ActivityFeed() {
  const activity = useWeddingStore((s) => s.activity);
  const clearActivity = useWeddingStore((s) => s.clearActivity);
  const [expanded, setExpanded] = useState(false);

  if (activity.length === 0) {
    return (
      <Card className="p-6 h-full">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Atividade recente
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Suas ações vão aparecer aqui — fornecedores adicionados, parcelas
          pagas e edições recentes.
        </p>
      </Card>
    );
  }

  const visible = expanded ? activity : activity.slice(0, 5);

  return (
    <Card className="p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sage" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Atividade recente
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearActivity}
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
        >
          Limpar
        </Button>
      </div>

      <ul className="space-y-2.5 flex-1">
        <AnimatePresence initial={false}>
          {visible.map((entry) => {
            const { Icon, tone } = iconMap[entry.type];
            return (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${tone}`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-snug">
                    {entry.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(entry.timestamp, {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {activity.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-xs text-sage hover:text-sage/80 transition-colors self-start cursor-pointer font-medium"
        >
          {expanded
            ? "Ver menos"
            : `Ver mais (${activity.length - 5})`}
        </button>
      )}
    </Card>
  );
}
