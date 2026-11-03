"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, scrub, tokens } from "@/lib/gsap";
import { useMotion, type Tier } from "@/lib/motion";

/**
 * The shared scene engine. Any section opts its children into motion with
 * data attributes, so every scene speaks the same motion language:
 *
 *   data-depth="0.4"     parallax: >0 moves faster than the page (foreground),
 *                        <0 lags behind it (background). Scroll-scrubbed, linear.
 *   data-inner           image inside a frame drifts −8% → 8% (inner parallax)
 *   data-reveal="lines|words|chars|up|fade|scale|draw|mask|stagger"
 *                        one-shot entrance when the element reaches 80% of the viewport
 *   data-delay="0.2"     offsets a reveal
 */
export function setupScene(root: HTMLElement, tier: Tier) {
  const q = gsap.utils.selector(root);
  if (tier === "C") return;
  const lite = tier === "B" ? 0.6 : 1;
  const mobile = window.innerWidth < 768;
  const span = window.innerHeight * (mobile ? 0.6 : 1) * lite;

  (q("[data-depth]") as HTMLElement[]).forEach((el) => {
    const d = parseFloat(el.dataset.depth || "0");
    const trigger = (el.closest("[data-stage]") as HTMLElement) || root;
    gsap.fromTo(el, { y: d * span * 0.5 }, {
      y: -d * span * 0.5, ease: "none",
      scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: scrub() },
    });
  });

  (q("[data-inner]") as HTMLElement[]).forEach((el) => {
    gsap.fromTo(el, { yPercent: -7 * lite }, {
      yPercent: 7 * lite, ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: scrub() },
    });
  });

  const reveal = (el: HTMLElement, tween: gsap.TweenVars, targets: gsap.TweenTarget = el) => {
    gsap.from(targets, {
      ...tween,
      delay: parseFloat(el.dataset.delay || "0"),
      scrollTrigger: { trigger: el, start: tokens.revealStart, once: true },
    });
  };

  (q("[data-reveal]") as HTMLElement[]).forEach((el) => {
    switch (el.dataset.reveal) {
      case "lines": {
        const s = new SplitText(el, { type: "lines", mask: "lines" });
        reveal(el, { yPercent: 105, duration: 1.0, ease: tokens.ease.title, stagger: tokens.stagger.line }, s.lines);
        break;
      }
      case "words": {
        const s = new SplitText(el, { type: "words", mask: "words" });
        reveal(el, { yPercent: 110, duration: 0.9, ease: tokens.ease.title, stagger: tokens.stagger.word }, s.words);
        break;
      }
      case "chars": {
        const s = new SplitText(el, { type: "chars", mask: "chars" });
        reveal(el, { yPercent: 110, duration: 1.0, ease: tokens.ease.title, stagger: tokens.stagger.char }, s.chars);
        break;
      }
      case "up":
        reveal(el, { y: 32, autoAlpha: 0, duration: 0.9 });
        break;
      case "fade":
        reveal(el, { autoAlpha: 0, duration: 1.0, ease: "power2.out" });
        break;
      case "scale":
        reveal(el, { scale: 0.9, autoAlpha: 0, duration: 1.1, ease: tokens.ease.reveal });
        break;
      case "draw":
        reveal(el, { drawSVG: "0%", duration: 1.4, ease: tokens.ease.cinematic, stagger: 0.08 },
          el.querySelectorAll("path, line, polyline, circle, ellipse"));
        break;
      case "stagger":
        reveal(el, { y: 44, autoAlpha: 0, duration: 0.9, stagger: tokens.stagger.card }, el.querySelectorAll("[data-item]"));
        break;
      case "mask": {
        // the picture is uncovered from the bottom (a slide, not a fade) while it settles from 1.25×
        const pic = el.querySelector("picture, img") as HTMLElement;
        gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", ease: "none",
          scrollTrigger: { trigger: el, start: "top 92%", end: "top 40%", scrub: scrub() },
        });
        if (pic) gsap.fromTo(pic, { scale: 1.25 }, {
          scale: 1, ease: "none",
          scrollTrigger: { trigger: el, start: "top 92%", end: "top 30%", scrub: scrub() },
        });
        break;
      }
    }
  });
}

let refreshTimer = 0;
/** Sections initialise one after another; recalculate pins once, after the last. */
export function queueRefresh() {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 60);
}

/** Runs the shared engine plus a section's own choreography once fonts are ready. */
export function useScene<T extends HTMLElement>(
  extra?: (root: T, q: (sel: string) => Element[], tier: Tier) => void | (() => void),
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null);
  const { tier } = useMotion();
  useGSAP(
    (_ctx, contextSafe) => {
      const root = ref.current;
      if (!root) return;
      let cleanup: void | (() => void);
      let alive = true;
      const run = contextSafe!(() => {
        if (!alive) return;
        setupScene(root, tier);
        cleanup = extra?.(root, gsap.utils.selector(root) as (s: string) => Element[], tier);
        queueRefresh();
      });
      document.fonts.ready.then(run);
      return () => {
        alive = false;
        if (typeof cleanup === "function") cleanup();
      };
    },
    { scope: ref, dependencies: [tier, ...deps], revertOnUpdate: true },
  );
  return ref;
}
