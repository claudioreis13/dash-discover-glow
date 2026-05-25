import type { StatusType } from "@/types/wedding";

export const statusStyle: Record<StatusType, string> = {
  pago: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
  parcial: "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
  pendente: "bg-muted text-muted-foreground border-border",
  atrasado: "bg-destructive/15 text-destructive border-destructive/30",
};
