interface Props {
  kicker: string;
  title: string;
  hint?: string;
}

export function SectionHeader({ kicker, title, hint }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span aria-hidden className="block h-px w-8 bg-sage/60" />
        <div>
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-sage">
            {kicker}
          </p>
          <h2 className="font-display text-xl sm:text-2xl text-foreground leading-tight">
            {title}
          </h2>
        </div>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground tabular-nums">{hint}</p>
      )}
    </div>
  );
}
