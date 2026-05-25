import confetti from "canvas-confetti";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const PALETTE = ["#E8B4B8", "#D4AF37", "#A8D5BA", "#F8C8D8", "#FFFFFF"];

/** Pequeno burst ao marcar uma parcela como paga. */
export function celebrateParcela() {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 40,
    spread: 55,
    startVelocity: 28,
    scalar: 0.8,
    ticks: 120,
    gravity: 1,
    origin: { x: 0.5, y: 0.7 },
    colors: PALETTE,
    disableForReducedMotion: true,
  });
}

/** Grande celebração quando o fornecedor é 100% quitado. */
export function celebrateFornecedorQuitado() {
  if (prefersReducedMotion()) return;

  const duration = 1600;
  const end = Date.now() + duration;

  // Disparos laterais contínuos
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      startVelocity: 55,
      origin: { x: 0, y: 0.7 },
      colors: PALETTE,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      startVelocity: 55,
      origin: { x: 1, y: 0.7 },
      colors: PALETTE,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  // Burst central inicial
  confetti({
    particleCount: 120,
    spread: 100,
    startVelocity: 45,
    scalar: 1.1,
    origin: { x: 0.5, y: 0.5 },
    colors: PALETTE,
    disableForReducedMotion: true,
  });
}
