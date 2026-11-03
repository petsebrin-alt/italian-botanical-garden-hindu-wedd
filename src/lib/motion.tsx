"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Motion levels (PRD §13.4):
 *  A full · B lite (low-end devices) · C static (prefers-reduced-motion).
 * "Pause animations" stops auto-playing ambient motion (WCAG 2.2.2); scroll-driven
 * motion stays because the visitor controls it.
 */
export type Tier = "A" | "B" | "C";

interface MotionState {
  tier: Tier;
  paused: boolean;
  togglePaused: () => void;
}

const Ctx = createContext<MotionState>({ tier: "A", paused: false, togglePaused: () => {} });

function detectTier(): Tier {
  if (typeof window === "undefined") return "A";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "C";
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "C";
  const lowCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  return lowCores || lowMem ? "B" : "A";
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<Tier>("A");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setTier(detectTier());
    try {
      setPaused(localStorage.getItem("jr-paused") === "1");
    } catch {
      /* storage can be unavailable in private windows */
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setTier(detectTier());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("motion-paused", paused);
    document.documentElement.dataset.tier = tier;
  }, [paused, tier]);

  const togglePaused = useCallback(() => {
    setPaused((p) => {
      try {
        localStorage.setItem("jr-paused", p ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !p;
    });
  }, []);

  return <Ctx.Provider value={{ tier, paused, togglePaused }}>{children}</Ctx.Provider>;
}

export const useMotion = () => useContext(Ctx);
