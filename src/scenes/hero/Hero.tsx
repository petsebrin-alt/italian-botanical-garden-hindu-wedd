"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, scrub, tokens } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { wedding } from "@/content/wedding";
import { longDate } from "@/lib/dates";
import { heroAsset } from "@/lib/heroAsset";
import { CypressIcon, LotusDivider, Monogram, Sprig } from "@/components/Ornaments";
import manifest from "../../../public/scenes/hero/manifest.json";
import "./hero.css";

type Box = { x: number; y: number; w: number; h: number };
const M = manifest as unknown as {
  canvas: { w: number; h: number; ext: number; srcW: number };
  layers: Record<string, Box>;
  anchors?: { contact: { x: number; y: number }; titleTop: number };
  /** present when import_layers.py also wrote a phone-sized set to /scenes/hero/m/ */
  sets?: { m?: number };
};
const { srcW: SRC_W, ext: EXT } = M.canvas;

/** Bench and lehenga hem, in wide-canvas px: the couple grows around this point. */
const CONTACT = M.anchors?.contact ?? { x: EXT + 470, y: 1500 };
/** Top of the title block, as a fraction of the source width below the world top. */
const TITLE_TOP = M.anchors?.titleTop ?? 0.187;
const PHONE_SET = Boolean(M.sets?.m);

/** Canvas proportions, handed to hero.css so the geometry follows whatever master was imported. */
const STAGE_VARS = {
  "--ar": M.canvas.h / SRC_W,
  "--ex": EXT / SRC_W,
  "--tt": TITLE_TOP,
} as React.CSSProperties;

/**
 * Phase A travel per layer, as a fraction of the camera's descent T
 * (docs/OPENING-SCREEN-PLAN.md §3). Everything behind the couple lags it, so
 * the regions hidden behind the couple can only slide further out of sight.
 */
const DEPTH = { sky: 0.14, clouds: 0.22, hills: 0.45, far: 0.74, cypress: 0.86, ground: 1, frame: 1.32 };
const PHASE_A = 0.62;
const PHASE_B = 1 - PHASE_A;

type LayerName = keyof typeof M.layers;
const WIDE = new Set(["hills", "far", "cypress-l", "cypress-r", "ground", "couple", "frame-l", "frame-r", "bloom-l", "bloom-r"]);

function Layer({ name, className = "", priority = false, anchor = "world" }: {
  name: LayerName; className?: string; priority?: boolean; anchor?: "world" | "screen";
}) {
  const L = M.layers[name];
  const x = (L.x + (WIDE.has(name) ? 0 : EXT)) / SRC_W;
  const style = {
    "--fx": x, "--fy": L.y / SRC_W, "--fw": L.w / SRC_W, "--fh": L.h / SRC_W,
  } as React.CSSProperties;
  return (
    <div className={`hl hl--${name} hl--${anchor} ${className}`} data-layer={name} style={style} aria-hidden="true">
      <picture>
        {PHONE_SET && <source media="(max-aspect-ratio: 3/4)" srcSet={heroAsset(`m/${name}.avif`)} type="image/avif" />}
        {PHONE_SET && <source media="(max-aspect-ratio: 3/4)" srcSet={heroAsset(`m/${name}.webp`)} type="image/webp" />}
        <source srcSet={heroAsset(`${name}.avif`)} type="image/avif" />
        <img
          src={heroAsset(`${name}.webp`)}
          alt=""
          width={L.w}
          height={L.h}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
        />
      </picture>
    </div>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const loops = useRef<gsap.core.Animation[]>([]);
  const visible = useRef(true);
  const { tier, paused } = useMotion();
  const pausedNow = useRef(paused);
  pausedNow.current = paused;
  const { bride, groom } = wedding.couple;

  useEffect(() => {
    loops.current.forEach((t) => (paused || !visible.current || tier === "C" ? t.pause() : t.play()));
  }, [paused, tier]);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const stage = q(".hero-stage")[0] as HTMLElement;
      const probe = q(".hero-probe")[0] as HTMLElement;
      const layer = (n: string) => q(`[data-layer="${n}"]`)[0] as HTMLElement;
      const inner = (n: string) => layer(n)?.querySelector("picture");

      const images = q("img") as HTMLImageElement[];
      const decoded = Promise.race([
        Promise.all(images.map((i) => i.decode().catch(() => undefined))),
        new Promise((r) => setTimeout(r, 2500)),
      ]);

      // ---------------------------------------------------------------- intro (time-based)
      const titleEl = q(".hero-title")[0] as HTMLElement;
      const nameEls = q(".hero-name");
      const split = new SplitText(nameEls, { type: "chars", mask: "chars" });
      const intro = gsap.timeline({ paused: true });
      const backToFront = ["sky", "clouds", "hills", "far", "cypress-l", "cypress-r", "ground", "couple", "bloom-l", "bloom-r", "frame-l", "frame-r"];
      const settleTargets = backToFront
        .map((n) => (n === "sky" ? q(".hero-sky")[0] : n === "clouds" ? q(".hero-clouds")[0] : inner(n)))
        .filter(Boolean);
      if (tier === "C") {
        intro.from(settleTargets, { autoAlpha: 0, duration: 0.4, ease: "none" });
      } else {
        intro
          .from(settleTargets, { autoAlpha: 0, scale: 1.06, yPercent: 2.5, duration: 1.6, ease: tokens.ease.settle, stagger: 0.1 }, 0)
          .from(q(".mono-draw"), { drawSVG: "0%", duration: 1.4, ease: tokens.ease.cinematic }, 0.6)
          .from(q(".mono-leaves path"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.03 }, 0.8)
          .from(q(".mono-letters"), { autoAlpha: 0, duration: 0.6 }, 1.5)
          .from(q(".hero-eyebrow .rule"), { scaleX: 0, duration: 0.8, transformOrigin: (i: number) => (i ? "0% 50%" : "100% 50%") }, 1.0)
          .from(q(".hero-eyebrow span:not(.rule)"), { autoAlpha: 0, letterSpacing: "0.5em", duration: 1.0 }, 1.0)
          .from(split.chars, { yPercent: 110, duration: 1.2, ease: tokens.ease.title, stagger: 0.04 }, 1.2)
          .from(q(".hero-amp"), { autoAlpha: 0, scale: 0.9, rotation: -4, duration: 1.0 }, 1.7)
          .from(q(".hero-title .ornament, .hero-date"), { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.12 }, 2.0)
          .from(q(".sprig-stem"), { drawSVG: "0%", duration: 0.9 }, 2.1)
          .from(q(".hero-place"), { autoAlpha: 0, y: 12, duration: 0.8 }, 2.3)
          .from(q(".hero-cue"), { autoAlpha: 0, y: -8, duration: 0.6 }, 2.6);
      }
      // only the live mount may start its intro (React dev mounts effects twice)
      let alive = true;
      decoded.then(() => { if (alive) intro.play(); });

      // ---------------------------------------------------------------- ambient (time-based)
      const ambient = gsap.timeline({ repeat: -1, yoyo: true, paused: tier === "C" });
      ambient
        .to(inner("frame-l")!, { rotation: 0.6, transformOrigin: "0% 0%", duration: 5.5, ease: tokens.ease.sway }, 0)
        .to(inner("frame-r")!, { rotation: -0.6, transformOrigin: "100% 0%", duration: 6.3, ease: tokens.ease.sway }, 0);
      const cue = gsap.to(q(".hero-cue-arrow"), { y: 8, repeat: -1, yoyo: true, duration: 1.6, ease: tokens.ease.sway });
      loops.current = [ambient, cue];
      const vis = ScrollTrigger.create({
        trigger: el, start: "top bottom", end: "bottom top",
        onToggle: (s) => {
          visible.current = s.isActive;
          loops.current.forEach((t) => (s.isActive && !pausedNow.current && tier !== "C" ? t.play() : t.pause()));
        },
      });

      if (tier === "C") return () => { alive = false; split.revert(); vis.kill(); };

      // ---------------------------------------------------------------- scroll (phase A + B)
      let scroll: gsap.Context | null = null;
      const build = () => scroll = gsap.context(() => {
        const vw = window.innerWidth;
        const portrait = vw / window.innerHeight < 0.75;
        const lvh = probe.offsetHeight;
        const Wc = probe.offsetWidth;
        const k = Wc / SRC_W;
        const Hw = M.canvas.h * k;
        const yEnd = lvh - Hw;
        const yStart = Math.max(0, yEnd + 0.42 * lvh);
        const T = yStart - yEnd;
        const lite = tier === "B" ? 0.7 : 1;
        const rise = 0.14 * lvh;

        const origin = (n: string, p = CONTACT) => {
          const L = M.layers[n];
          return `${(p.x - L.x) * k}px ${(p.y - L.y) * k}px`;
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${(portrait ? 2.0 : 2.3) * lvh}`,
            pin: stage,
            scrub: scrub(),
            anticipatePin: 1,
            invalidateOnRefresh: false,
          },
        });

        // Phase A: descend from the sky
        tl.to(q(".hero-sky"), { y: -DEPTH.sky * T, duration: PHASE_A }, 0)
          .to(q(".hero-clouds"), { y: -DEPTH.clouds * T, duration: PHASE_A }, 0)
          .to(layer("hills"), { y: -DEPTH.hills * T, duration: PHASE_A }, 0)
          .to(layer("far"), { y: -DEPTH.far * T, duration: PHASE_A }, 0)
          .to([layer("cypress-l"), layer("cypress-r")], { y: -DEPTH.cypress * T, duration: PHASE_A }, 0)
          .to([layer("ground"), layer("couple")], { y: -DEPTH.ground * T, duration: PHASE_A }, 0)
          .fromTo([layer("bloom-l"), layer("bloom-r")], { y: rise * lite }, { y: -T, duration: PHASE_A }, 0)
          .to(q(".hero-cue"), { autoAlpha: 0, y: 14, duration: 0.05 }, 0);

        if (portrait) {
          // the pergola stays overhead while the garden rises into the reference frame
          tl.to([layer("frame-l"), layer("frame-r")], { y: -0.04 * lvh, scale: 1.04, duration: PHASE_A }, 0);
          const endTop = yEnd + TITLE_TOP * Wc;
          tl.to(titleEl, { y: endTop - titleEl.offsetTop, duration: PHASE_A }, 0);
        } else {
          tl.to([layer("frame-l"), layer("frame-r")], { y: -DEPTH.frame * T, duration: PHASE_A }, 0)
            .to(titleEl, { y: -0.55 * T, duration: PHASE_A }, 0)
            .to(titleEl, { autoAlpha: 0, duration: PHASE_A * 0.5, ease: "power1.in" }, PHASE_A * 0.35)
            .fromTo(q(".hl--near"), { yPercent: 105 }, { yPercent: 0, duration: PHASE_A, ease: "power1.out" }, 0);
        }

        // Phase B: step through the arch
        const b = PHASE_A;
        tl.to(layer("frame-l"), { scale: 1.6, x: -0.12 * vw, y: "-=" + 0.06 * lvh, transformOrigin: "0% 0%", duration: PHASE_B }, b)
          .to(layer("frame-r"), { scale: 1.6, x: 0.12 * vw, y: "-=" + 0.06 * lvh, transformOrigin: "100% 0%", duration: PHASE_B }, b)
          .to(layer("bloom-l"), { scale: 1.5, x: -0.04 * vw, transformOrigin: "0% 100%", duration: PHASE_B }, b)
          .to(layer("bloom-r"), { scale: 1.5, x: 0.04 * vw, transformOrigin: "100% 100%", duration: PHASE_B }, b)
          .to(layer("couple"), { scale: 1.1, transformOrigin: origin("couple"), duration: PHASE_B }, b)
          .to(layer("ground"), { scale: 1.1, transformOrigin: origin("ground"), duration: PHASE_B }, b)
          .to(layer("cypress-l"), { x: -0.035 * Wc * lite, scale: 1.06, transformOrigin: "50% 100%", duration: PHASE_B }, b)
          .to(layer("cypress-r"), { x: 0.035 * Wc * lite, scale: 1.06, transformOrigin: "50% 100%", duration: PHASE_B }, b)
          .to([layer("far"), layer("hills")], { scale: 1.04, transformOrigin: "50% 100%", duration: PHASE_B }, b)
          .to(q(".hero-sky"), { y: "-=" + 0.03 * lvh, duration: PHASE_B }, b);
        if (portrait) tl.to(titleEl, { autoAlpha: 0, y: "-=" + 0.06 * lvh, duration: PHASE_B * 0.4, ease: "power1.in" }, b);
        else tl.to(q(".hl--near-l"), { scale: 1.6, transformOrigin: "0% 100%", duration: PHASE_B }, b)
          .to(q(".hl--near-r"), { scale: 1.6, transformOrigin: "100% 100%", duration: PHASE_B }, b);

        // if the visitor scrolls during the intro, finish it immediately
        ScrollTrigger.create({ trigger: el, start: "top+=4 top", once: true, onEnter: () => intro.progress(1) });
      }, el);
      build();

      // rebuild with fresh geometry when the layout really changes (not for URL-bar jitter)
      let lastW = window.innerWidth, lastH = window.innerHeight, timer = 0;
      const onResize = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const w = window.innerWidth, h = window.innerHeight;
          if (w === lastW && Math.abs(h - lastH) < 160) return;
          lastW = w; lastH = h;
          const progress = window.scrollY;
          scroll?.revert();
          build();
          ScrollTrigger.refresh();
          window.scrollTo(0, progress);
        }, 200);
      };
      window.addEventListener("resize", onResize);

      return () => {
        alive = false;
        window.removeEventListener("resize", onResize);
        split.revert();
        vis.kill();
        scroll?.revert();
      };
    },
    { scope: root, dependencies: [tier], revertOnUpdate: true },
  );

  return (
    <section ref={root} id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero-stage" style={STAGE_VARS}>
        <span className="hero-probe" aria-hidden="true" />
        <div className="hero-sky" aria-hidden="true">
          <span className="hero-sun" />
        </div>
        <div className="hero-clouds ambient" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <picture key={i} className={`hero-cloud hero-cloud--${i}`}>
              <source srcSet={heroAsset(`cloud-${i}.avif`)} type="image/avif" />
              <img src={heroAsset(`cloud-${i}.webp`)} alt="" decoding="async" />
            </picture>
          ))}
        </div>

        <Layer name="hills" />
        <Layer name="far" />

        <div className="hero-title">
          <Monogram className="hero-mono" size={128} />
          <p className="hero-eyebrow eyebrow">
            <span className="rule" /> <span>The wedding of</span> <span className="rule" />
          </p>
          <h1 id="hero-title" className="hero-names" aria-label={`The wedding of ${bride.name} and ${groom.name}`}>
            <span className="hero-name names" aria-hidden="true">{bride.name}</span>
            <span className="hero-amp" aria-hidden="true">&amp;</span>
            <span className="hero-name names" aria-hidden="true">{groom.name}</span>
          </h1>
          <LotusDivider className="hero-ornament" />
          <p className="hero-date date-display">
            <Sprig /> <span>{longDate(wedding.date)}</span> <Sprig flip />
          </p>
          <p className="hero-place eyebrow">
            <CypressIcon className="hero-place-icon" />
            <span>{wedding.destination.label}</span>
          </p>
        </div>

        <Layer name="cypress-l" priority />
        <Layer name="cypress-r" priority />
        <Layer name="ground" />
        <Layer name="couple" priority />
        <Layer name="bloom-l" />
        <Layer name="bloom-r" />
        <Layer name="frame-l" priority anchor="screen" />
        <Layer name="frame-r" priority anchor="screen" />
        <div className="hl--near hl--near-l" aria-hidden="true">
          <img src={heroAsset("bloom-r-near.webp")} alt="" decoding="async" />
        </div>
        <div className="hl--near hl--near-r" aria-hidden="true">
          <img src={heroAsset("bloom-l-near.webp")} alt="" decoding="async" />
        </div>

        <a className="hero-cue" href="#welcome">
          <span className="caption">Scroll to explore</span>
          <svg className="hero-cue-arrow" width="16" height="44" viewBox="0 0 16 44" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1">
            <path d="M8 2 V40 M2 34 L8 41 L14 34" />
          </svg>
        </a>
      </div>
    </section>
  );
}
