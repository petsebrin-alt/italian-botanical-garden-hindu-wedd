"use client";

import { useEffect, useRef, useState } from "react";
import { wedding } from "@/content/wedding";
import { weddingInstant } from "@/lib/dates";
import { useMotion } from "@/lib/motion";
import { Crumpler } from "@/lib/crumple";

/**
 * The countdown as four little tear-off calendar pads (days, hours, minutes, seconds), each on
 * its gold rings. When a number changes, its page is crumpled into a paper ball and tossed away
 * (src/lib/crumple.ts), and the next page, already showing the new number, is underneath.
 *
 * Each pad is drawn on its own canvas (the stack of pages and the top page), and the crumpling
 * page is drawn with exactly the same drawing, so the hand-over is seamless.
 */
type Parts = { d: number; h: number; m: number; s: number };
const UNITS = [["d", "Days"], ["h", "Hours"], ["m", "Minutes"], ["s", "Seconds"]] as const;

/** The top page's place in its pad, as fractions of the pad. */
const PAGE = { x: 0.04, y: 0.11, w: 0.86, h: 0.8 };

function partsAt(now: number): Parts | null {
  const diff = weddingInstant().getTime() - now;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const venueDay = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: wedding.timezone }).format(t);

/** One calendar page, drawn at (0, 0) w x h (css px) in ctx. */
function drawPage(ctx: CanvasRenderingContext2D, w: number, h: number, label: string, value: string, font: string) {
  const r = w * 0.06;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();
  const paper = ctx.createLinearGradient(0, 0, 0, h);
  paper.addColorStop(0, "#fffdf6");
  paper.addColorStop(1, "#f3e9d3");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  // the paper's own grain
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = "rgba(120, 98, 60, 0.06)";
  for (let i = 0; i < (w * h) / 26; i++) ctx.fillRect(rnd() * w, rnd() * h, 0.8, 0.8);
  // the coloured head of the page
  const band = h * 0.27;
  const gold = ctx.createLinearGradient(0, 0, 0, band);
  gold.addColorStop(0, "#c9a764");
  gold.addColorStop(1, "#a7813f");
  ctx.fillStyle = gold;
  ctx.fillRect(0, 0, w, band);
  ctx.fillStyle = "rgba(255, 250, 238, 0.55)";
  ctx.fillRect(0, band - 1.2, w, 0.8);
  // the holes the rings go through
  ctx.fillStyle = "rgba(70, 52, 26, 0.55)";
  for (const hx of [0.3, 0.7]) { ctx.beginPath(); ctx.ellipse(w * hx, band * 0.3, w * 0.032, w * 0.032, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#fffaf0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(h * 0.085)}px ${font}`;
  try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(h * 0.012).toFixed(1)}px`; } catch { /* older browsers */ }
  ctx.fillText(label.toUpperCase(), w / 2, band * 0.68);
  try { (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px"; } catch { /* ignore */ }
  ctx.fillStyle = "#2c4636";
  ctx.font = `500 ${Math.round(h * (value.length > 2 ? 0.36 : 0.44))}px ${font}`;
  ctx.fillText(value, w / 2, band + (h - band) * 0.5 + h * 0.015);
  ctx.strokeStyle = "rgba(160, 128, 70, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w * 0.18, h * 0.92); ctx.lineTo(w * 0.82, h * 0.92); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(140, 110, 60, 0.28)";
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.roundRect(0.4, 0.4, w - 0.8, h - 0.8, r); ctx.stroke();
}

/** The pad: two pages showing beneath the top one, then the top page. */
function drawPad(canvas: HTMLCanvasElement, label: string, value: string, font: string) {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const pw = W * PAGE.w, ph = H * PAGE.h;
  ctx.save();
  ctx.shadowColor = "rgba(60, 44, 20, 0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  for (const k of [2, 1]) {
    ctx.fillStyle = k === 2 ? "#e7dcc4" : "#efe5cf";
    ctx.beginPath();
    ctx.roundRect(W * PAGE.x + k * 1.6, H * PAGE.y + k * 2.6, pw, ph, pw * 0.06);
    ctx.fill();
    ctx.shadowColor = "transparent";
  }
  ctx.restore();
  ctx.save();
  ctx.translate(W * PAGE.x, H * PAGE.y);
  drawPage(ctx, pw, ph, label, value, font);
  ctx.restore();
}

function pad2(n: number, unit: string) {
  return unit === "d" ? String(n) : String(n).padStart(2, "0");
}

export default function CalendarCountdown({ run }: { run: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState<null | "today" | "married">(null);
  const [spoken, setSpoken] = useState("");
  const { tier } = useMotion();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const pads = Array.from(el.querySelectorAll<HTMLCanvasElement>(".cal-page"));
    const glCanvas = el.querySelector<HTMLCanvasElement>(".cal-gl")!;
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim() || "system-ui, sans-serif";
    let shown: Parts | null = null;
    let visible = true;
    let timer = 0;

    const draw = (p: Parts) => pads.forEach((c, i) => drawPad(c, UNITS[i][1], pad2(p[UNITS[i][0]], UNITS[i][0]), font));
    /** The page as it is now, alone, for the crumple. */
    const pageImage = (i: number, value: string) => {
      const c = pads[i];
      const w = c.clientWidth * PAGE.w, h = c.clientHeight * PAGE.h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const img = document.createElement("canvas");
      img.width = Math.round(w * dpr);
      img.height = Math.round(h * dpr);
      const ctx = img.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawPage(ctx, w, h, UNITS[i][1], value, font);
      return img;
    };

    const tick = () => {
      const now = Date.now();
      const p = partsAt(now);
      if (!p) {
        setDone(venueDay(now) === wedding.date ? "today" : "married");
        return;
      }
      if (!shown) {
        draw(p);
      } else {
        const g = glCanvas.getBoundingClientRect();
        UNITS.forEach(([u, label], i) => {
          if (p[u] === shown![u]) return;
          const old = pad2(shown![u], u);
          if (crumpler && visible) {
            const r = pads[i].getBoundingClientRect();
            crumpler.crumple(pageImage(i, old), {
              x: r.left - g.left + r.width * PAGE.x, y: r.top - g.top + r.height * PAGE.y,
              w: r.width * PAGE.w, h: r.height * PAGE.h,
            });
          }
          drawPad(pads[i], label, pad2(p[u], u), font);
        });
      }
      shown = p;
      timer = window.setTimeout(tick, 1000 - (now % 1000) + 8);
    };

    if (!run) {
      // before the reveal the pads show the countdown as it stands, still
      const p = partsAt(Date.now());
      if (p) draw(p);
      return;
    }
    const crumpler = tier === "C" ? null : Crumpler.create(glCanvas);
    document.fonts.ready.then(() => { if (shown === null) tick(); });
    const speak = () => {
      const p = partsAt(Date.now());
      setSpoken(p ? `${p.d} days, ${p.h} hours and ${p.m} minutes to go` : "");
    };
    speak();
    const minute = window.setInterval(speak, 60_000);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "60px" });
    io.observe(el);
    const ro = new ResizeObserver(() => { crumpler?.resize(); if (shown) draw(shown); });
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(minute);
      io.disconnect();
      ro.disconnect();
      crumpler?.destroy();
    };
  }, [run, tier]);

  if (done) {
    return <p className="cd-done date-display">{done === "today" ? "Today is the day" : "Just married · 15 · 08 · 2027"}</p>;
  }
  return (
    <div ref={wrap} className="cal">
      <p className="sr-only" aria-live="off">{spoken}</p>
      <canvas className="cal-gl" aria-hidden="true" />
      <ol className="cal-pads" aria-hidden="true">
        {UNITS.map(([u, label]) => (
          <li key={u} className="cal-pad">
            <canvas className="cal-page" />
            <span className="cal-rings"><i /><i /></span>
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
