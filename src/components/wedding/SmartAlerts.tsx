import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSmartAlerts, type AlertSeverity } from "@/hooks/useSmartAlerts";

const styleMap: Record<AlertSeverity, { bg: string; icon: typeof Info }> = {
  info: { bg: "border-primary/30 bg-primary/5", icon: Info },
  warning: {
    bg: "border-[var(--warning)]/40 bg-[var(--warning)]/10",
    icon: AlertTriangle,
  },
  destructive: {
    bg: "border-destructive/40 bg-destructive/10",
    icon: ShieldAlert,
  },
};

export function SmartAlerts() {
  const alerts = useSmartAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {visible.map((a) => {
          const s = styleMap[a.severity];
          const Icon = s.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className={cn("p-3 sm:p-4 border flex items-start gap-3", s.bg)}>
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 mt-0.5",
                    a.severity === "destructive"
                      ? "text-destructive"
                      : a.severity === "warning"
                        ? "text-[var(--warning)]"
                        : "text-primary",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 -mr-1 -mt-1"
                  onClick={() =>
                    setDismissed((prev) => {
                      const next = new Set(prev);
                      next.add(a.id);
                      return next;
                    })
                  }
                  aria-label="Dispensar alerta"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
