interface Props {
  /** Array of booleans: true = paid, false = pending */
  parcelas: boolean[];
  className?: string;
}

/**
 * Sequential strip of parcel dots — filled = pago, outlined = pendente.
 * Caps at 24 dots; collapses extras into a "+N" pill on the right.
 */
export function ParcelStrip({ parcelas, className }: Props) {
  if (parcelas.length === 0) return null;
  const MAX = 24;
  const visible = parcelas.slice(0, MAX);
  const overflow = parcelas.length - visible.length;

  return (
    <div
      className={`flex flex-wrap items-center gap-[3px] ${className ?? ""}`}
      aria-label={`${parcelas.filter(Boolean).length} de ${parcelas.length} parcelas pagas`}
    >
      {visible.map((pago, i) => (
        <span
          key={i}
          aria-hidden
          className={`block h-1.5 w-1.5 rounded-full transition-colors ${
            pago
              ? "bg-[var(--success)]"
              : "bg-transparent border border-muted-foreground/40"
          }`}
        />
      ))}
      {overflow > 0 && (
        <span className="ml-1 text-[9px] font-semibold text-muted-foreground tabular-nums">
          +{overflow}
        </span>
      )}
    </div>
  );
}
