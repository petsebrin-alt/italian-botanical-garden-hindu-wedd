"use client";

import { useRef, useState } from "react";
import { preload } from "react-dom";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { gatePhase, setGatePhase } from "@/lib/gate";
import { heroAsset } from "@/lib/heroAsset";
import { Bow, BowRenderer, type BowMeta, type BowState, type View } from "./ribbon";
import manifest from "../../../public/assets/gate/manifest.json";
import "./gate.css";

/**
 * S00 · The garden gate: the invitation's splash screen.
 *
 * The photographed gate is cut into layers (tools/build_gate.py): the stone pillars and floral
 * arch, and the two wrought-iron leaves with open sky beyond them. The satin bow is drawn live
 * (ribbon.ts) so it moves like fabric: the right tail is pulled down and its loop slides through
 * the knot, the knot gives, and both halves of the ribbon swing away and fall, twisting. Then
 * the leaves swing inward, the camera walks through the gate into the sky, and the gate
 * dissolves into the opening screen, where the monogram is waiting.
 */
type Box = { x: number; y: number; w: number; h: number };
const L = manifest.layers as Record<string, Box>;
const C = manifest.canvas;
const BOW_META = (manifest as unknown as { bow: BowMeta }).bow;
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
  preload(`${BASE}bow-atlas.webp`, { as: "image", fetchPriority: "high" });

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
      // the photographed satin bow, bent and dropped by ribbon.ts. One screen-sized canvas over
      // the gate holds the ribbon and the posy of flowers on its knot, so both can travel off any
      // screen without meeting the photograph's edge.
      const canvas = q(".gate-ribbon")[0] as HTMLCanvasElement;
      const atlas = q(".gate-atlas")[0] as HTMLImageElement;
      const posy = { y: 0, r: 0 };
      const tied: BowState = { loopL: 1, loopR: 1, sway: 0 };
      const bow = new Bow(BOW_META, tied);
      let renderer: BowRenderer | null = null;
      let k = 1, ox = 0, oy = 0;
      let view: View = { x0: 0, y0: 0, x1: C.w, y1: C.h };
      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.6 : 2);
        const r = el.getBoundingClientRect();
        const b = world.getBoundingClientRect();
        canvas.width = Math.round(r.width * dpr);
        canvas.height = Math.round(r.height * dpr);
        k = (b.width / C.w) * dpr;
        ox = (b.left - r.left) * dpr;
        oy = (b.top - r.top) * dpr;
        view = { x0: -ox / k, y0: -oy / k, x1: (canvas.width - ox) / k, y1: (canvas.height - oy) / k };
      };
      const paint = () => renderer?.draw(bow, posy, k, ox, oy, canvas.width, canvas.height);
      fit();
      const atlasReady = atlas.decode().catch(() => undefined).then(() => {
        renderer = BowRenderer.create(canvas, atlas, BOW_META);
        paint();
      });
      let speed = 1;
      let ribbonLive = true;
      const tick = (_t: number, dms: number) => {
        if (!ribbonLive) return;
        const dt = Math.min(0.05, dms / 1000) * speed;
        if (!bow.free) bow.tie(tied);
        bow.advance(dt, view);
        paint();
        if (bow.done && posy.y > view.y1) { ribbonLive = false; gsap.ticker.remove(tick); }
      };
      const ro = new ResizeObserver(() => { if (!bow.free) { fit(); paint(); } });
      ro.observe(el);

      // ---------------------------------------------------------------- hold the page still
      window.scrollTo(0, 0);
      const keys = new Set([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Enter", "Tab"]);
      const block = (e: Event) => { e.preventDefault(); hurry(); };
      const onKey = (e: KeyboardEvent) => { if (keys.has(e.key)) block(e); };
      const opts = { passive: false } as AddEventListenerOptions;
      window.addEventListener("wheel", block, opts);
      window.addEventListener("touchmove", block, opts);
      window.addEventListener("keydown", onKey);
      el.addEventListener("pointerdown", () => hurry());
      const release = () => {
        window.removeEventListener("wheel", block, opts);
        window.removeEventListener("touchmove", block, opts);
        window.removeEventListener("keydown", onKey);
      };

      const tl = gsap.timeline({ paused: true, onComplete: finish });
      let started = false;
      function hurry() {
        if (!started) { start(); return; }
        if (speed < 2) { speed = 2.2; tl.timeScale(2.2); }
      }
      function start() {
        if (started) return;
        started = true;
        if (tier !== "C") gsap.ticker.add(tick);
        tl.play(0);
      }
      function finish() {
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
        tl.to(el, { autoAlpha: 0, duration: 0.8, ease: "none", onStart: () => setGatePhase("revealing") }, 1.4);
      } else {
        const wide = el.clientWidth / el.clientHeight > 0.85;
        tl
          // a breath of air: the tails stir
          .to(tied, { sway: 1, duration: 0.45, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
          // PULL: the right tail is drawn down; its loop slides through the knot
          .to(tied, { loopR: 0, duration: 1.3, ease: "power2.in" }, 0.85)
          // the other loop follows, loosening
          .to(tied, { loopL: 0.45, duration: 0.95, ease: "sine.inOut" }, 1.3)
          .to(posy, { y: 12, r: 4, duration: 1.3, ease: "sine.inOut" }, 0.85)
          // the knot gives: the ribbon is free, the posy of flowers drops away
          .add(() => bow.release(), 2.15)
          .to(posy, { y: () => view.y1 - BOW_META.parts.knot.y + 40, r: 34, duration: 1.2, ease: "power2.in" }, 2.15)
          // DOORS: a nudge as the latch gives, then the leaves swing in
          .to(g("door-l"), { rotationY: 1.2, duration: 0.25, ease: "power1.out" }, 2.9)
          .to(g("door-r"), { rotationY: -1.2, duration: 0.25, ease: "power1.out" }, 2.9)
          .to(g("door-l"), { rotationY: 100, duration: 2.4, ease: "power2.inOut" }, 3.15)
          .to(g("door-r"), { rotationY: -100, duration: 2.4, ease: "power2.inOut" }, 3.2)
          // (anything of the ribbon still in view by now drifts out with the gate)
          .to(canvas, { autoAlpha: 0, duration: 0.5, ease: "power1.in" }, 4.0)
          // THROUGH: the camera walks through the gate into the open sky
          .to(world, { scale: wide ? 2.2 : 2.9, duration: 2.3, ease: "power2.in" }, 4.0)
          .to(far, { scale: 1.18, duration: 2.3, ease: "power1.in" }, 4.0)
          .to(el, { autoAlpha: 0, duration: 0.9, ease: "power1.in", onStart: () => setGatePhase("revealing") }, wide ? 5.2 : 5.5);
      }

      // start once the gate's photographs are decoded (or soon regardless)
      const imgs = q(".gate-world img:not([loading=lazy])") as HTMLImageElement[];
      const ready = Promise.race([
        Promise.all([...imgs.map((i) => i.decode().catch(() => undefined)), atlasReady]),
        new Promise((r) => setTimeout(r, 3500)),
      ]);
      let alive = true;
      ready.then(() => {
        if (!alive) return;
        el.dataset.ready = "";
        gsap.delayedCall(tier === "C" ? 0 : 1.1, start);
      });
      return () => {
        alive = false;
        release();
        ro.disconnect();
        gsap.ticker.remove(tick);
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
        {/* the photographed bow, part by part: drawn by the ribbon canvas */}
        <img className="gate-atlas" src={`${BASE}bow-atlas.webp`} alt="" width={BOW_META.atlas.w} height={BOW_META.atlas.h} decoding="async" draggable={false} />
      </div>
      <canvas className="gate-ribbon" />
    </div>
  );
}
