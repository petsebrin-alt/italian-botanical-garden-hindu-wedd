"use client";

import { useRef, useState } from "react";
import { preload } from "react-dom";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { gatePhase, setGatePhase } from "@/lib/gate";
import { heroAsset } from "@/lib/heroAsset";
import { Bow, BowRenderer, TIED, posyRest, type BowState, type Posy, type View } from "./ribbon";
import manifest from "../../../public/assets/gate/manifest.json";
import "./gate.css";

/**
 * S00 · The garden gate: the invitation's splash screen.
 *
 * The photographed gate is cut into layers (tools/build_gate.py): the stone pillars and floral
 * arch, and the two wrought-iron leaves with open sky beyond them. The satin bow is one
 * continuous ribbon modelled and lit in 3D (ribbon.ts), with the photographed posy of flowers on
 * its knot. The guest taps (or scrolls, or waits a few seconds): the loops slide back through
 * the knot as it turns and loosens, the knot gives, and the two halves of the ribbon swing down
 * from the stiles, twisting and untwisting, and are drawn away. The flowers drift slowly down to
 * rest on the ground in front of the gate. The leaves swing inward, the camera walks through the
 * gate into the sky, and the gate dissolves into the opening screen.
 */
type Box = { x: number; y: number; w: number; h: number };
const L = manifest.layers as Record<string, Box>;
const C = manifest.canvas;
const POSY = (manifest as unknown as { posy: Box }).posy;
/** If nobody taps, the gate opens by itself after this long (s). */
const AUTO_OPEN = 6;
const BASE = "/assets/gate/";
/** The centre of the gate's opening, where the camera walks through. */
const THROUGH: [number, number] = [C.seam, 880];

/** Hash links (#rsvp) skip the gate before the first paint; scripts off, it never shows. */
const SKIP = `(function(){try{if(location.hash)document.documentElement.classList.add('no-gate')}catch(e){}})();`;
const NO_SCRIPT = `<style>.gate{display:none}</style>`;

function Layer({ name, className = "", lazy = false }: { name: string; className?: string; lazy?: boolean }) {
  const b = L[name];
  const style = { "--x": b.x, "--y": b.y, "--w": b.w, "--h": b.h } as React.CSSProperties;
  return (
    <div className={`gl ${className}`} data-g={name} style={style}>
      <img src={`${BASE}${name}.webp`} alt="" width={b.w} height={b.h} draggable={false}
        decoding="async" loading={lazy ? "lazy" : "eager"} fetchPriority={lazy ? "auto" : "high"} />
    </div>
  );
}

/** One side of the garden beyond the pillars (wide screens only): cypresses, hydrangeas, wisteria. */
function Garden({ side }: { side: "l" | "r" }) {
  const img = (src: string, cls: string) => (
    <img className={cls} src={`/assets/botanical/${src}.webp`} alt="" draggable={false} decoding="async" loading="lazy" />
  );
  return (
    <div className={`gate-garden gate-garden--${side}`}>
      {img("cypress-l", "gg-cypress gg-cypress--3")}
      {img("cypress-r", "gg-cypress gg-cypress--2")}
      {img("cypress-r", "gg-cypress gg-cypress--1")}
      {img("bed-wide", "gg-bed gg-bed--far")}
      {img("bed-l", "gg-bed gg-bed--near")}
      {img("canopy-l", "gg-canopy")}
    </div>
  );
}

/**
 * A link to a section (/#rsvp) skips the gate. The browser jumps to the anchor before the scenes
 * have pinned and measured themselves, so once they have, measure again and land on the section.
 */
let landed = false;
function landOnHash() {
  if (landed) return;
  landed = true;
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  const land = () => {
    ScrollTrigger.refresh();
    window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
  };
  document.fonts.ready.then(() => window.setTimeout(land, 400));
  if (document.readyState === "complete") window.setTimeout(land, 900);
  else window.addEventListener("load", () => window.setTimeout(land, 400), { once: true });
}

export default function Gate() {
  const root = useRef<HTMLDivElement>(null);
  const { tier } = useMotion();
  const [gone, setGone] = useState(false);

  preload(`${BASE}frame.webp`, { as: "image", fetchPriority: "high" });
  preload(`${BASE}door-l.webp`, { as: "image", fetchPriority: "high" });
  preload(`${BASE}door-r.webp`, { as: "image", fetchPriority: "high" });
  preload(`${BASE}bow-posy.webp`, { as: "image", fetchPriority: "high" });

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (gatePhase() === "gone") {
        setGone(true);
        landOnHash();
        return;
      }
      const q = gsap.utils.selector(el);
      const g = (n: string) => q(`[data-g="${n}"]`)[0] as HTMLElement;
      const unit = (q(".gate-unit")[0] as HTMLElement).getBoundingClientRect().width / 1000;
      const world = q(".gate-world")[0] as HTMLElement;
      const far = q(".gate-far")[0] as HTMLElement;

      // ---------------------------------------------------------------- the ribbon, drawn live
      // One screen-sized canvas over the gate holds the ribbon and the posy of flowers, so both can
      // travel off any screen. It follows the gate as the camera walks through it.
      const canvas = q(".gate-ribbon")[0] as HTMLCanvasElement;
      const posyImg = q(".gate-posy-src")[0] as HTMLImageElement;
      const posy: Posy = { x: 0, y: 0, r: 0, scale: 1 };
      const tied: BowState = { ...TIED };
      const bow = new Bow();
      let renderer: BowRenderer | null = null;
      const fade = { ribbon: 1 };
      let k = 1, ox = 0, oy = 0, dpr = 1;
      let view: View = { x0: 0, y0: 0, x1: C.w, y1: C.h };
      const size = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = el.getBoundingClientRect();
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
      };
      // where the gate canvas sits on screen right now (it scales as the camera walks through)
      const place = () => {
        const r = el.getBoundingClientRect();
        const b = world.getBoundingClientRect();
        k = (b.width / C.w) * dpr;
        ox = (b.left - r.left) * dpr;
        oy = (b.top - r.top) * dpr;
        view = { x0: -ox / k, y0: -oy / k, x1: (canvas.width - ox) / k, y1: (canvas.height - oy) / k };
      };
      const paint = () => {
        place();
        renderer?.draw(bow, posy, k, ox, oy, canvas.width, canvas.height, fade.ribbon);
      };
      size();
      const posyReady = posyImg.decode().catch(() => undefined).then(() => {
        renderer = BowRenderer.create(canvas, posyImg, POSY);
        paint();
      });
      let live = true;
      const tick = (_t: number, dms: number) => {
        if (!live) return;
        const dt = Math.min(0.05, dms / 1000);
        bow.tie(tied);
        bow.advance(dt, view);
        paint();
      };
      const ro = new ResizeObserver(() => { size(); paint(); });
      ro.observe(el);

      // ---------------------------------------------------------------- hold the page still
      window.scrollTo(0, 0);
      const keys = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Enter", "Tab"]);
      const block = (e: Event) => { e.preventDefault(); start(); };
      const onKey = (e: KeyboardEvent) => { if (keys.has(e.key)) block(e); };
      const opts = { passive: false } as AddEventListenerOptions;
      window.addEventListener("wheel", block, opts);
      window.addEventListener("touchmove", block, opts);
      window.addEventListener("keydown", onKey);
      el.addEventListener("pointerdown", () => start());
      const release = () => {
        window.removeEventListener("wheel", block, opts);
        window.removeEventListener("touchmove", block, opts);
        window.removeEventListener("keydown", onKey);
      };

      const tl = gsap.timeline({ paused: true, onComplete: finish });
      let started = false, ready = false;
      let autoOpen: gsap.core.Tween | null = null;
      // a tap opens the gate at its own unhurried pace (a second tap changes nothing)
      function start() {
        if (started || !ready) return;
        started = true;
        autoOpen?.kill();
        root.current?.setAttribute("data-opening", "");
        tl.play(0);
      }
      function finish() {
        live = false;
        gsap.ticker.remove(tick);
        release();
        setGatePhase("gone");
        setGone(true);
      }

      const persp = 1150 * unit;
      gsap.set(g("door-l"), { transformOrigin: "0% 50%", transformPerspective: persp });
      gsap.set(g("door-r"), { transformOrigin: "100% 50%", transformPerspective: persp });
      gsap.set([world, far], { transformOrigin: `${THROUGH[0] * unit}px ${THROUGH[1] * unit}px` });

      if (tier === "C") {
        // reduced motion: the gate simply fades into the sky
        tl.to(el, { autoAlpha: 0, duration: 0.8, ease: "none", onStart: () => setGatePhase("revealing") }, 0.3);
      } else {
        const wide = el.clientWidth / el.clientHeight > 0.85;
        const R = 2.35; // the moment the knot gives
        const sway = { p: 0 };
        tl
          // a breath of air: the tails stir, the loops lift a touch
          .to(tied, { sway: 1, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
          // PULL: both loops slide back through the knot, the right one leading
          .to(tied, { loopR: 0.05, duration: 1.55, ease: "power2.inOut" }, 0.6)
          .to(tied, { loopL: 0.05, duration: 1.45, ease: "power2.inOut" }, 0.82)
          // the knot slides down a little and turns as it loosens: twisted, untwisted, twisted back
          .to(tied, { drop: 14, duration: 1.6, ease: "sine.inOut" }, 0.6)
          .to(tied, {
            keyframes: [
              { wobble: 0.1, twist: 0.7, duration: 0.45 },
              { wobble: -0.12, twist: -0.6, duration: 0.5 },
              { wobble: 0.06, twist: 0.35, duration: 0.45 },
              { wobble: 0, twist: 0, duration: 0.35 },
            ],
            ease: "sine.inOut",
          }, 0.6)
          .to(posy, {
            keyframes: [{ r: 5, duration: 0.45 }, { r: -6, duration: 0.5 }, { r: 3, duration: 0.45 }, { r: 0, duration: 0.35 }],
            ease: "sine.inOut",
          }, 0.6)
          .to(posy, { y: 14, duration: 1.6, ease: "sine.inOut" }, 0.6)
          // the band round the knot unwraps
          .to(tied, { open: 0, duration: 0.35, ease: "power1.in" }, R - 0.3)
          // the knot gives: from here each half of the ribbon moves by itself
          .add(() => bow.release(), R)
          // the flowers drift slowly down, swaying, to rest on the ground in front of the gate
          .to(posy, { y: () => posyRest(POSY, view, 1.12), scale: 1.12, duration: 2.8, ease: "sine.inOut" }, R + 0.05)
          .to(sway, {
            p: 1, duration: 2.8, ease: "none",
            onUpdate: () => {
              const p = sway.p, fade = 1 - p;
              posy.x = 16 * Math.sin(p * Math.PI * 2.2) * fade;
              posy.r = 9 * Math.sin(p * Math.PI * 2.2 + 0.6) * fade - 5 * p;
            },
          }, R + 0.05)
          // DOORS: a nudge as the latch gives, then the leaves swing in behind the flowers
          .to(g("door-l"), { rotationY: 1.2, duration: 0.3, ease: "power1.out" }, R + 1.9)
          .to(g("door-r"), { rotationY: -1.2, duration: 0.3, ease: "power1.out" }, R + 1.9)
          .to(g("door-l"), { rotationY: 100, duration: 2.5, ease: "power2.inOut" }, R + 2.2)
          .to(g("door-r"), { rotationY: -100, duration: 2.5, ease: "power2.inOut" }, R + 2.25)
          // (the ribbon is long gone by now; if not, it fades rather than hang in the sky)
          .to(fade, { ribbon: 0, duration: 0.5, ease: "power1.in" }, R + 3.0)
          // THROUGH: the camera walks past the flowers, through the gate into the open sky
          .to(world, { scale: wide ? 2.2 : 2.9, duration: 2.3, ease: "power2.in" }, R + 3.1)
          .to(far, { scale: 1.18, duration: 2.3, ease: "power1.in" }, R + 3.1)
          .to(el, { autoAlpha: 0, duration: 0.9, ease: "power1.in", onStart: () => setGatePhase("revealing") }, R + (wide ? 4.3 : 4.6));
      }

      // ready once the gate's photographs are decoded (or soon regardless); then it waits for a tap
      const imgs = q(".gate-world img:not([loading=lazy])") as HTMLImageElement[];
      const loaded = Promise.race([
        Promise.all([...imgs.map((i) => i.decode().catch(() => undefined)), posyReady]),
        new Promise((r) => setTimeout(r, 3500)),
      ]);
      let alive = true;
      loaded.then(() => {
        if (!alive) return;
        el.dataset.ready = "";
        ready = true;
        if (tier !== "C") gsap.ticker.add(tick);
        autoOpen = gsap.delayedCall(tier === "C" ? 0.6 : AUTO_OPEN, start);
      });
      return () => {
        alive = false;
        live = false;
        release();
        ro.disconnect();
        gsap.ticker.remove(tick);
        autoOpen?.kill();
        tl.kill();
      };
    },
    { scope: root, dependencies: [tier], revertOnUpdate: true },
  );

  if (gone) return null;
  return (
    <div ref={root} className="gate" aria-hidden="true">
      <script dangerouslySetInnerHTML={{ __html: SKIP }} />
      <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT }} />
      <span className="gate-unit" />
      {/* beyond the gate: open sky, the same sky the opening screen begins in */}
      <div className="gate-far gate-box">
        <div className="gate-sky">
          {[1, 2, 3, 1].map((n, i) => (
            <img key={i} className={`gate-cloud gate-cloud--${i + 1}`} src={heroAsset(`cloud-${n}.webp`)} alt="" draggable={false} decoding="async" />
          ))}
        </div>
      </div>
      <div className="gate-world gate-box">
        <Garden side="l" />
        <Garden side="r" />
        <Layer name="door-l" className="gate-door" />
        <Layer name="door-r" className="gate-door" />
        <Layer name="frame" />
        {/* the posy of flowers on the knot (drawn by the ribbon canvas) */}
        <img className="gate-posy-src" src={`${BASE}bow-posy.webp`} alt="" width={POSY.w} height={POSY.h} decoding="async" draggable={false} />
      </div>
      <canvas className="gate-ribbon" />
      <p className="gate-hint">
        <span className="gate-hint-touch">Tap to open</span>
        <span className="gate-hint-click">Click to open</span>
      </p>
    </div>
  );
}
