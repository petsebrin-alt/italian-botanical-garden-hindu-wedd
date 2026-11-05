"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, scrub, tokens } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { wedding } from "@/content/wedding";
import { longDate, longDateParts } from "@/lib/dates";
import { heroAsset } from "@/lib/heroAsset";
import { gatePhase, gateRevealed } from "@/lib/gate";
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
/** Top of the title block in the poster composition, as a fraction of the source width. */
const TITLE_TOP = M.anchors?.titleTop ?? 0.187;
const PHONE_SET = Boolean(M.sets?.m);
/** The tallest trees (the avenue continued past the edges grows taller): the garden parks below this. */
const GARDEN_TOP = Math.min(M.layers["cypress-l"].y, M.layers["cypress-r"].y) / SRC_W;

/** Canvas proportions, handed to hero.css so the geometry follows whatever master was imported. */
const STAGE_VARS = {
  "--ar": M.canvas.h / SRC_W,
  "--ex": EXT / SRC_W,
  "--tt": TITLE_TOP,
  "--gt": GARDEN_TOP,
} as React.CSSProperties;

/**
 * Descent travel per layer, as a fraction of the parallax span T (docs/OPENING-SCREEN-PLAN.md §3),
 * on top of the shared rise S that brings the garden up from below the sky view. Everything
 * behind the couple lags it, so the regions hidden behind the couple can only slide further out
 * of sight.
 */
const DEPTH = { hills: 0.45, far: 0.74, cypress: 0.86, ground: 1 };

/**
 * The pinned timeline, in timeline seconds (scrubbed by scroll):
 *   0 → NAMES   under the monogram: "Dear <guest>", then the names write themselves into the sky
 *   → HOLD      a breath with the full title in the sky
 *   → DESCENT   the camera tilts down: sky, clouds, hills, avenue, trees, couple and flowers each
 *               rise at their own speed; the title drifts up behind the trees
 *   → STEP      step through the arch into the welcome
 */
const NAMES = 2;
const HOLD = 0.4;
const DESCENT = 5;
const STEP = 3;

/**
 * The guest's name comes from their personal link (?to=Sharma%20Family, or ?guest=). It is read
 * after hydration, so the static page stays the same for everyone; the greeting is still hidden
 * until the first scroll, so the swap is never seen.
 */
const noSubscribe = () => () => {};
const readGuest = () => {
  const p = new URLSearchParams(window.location.search);
  return (p.get("to") ?? p.get("guest") ?? "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 48);
};

type LayerName = keyof typeof M.layers;
const WIDE = new Set(["hills", "far", "cypress-l", "cypress-r", "ground", "couple", "frame-l", "frame-r", "bloom-l", "bloom-r"]);

function Layer({ name, priority = false, anchor = "world" }: {
  name: LayerName; priority?: boolean; anchor?: "world" | "edge-l" | "edge-r";
}) {
  const L = M.layers[name];
  const edge = anchor !== "world";
  const x = edge ? (L.x - EXT) / SRC_W : (L.x + (WIDE.has(name) ? 0 : EXT)) / SRC_W;
  const style = {
    "--fx": x,
    "--fxr": (EXT + SRC_W - L.x - L.w) / SRC_W,
    "--fy": L.y / SRC_W, "--fw": L.w / SRC_W, "--fh": L.h / SRC_W,
  } as React.CSSProperties;
  return (
    <div className={`hl hl--${name} hl--${anchor}`} data-layer={name} style={style} aria-hidden="true">
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

/**
 * The flower beds in the bottom corners. They keep the manifest boxes (and so every tween) of the
 * photo's own flower layers, but show sharp hydrangeas cut from an in-focus photograph: the
 * photo's corner flowers were soft, out-of-focus foreground. A long border runs off-screen
 * behind a bed whose inner edge is the plant's own outline.
 */
function BedLayer({ side }: { side: "l" | "r" }) {
  const name = `bloom-${side}` as LayerName;
  const L = M.layers[name];
  const style = {
    "--fx": L.x / SRC_W, "--fy": L.y / SRC_W, "--fw": L.w / SRC_W, "--fh": L.h / SRC_W,
  } as React.CSSProperties;
  const img = (file: string, cls: string) => (
    <picture className={cls}>
      <source srcSet={`/assets/botanical/${file}.avif`} type="image/avif" />
      <img src={`/assets/botanical/${file}.webp`} alt="" decoding="async" draggable={false} />
    </picture>
  );
  return (
    <div className={`hl hl--${name} hl--world hero-bed hero-bed--${side}`} data-layer={name} style={style} aria-hidden="true">
      {img("bed-wide", "hero-bed-border")}
      {img(`bed-${side}`, "hero-bed-main")}
    </div>
  );
}

/** Without scripts there is no scroll camera: show the names and the composed garden. */
const NO_SCRIPT = `<style>
.hero-stage { height: calc(var(--yStart) + var(--Hw)); --S: 0px; }
.hero-stage .hero-reveal { visibility: visible; }
.hero-title { top: calc(var(--yStart) + var(--Wc) * var(--tt)); }
</style>`;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const loops = useRef<gsap.core.Animation[]>([]);
  const visible = useRef(true);
  const { tier, paused } = useMotion();
  const pausedNow = useRef(paused);
  pausedNow.current = paused;
  const { bride, groom } = wedding.couple;
  const guest = useSyncExternalStore(noSubscribe, readGuest, () => "") || wedding.greeting.fallback;

  useEffect(() => {
    loops.current.forEach((t) => (paused || !visible.current || tier === "C" ? t.pause() : t.play()));
  }, [paused, tier]);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const stage = q(".hero-stage")[0] as HTMLElement;
      const probe = q(".hero-probe")[0] as HTMLElement;
      const probeS = q(".hero-probe-s")[0] as HTMLElement;
      const layer = (n: string) => q(`[data-layer="${n}"]`)[0] as HTMLElement;
      const inner = (n: string) => layer(n)?.querySelector("picture");
      const titleEl = q(".hero-title")[0] as HTMLElement;
      const nameEls = q(".hero-name");
      const split = new SplitText(nameEls, { type: "chars", mask: "chars" });

      const images = q("img") as HTMLImageElement[];
      const decoded = Promise.race([
        Promise.all(images.map((i) => i.decode().catch(() => undefined))),
        new Promise((r) => setTimeout(r, 2500)),
      ]);

      // ---------------------------------------------------------------- intro (time-based): the sky, then the monogram
      const intro = gsap.timeline({ paused: true });
      const opening = [q(".hero-sky")[0], q(".hero-clouds")[0], inner("frame-l"), inner("frame-r")].filter(Boolean);
      // behind the opening gate the sky is already in place: the gate dissolves into it, and only
      // the monogram is left to draw itself
      const behindGate = gatePhase() === "closed";
      if (tier === "C") {
        intro.from(behindGate ? [titleEl] : [...opening, titleEl], { autoAlpha: 0, duration: 0.4, ease: "none" });
      } else {
        if (!behindGate) intro.from(opening, { autoAlpha: 0, scale: 1.05, yPercent: -2, duration: 1.6, ease: tokens.ease.settle, stagger: 0.12 }, 0);
        intro
          .from(q(".mono-draw"), { drawSVG: "0%", duration: 1.5, ease: tokens.ease.cinematic }, behindGate ? 0.35 : 0.7)
          .from(q(".mono-leaves path"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.03 }, 0.9)
          .from(q(".mono-letters"), { autoAlpha: 0, duration: 0.7 }, 1.7)
          .from(q(".hero-cue"), { autoAlpha: 0, y: -8, duration: 0.6 }, 2.2);
      }
      // only the live mount may start its intro (React dev mounts effects twice)
      let alive = true;
      Promise.all([decoded, gateRevealed()]).then(() => { if (alive) intro.play(); });

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

      if (tier === "C") {
        stage.dataset.ready = "";
        return () => { alive = false; split.revert(); vis.kill(); };
      }

      // ---------------------------------------------------------------- scroll camera
      let scroll: gsap.Context | null = null;
      const build = () => scroll = gsap.context(() => {
        const vw = window.innerWidth;
        const portrait = window.matchMedia("(max-aspect-ratio: 3/4)").matches;   // same test as hero.css
        const lvh = probe.getBoundingClientRect().height;
        const Wc = probe.getBoundingClientRect().width;
        const S = probeS.getBoundingClientRect().height;     // the garden's parking depth (hero.css --S)
        const k = Wc / SRC_W;
        const Hw = M.canvas.h * k;
        const yEnd = lvh - Hw;
        const yStart = Math.max(0, yEnd + 0.42 * lvh);
        const T = yStart - yEnd;
        const lite = tier === "B" ? 0.7 : 1;
        const rise = 0.14 * lvh;

        // where the title block goes: centred in the sky, then (phones) the poster position
        const stageTop = stage.getBoundingClientRect().top;
        const titleTop = titleEl.getBoundingClientRect().top - stageTop;
        const titleH = titleEl.offsetHeight;
        const greetEl = q(".hero-greeting")[0] as HTMLElement;
        const greetH = greetEl.offsetHeight;
        const rowGap = parseFloat(getComputedStyle(titleEl).rowGap) || 0;
        const centred = Math.max(0.06 * lvh, 0.46 * lvh - titleH / 2) - titleTop;
        const posterTop = Math.max(0.03 * lvh, yEnd + TITLE_TOP * Wc);
        const poster = posterTop - titleTop;
        // the sky left above the couple's heads once the garden has risen: if the title block is
        // taller than that on some screen, it shrinks to fit rather than overlap the couple
        const coupleTop = yEnd + (M.layers.couple.y / SRC_W) * Wc;
        // (on phones the greeting folds away during the descent, so the poster is shorter)
        const posterH = titleH - greetH - rowGap;
        const posterFit = Math.min(1, Math.max(0.6, (coupleTop - 0.015 * lvh - posterTop) / posterH));

        const origin = (n: string, p = CONTACT) => {
          const L = M.layers[n];
          return `${(p.x - L.x) * k}px ${(p.y - L.y) * k}px`;
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${(portrait ? 2.9 : 3.2) * lvh}`,
            pin: stage,
            scrub: scrub(),
            anticipatePin: 1,
            invalidateOnRefresh: false,
          },
        });

        // NAMES: the title lifts to the middle of the sky while the names write themselves in
        const r = (sel: string) => q(`.hero-title ${sel}`);
        const eyebrowText = r(".hero-eyebrow span:not(.rule)")[0] as HTMLElement;
        const spacing = eyebrowText ? getComputedStyle(eyebrowText).letterSpacing : "0.2em";
        tl.to(titleEl, { y: centred, duration: NAMES, ease: "power1.inOut" }, 0)
          .to(q(".hero-cue"), { autoAlpha: 0, y: 14, duration: 0.3 }, 0)
          // "Dear", then the guest's own name
          .fromTo(r(".hero-dear"), { autoAlpha: 0, y: 18, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }, 0.05)
          .fromTo(r(".hero-guest"), { autoAlpha: 0, y: 18, letterSpacing: "0.18em" }, { autoAlpha: 1, y: 0, letterSpacing: "0.03em", duration: 0.45, ease: "power2.out" }, 0.25)
          .fromTo(r(".hero-eyebrow .rule"), { scaleX: 0 }, { scaleX: 1, duration: 0.5, transformOrigin: (i: number) => (i ? "0% 50%" : "100% 50%") }, 0.55)
          .fromTo(r(".hero-eyebrow span:not(.rule)"), { autoAlpha: 0, letterSpacing: "0.5em" }, { autoAlpha: 1, letterSpacing: spacing, duration: 0.6 }, 0.55)
          .fromTo(split.chars, { yPercent: 110 }, { yPercent: 0, duration: 0.45, stagger: 0.06, ease: tokens.ease.title }, 0.75)
          .fromTo(r(".hero-amp"), { autoAlpha: 0, scale: 0.9, rotation: -4 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5 }, 1.05)
          .fromTo(r(".hero-ornament, .hero-date"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.12 }, 1.4)
          .fromTo(q(".sprig-stem"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.5 }, 1.45)
          .fromTo(r(".hero-place"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.6);

        // DESCENT: the camera tilts down out of the sky and the garden rises layer by layer
        const d = NAMES + HOLD;
        tl.to(q(".hero-sky"), { y: -0.3 * lvh, duration: DESCENT }, d)
          .to(q(".hero-clouds"), { y: -0.55 * lvh, duration: DESCENT }, d)
          .to(layer("hills"), { y: -(S + DEPTH.hills * T), duration: DESCENT }, d)
          .to(layer("far"), { y: -(S + DEPTH.far * T), duration: DESCENT }, d)
          .to([layer("cypress-l"), layer("cypress-r")], { y: -(S + DEPTH.cypress * T), duration: DESCENT }, d)
          .to([layer("ground"), layer("couple")], { y: -(S + DEPTH.ground * T), duration: DESCENT }, d)
          .fromTo([layer("bloom-l"), layer("bloom-r")], { y: rise * lite }, { y: -(S + T), duration: DESCENT }, d)
          // the arbour stays overhead, lifting a touch as the camera lowers
          .to([layer("frame-l"), layer("frame-r")], { y: -0.05 * lvh, scale: 1.04, duration: DESCENT }, d);
        if (portrait) {
          // phones and upright tablets keep the poster: names above the couple, between the trees
          // the greeting has been read: it folds away so the names sit close under the monogram
          tl.to(greetEl, { autoAlpha: 0, height: 0, marginTop: -rowGap, duration: DESCENT * 0.4, ease: "power1.inOut" }, d)
            .to(titleEl, { y: poster, scale: posterFit, transformOrigin: "50% 0%", duration: DESCENT, ease: "power1.inOut" }, d);
        } else {
          // wide screens: the names drift up into the sky and fade as the trees rise past them
          tl.to(titleEl, { y: centred - 0.5 * lvh, duration: DESCENT * 0.7 }, d)
            .to(titleEl, { autoAlpha: 0, duration: DESCENT * 0.28, ease: "power1.in" }, d + DESCENT * 0.3);
        }

        // STEP: through the arch
        const b = d + DESCENT;
        tl.to(layer("frame-l"), { scale: 1.6, x: -0.12 * vw, y: "-=" + 0.06 * lvh, transformOrigin: "0% 0%", duration: STEP }, b)
          .to(layer("frame-r"), { scale: 1.6, x: 0.12 * vw, y: "-=" + 0.06 * lvh, transformOrigin: "100% 0%", duration: STEP }, b)
          .to(layer("bloom-l"), { scale: 1.5, x: -0.04 * vw, transformOrigin: "0% 100%", duration: STEP }, b)
          .to(layer("bloom-r"), { scale: 1.5, x: 0.04 * vw, transformOrigin: "100% 100%", duration: STEP }, b)
          .to(layer("couple"), { scale: 1.1, transformOrigin: origin("couple"), duration: STEP }, b)
          .to(layer("ground"), { scale: 1.1, transformOrigin: origin("ground"), duration: STEP }, b)
          .to(layer("cypress-l"), { x: -0.035 * Wc * lite, scale: 1.06, transformOrigin: "50% 100%", duration: STEP }, b)
          .to(layer("cypress-r"), { x: 0.035 * Wc * lite, scale: 1.06, transformOrigin: "50% 100%", duration: STEP }, b)
          .to([layer("far"), layer("hills")], { scale: 1.04, transformOrigin: "50% 100%", duration: STEP }, b)
          .to(q(".hero-sky"), { y: "-=" + 0.03 * lvh, duration: STEP }, b);
        if (portrait) tl.to(titleEl, { autoAlpha: 0, y: "-=" + 0.06 * lvh, duration: STEP * 0.4, ease: "power1.in" }, b);

        // if the visitor scrolls during the intro, finish it immediately
        ScrollTrigger.create({ trigger: el, start: "top+=4 top", once: true, onEnter: () => intro.progress(1) });
      }, el);
      build();
      // the names are now under the timeline's control: lift the no-flash guard
      stage.dataset.ready = "";

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
    { scope: root, dependencies: [tier, guest], revertOnUpdate: true },
  );

  return (
    <section ref={root} id="top" className="hero" aria-labelledby="hero-title">
      <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT }} />
      <div className="hero-stage" style={STAGE_VARS}>
        <span className="hero-probe" aria-hidden="true" />
        <span className="hero-probe-s" aria-hidden="true" />
        <div className="hero-sky" aria-hidden="true">
          <span className="hero-sun" />
        </div>
        <div className="hero-clouds ambient" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <picture key={i} className={`hero-cloud hero-cloud--${i}`}>
              <source srcSet={heroAsset(`cloud-${((i - 1) % 3) + 1}.avif`)} type="image/avif" />
              <img src={heroAsset(`cloud-${((i - 1) % 3) + 1}.webp`)} alt="" decoding="async" />
            </picture>
          ))}
        </div>

        <Layer name="hills" />
        <Layer name="far" />

        <div className="hero-title">
          <Monogram className="hero-mono" size={128} />
          <p className="hero-greeting hero-reveal">
            <span className="hero-dear">{wedding.greeting.dear}</span>
            <span className="hero-guest">{guest}</span>
          </p>
          <p className="hero-eyebrow eyebrow hero-reveal">
            <span className="rule" /> <span>The wedding of</span> <span className="rule" />
          </p>
          <h1 id="hero-title" className="hero-names hero-reveal" aria-label={`The wedding of ${bride.name} and ${groom.name}`}>
            <span className="hero-name names" aria-hidden="true">{bride.name}</span>
            <span className="hero-amp" aria-hidden="true">&amp;</span>
            <span className="hero-name names" aria-hidden="true">{groom.name}</span>
          </h1>
          <LotusDivider className="hero-ornament hero-reveal" />
          <p className="hero-date date-display hero-reveal">
            <Sprig />{" "}
            <span aria-label={longDate(wedding.date)}>
              {longDateParts(wedding.date).map((p, i) => (p.numeric ? <span key={i} className="hero-num" aria-hidden="true">{p.text}</span> : <span key={i} aria-hidden="true">{p.text}</span>))}
            </span>{" "}
            <Sprig flip />
          </p>
          <p className="hero-place eyebrow hero-reveal">
            <CypressIcon className="hero-place-icon" />
            <span>{wedding.destination.label}</span>
          </p>
        </div>

        <Layer name="cypress-l" priority />
        <Layer name="cypress-r" priority />
        <Layer name="ground" />
        <Layer name="couple" priority />
        <BedLayer side="l" />
        <BedLayer side="r" />
        <Layer name="frame-l" priority anchor="edge-l" />
        <Layer name="frame-r" priority anchor="edge-r" />

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
