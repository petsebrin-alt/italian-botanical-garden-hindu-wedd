"use client";

import { useEffect, useRef, useState } from "react";
import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { useScene } from "@/lib/scene";
import { LensCarousel, type LensLayout } from "@/lib/lens";
import { LotusDivider } from "@/components/Ornaments";
import "./memories.css";

const AUTOPLAY = 2200;
const mod = (a: number, n: number) => ((a % n) + n) % n;

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M15 5 L8 12 L15 19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * S04 · Sweet Memories: the couple's photographs on a curved lens carousel (src/lib/lens.ts).
 * The photograph in the middle is flat and sharp; its neighbours curve away to either side.
 * It moves on its own every few seconds, and follows a drag or swipe, the arrows, the dots and
 * the arrow keys. The title above changes with the photograph.
 */
export default function Memories() {
  const items = wedding.memories;
  const n = items.length;
  const [active, setActive] = useState(0);
  const [flat, setFlat] = useState(false);
  const { tier, paused } = useMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const api = useRef<{ go: (i: number) => void; step: (d: number) => void } | null>(null);
  const pausedNow = useRef(paused);
  pausedNow.current = paused;
  const ref = useScene<HTMLElement>();

  useEffect(() => {
    const canvas = canvasRef.current!, stage = stageRef.current!;
    const imgs = Array.from(stage.querySelectorAll<HTMLImageElement>(".mem-src img"));
    const still = tier === "C";
    const st = { pos: 0 };
    let lens: LensCarousel | null = null;
    let L: LensLayout = { cardW: 1, cardH: 1, gap: 0, radius: 0, bend: 0 };
    let w = 0, h = 0, dpr = 1, vel = 0, last = 0, visible = false, dragging = false, hover = false, dirty = true;

    const layout = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      canvas.width = w; canvas.height = h;
      const phone = r.width < 700;
      const cardH = h * (phone ? 0.74 : 0.7);
      const cardW = Math.min(cardH * 0.8, w * (phone ? 0.6 : 0.36));
      L = { cardW, cardH: cardW * 1.25, gap: cardW * (phone ? 0.07 : 0.08), radius: 14 * dpr, bend: phone ? 0.13 : 0.34 };
      dirty = true;
    };
    const pitchCss = () => (L.cardW + L.gap) / dpr;
    const sync = () => {
      const i = mod(Math.round(st.pos), n);
      setActive((a) => (a === i ? a : i));
    };
    const draw = () => {
      if (!lens) return;
      // moving the band bends the lens a little more: the "liquid" feel
      lens.draw(st.pos, { ...L, bend: L.bend + Math.min(0.28, Math.abs(vel) * 0.35) }, w, h);
    };
    const tick = (_t: number, dms: number) => {
      const dt = Math.max(1, dms) / 1000;
      const v = (st.pos - last) / dt;
      last = st.pos;
      vel += (v - vel) * Math.min(1, dt * 10);
      if (Math.abs(vel) < 0.002 && Math.abs(v) < 1e-5 && !dirty) return;
      dirty = false;
      draw();
    };
    const tweenTo = (target: number) => {
      if (still) { st.pos = target; sync(); dirty = true; draw(); return; }
      gsap.to(st, { pos: target, duration: 0.95, ease: "power3.out", overwrite: true, onUpdate: sync });
    };
    const go = (i: number) => {
      // the nearest way round to photograph i
      const cur = Math.round(st.pos);
      const d = mod(i - cur + Math.floor(n / 2), n) - Math.floor(n / 2);
      tweenTo(cur + d);
    };
    const step = (d: number) => tweenTo(Math.round(st.pos) + d);
    api.current = { go, step };

    // drag and swipe
    let startX = 0, startPos = 0, lastX = 0, lastT = 0, vx = 0;
    const down = (e: PointerEvent) => {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      gsap.killTweensOf(st);
      startX = lastX = e.clientX; startPos = st.pos; lastT = performance.now(); vx = 0;
      stage.classList.add("is-dragging");
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      vx = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
      st.pos = startPos - (e.clientX - startX) / pitchCss();
      sync();
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      const fling = (-vx * 1000 * 0.22) / pitchCss();
      tweenTo(Math.round(st.pos + Math.max(-2, Math.min(2, fling))));
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    const enter = () => { hover = true; }, leave = () => { hover = false; };
    stage.addEventListener("pointerenter", enter);
    stage.addEventListener("pointerleave", leave);

    // dynamic auto-slide: turns automatically while visible and idle
    let isScrolling = false;
    let scrollTimer: ReturnType<typeof setTimeout>;

    const timer = window.setInterval(() => {
      if (visible && !dragging && !hover && !isScrolling && !pausedNow.current && !still && document.visibilityState === "visible") {
        step(1);
      }
    }, AUTOPLAY);

    // scroll-driven: automatically slides through all slides as the user scrolls down the section
    const scrollTrig = ScrollTrigger.create({
      trigger: stage,
      start: "top 85%",
      end: "bottom 15%",
      onUpdate: (self) => {
        if (dragging) return;
        isScrolling = true;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => { isScrolling = false; }, 350);

        const target = self.progress * (n - 1);
        if (still) {
          st.pos = target;
          sync();
          dirty = true;
          draw();
        } else {
          gsap.to(st, {
            pos: target,
            duration: 0.45,
            ease: "power1.out",
            overwrite: "auto",
            onUpdate: () => { sync(); dirty = true; draw(); },
          });
        }
      },
    });

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) { dirty = true; gsap.ticker.add(tick); } else gsap.ticker.remove(tick);
    }, { rootMargin: "120px" });
    const ro = new ResizeObserver(() => { layout(); draw(); });

    // the photographs start loading as the section comes near, and the lens starts once they're in
    let alive = true;
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      imgs.forEach((im) => { im.loading = "eager"; });
      Promise.all(imgs.map((im) => im.decode().catch(() => undefined))).then(() => {
        if (!alive) return;
        lens = LensCarousel.create(canvas, imgs);
        if (!lens) { setFlat(true); return; }
        layout();
        draw();
        ro.observe(canvas);
        io.observe(stage);
      });
    }, { rootMargin: "900px 0px" });
    near.observe(stage);

    return () => {
      alive = false;
      window.clearInterval(timer);
      clearTimeout(scrollTimer);
      scrollTrig.kill();
      near.disconnect(); io.disconnect(); ro.disconnect();
      gsap.ticker.remove(tick);
      gsap.killTweensOf(st);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      stage.removeEventListener("pointerenter", enter);
      stage.removeEventListener("pointerleave", leave);
      api.current = null;
    };
  }, [n, tier]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); api.current?.step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); api.current?.step(-1); }
  };
  const m = items[active];

  return (
    <section ref={ref} id="memories" className={`mem section paper${flat ? " mem--flat" : ""}`} aria-labelledby="mem-title" data-stage>
      <header className="container center mem-head">
        <p className="eyebrow" data-reveal="fade">Moments we treasure</p>
        <h2 id="mem-title" className="script" data-reveal="up">Sweet Memories</h2>
        <LotusDivider className="mem-ornament" />
      </header>

      <div className="mem-now center" aria-live="polite">
        <p key={active} className="mem-now-text">
          <span className="mem-now-title names">{m.title}</span>
          <span className="mem-now-caption body-s">{m.caption}</span>
        </p>
      </div>

      <div ref={stageRef} className="mem-stage" tabIndex={0} role="group" aria-roledescription="carousel"
        aria-label={`Sweet memories, photograph ${active + 1} of ${n}: ${m.title}`} onKeyDown={onKey} data-reveal="fade">
        <canvas ref={canvasRef} className="mem-canvas" aria-hidden="true" />
        <ul className="mem-src">
          {items.map((it, i) => (
            <li key={it.image} aria-hidden={i !== active}>
              <img src={`${it.image}.webp`} alt={it.alt} width={640} height={800} loading="lazy" decoding="async" draggable={false} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mem-controls">
        <button type="button" className="mem-arrow" onClick={() => api.current?.step(-1)} aria-label="Previous photograph"><Arrow /></button>
        <span className="mem-count names" aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
        <span className="mem-dots">
          {items.map((it, i) => (
            <button key={it.image} type="button" className={`mem-dot${i === active ? " is-on" : ""}`} onClick={() => api.current?.go(i)}
              aria-label={`Photograph ${i + 1}: ${it.title}`} aria-current={i === active} />
          ))}
        </span>
        <button type="button" className="mem-arrow" onClick={() => api.current?.step(1)} aria-label="Next photograph"><Arrow flip /></button>
      </div>
    </section>
  );
}
