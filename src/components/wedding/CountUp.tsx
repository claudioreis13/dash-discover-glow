import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  format: (n: number) => string;
  className?: string;
}

/**
 * Smoothly counts from previous value to `value` whenever it changes.
 * Respects prefers-reduced-motion (renders immediately).
 */
export function CountUp({ value, duration = 900, format, className }: Props) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const current = from + (to - from) * ease(t);
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
