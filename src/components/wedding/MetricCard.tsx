import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  label: string;
  valor: string;
  icon: ReactNode;
  tone?: "default" | "success" | "warning" | "destructive" | "accent";
  hint?: string;
  delay?: number;
}

const toneMap = {
  default: "bg-primary/10 text-primary",
  success: "bg-[var(--success)]/15 text-[var(--success)]",
  warning: "bg-[var(--warning)]/20 text-[var(--warning)]",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent text-accent-foreground",
} as const;

export function MetricCard({
  label,
  valor,
  icon,
  tone = "default",
  hint,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="stat" className="p-5 h-full flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <div
            className={cn(
              "rounded-lg p-2 flex items-center justify-center",
              toneMap[tone],
            )}
          >
            {icon}
          </div>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-foreground tracking-tight">
            {valor}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
