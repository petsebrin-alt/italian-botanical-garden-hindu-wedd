"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/content/wedding";
import { weddingInstant } from "@/lib/dates";

type Parts = { d: number; h: number; m: number; s: number };
type State = { kind: "pending" } | { kind: "counting"; parts: Parts } | { kind: "today" } | { kind: "married" };

function venueDay(t: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: wedding.timezone }).format(t);
}

function compute(now: Date): State {
  const target = weddingInstant();
  const diff = target.getTime() - now.getTime();
  if (diff > 0) {
    const s = Math.floor(diff / 1000);
    return { kind: "counting", parts: { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 } };
  }
  return venueDay(now) === wedding.date ? { kind: "today" } : { kind: "married" };
}

function Digits({ value, pad = 2 }: { value: number; pad?: number }) {
  const str = String(value).padStart(pad, "0");
  return (
    <span className="cd-digits">
      {str.split("").map((ch, i) => (
        // re-keying on the value replays the roll-in only for digits that changed
        <span key={`${i}-${ch}`} className="cd-digit">{ch}</span>
      ))}
    </span>
  );
}

/**
 * Live countdown to the ceremony, correct in every visitor time zone.
 * With `run` false the tiles wait at zero; when it turns true they count up to the real values
 * (each digit rolling in through a soft blur), then tick live.
 */
export default function Countdown({ run = true }: { run?: boolean }) {
  const [state, setState] = useState<State>({ kind: "pending" });
  const [spoken, setSpoken] = useState("");
  const [intro, setIntro] = useState(run ? 1 : 0);

  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1500);
      setIntro(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const next = compute(new Date());
      setState(next);
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    const speak = () => {
      const s = compute(new Date());
      setSpoken(s.kind === "counting" ? `${s.parts.d} days to go` : s.kind === "today" ? "Today is the day" : "Just married");
    };
    speak();
    const minute = window.setInterval(speak, 60_000);
    return () => { window.clearTimeout(timer); window.clearInterval(minute); };
  }, []);

  if (state.kind === "today" || state.kind === "married") {
    return <p className="cd-done date-display">{state.kind === "today" ? "Today is the day" : "Just married · 15 · 08 · 2027"}</p>;
  }
  const p = state.kind === "counting" ? state.parts : null;
  const k = 1 - Math.pow(1 - intro, 3);
  const up = (v: number | undefined) => (v === undefined ? null : Math.round(v * k));
  const tiles: [string, number | null, number][] = [["Days", up(p?.d), 3], ["Hours", up(p?.h), 2], ["Minutes", up(p?.m), 2], ["Seconds", up(p?.s), 2]];
  return (
    <div className="cd">
      <p className="sr-only" aria-live="off">{spoken}</p>
      <ol className="cd-tiles" aria-hidden="true">
        {tiles.map(([label, v, pad]) => (
          <li key={label} className="cd-tile" data-item>
            <span className="cd-num">{v === null ? "—" : <Digits value={v} pad={label === "Days" ? Math.max(1, String(p?.d ?? v).length) : pad} />}</span>
            <span className="cd-label">{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
