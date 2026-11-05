"use client";

/**
 * The opening gate (src/scenes/gate) and the hero share one small state:
 *   closed     the gate covers the page (it is server-rendered, so this is the first paint)
 *   revealing  the gate is dissolving into the hero's sky: the hero starts its own intro
 *   gone       no gate (already opened, skipped for a #section link, or never shown)
 */
export type GatePhase = "closed" | "revealing" | "gone";

let phase: GatePhase =
  typeof window === "undefined" || window.location.hash || document.documentElement.classList.contains("no-gate")
    ? "gone"
    : "closed";
const subs = new Set<(p: GatePhase) => void>();

export const gatePhase = () => phase;

export function setGatePhase(p: GatePhase) {
  if (p === phase) return;
  phase = p;
  subs.forEach((f) => f(p));
}

/** Resolves once the gate is no longer hiding the hero (immediately if there is none). */
export function gateRevealed(): Promise<void> {
  if (phase !== "closed") return Promise.resolve();
  return new Promise((resolve) => {
    const f = (p: GatePhase) => {
      if (p !== "closed") {
        subs.delete(f);
        resolve();
      }
    };
    subs.add(f);
  });
}
