"use client";

import { gsap } from "@/lib/gsap";

/**
 * A flower that opens like a real one. The same photograph is stacked three times, masked into
 * its heart, its middle and its outer petals; when it blooms the heart swells first, then each
 * ring of petals unfurls outward from a bud (turning a little, as petals do), and finally the
 * whole flower settles into one image. No bounce, no spin: the pace of a flower opening.
 */
export default function Bloom({ src, className = "" }: { src: string; className?: string }) {
  return (
    <span className={`bloom ${className}`} aria-hidden="true">
      <img className="bloom-l bloom-l--outer" src={src} alt="" draggable={false} decoding="async" />
      <img className="bloom-l bloom-l--mid" src={src} alt="" draggable={false} decoding="async" />
      <img className="bloom-l bloom-l--core" src={src} alt="" draggable={false} decoding="async" />
      <img className="bloom-l bloom-l--whole" src={src} alt="" draggable={false} decoding="async" />
    </span>
  );
}

/** The bud before it opens: the timeline's starting state. */
function closed(el: Element) {
  const q = (s: string) => el.querySelector(s) as HTMLElement;
  gsap.set(el, { scale: 0.42, rotation: -14, autoAlpha: 0 });
  gsap.set(q(".bloom-l--core"), { scale: 0.55, autoAlpha: 0 });
  gsap.set(q(".bloom-l--mid"), { scale: 0.42, rotation: 24, autoAlpha: 0 });
  gsap.set(q(".bloom-l--outer"), { scale: 0.34, rotation: -30, autoAlpha: 0 });
  gsap.set(q(".bloom-l--whole"), { autoAlpha: 0 });
}

/** A paused timeline that opens the flower (play it, reverse it, or restart it). */
export function bloomTimeline(el: Element, speed = 1) {
  const q = (s: string) => el.querySelector(s) as HTMLElement;
  closed(el);
  const d = 1 / speed;
  return gsap
    .timeline({ paused: true, defaults: { ease: "power2.out" } })
    .to(el, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.7 * d, ease: "power3.out" }, 0)
    .to(q(".bloom-l--core"), { scale: 1, autoAlpha: 1, duration: 0.9 * d }, 0)
    .to(q(".bloom-l--mid"), { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.15 * d }, 0.18 * d)
    .to(q(".bloom-l--outer"), { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.4 * d }, 0.36 * d)
    // once open, the three rings become one flower again (no seams between them)
    .to(q(".bloom-l--whole"), { autoAlpha: 1, duration: 0.35 * d, ease: "none" }, 1.45 * d)
    .set([q(".bloom-l--core"), q(".bloom-l--mid"), q(".bloom-l--outer")], { autoAlpha: 0 }, 1.8 * d);
}
