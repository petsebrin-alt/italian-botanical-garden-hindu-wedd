"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { Sprite } from "@/components/Pic";
import "./family.css";

/** The parents' portraits, each in its oval beaded frame (cut by tools/build_parents.py). */
const PORTRAIT = {
  bride: { src: "/assets/img/family-bride.webp", w: 679, h: 872 },
  groom: { src: "/assets/img/family-groom.webp", w: 681, h: 874 },
} as const;

/**
 * S09 · Family introduction, in layers like the opening, on the ivory paper: the wisteria
 * overhead, the parents' portraits in oval frames joined by a drawn garland, and hydrangeas in
 * front.
 *
 *   APPROACH  while the section scrolls up into view, every layer rises at its own speed: the
 *             heading lags, the wisteria comes down, the hydrangeas rise fastest, and the bride's
 *             family's frame comes in from the left edge, the groom's from the right
 *   CLOSER    the scene then holds on screen while the camera comes closer: the wisteria and the
 *             hydrangeas grow and part to the sides, the frames come nearer and the garland draws
 *             itself between them
 *
 * Both are tied to the scroll, so scrolling back up plays them in reverse.
 */
export default function Family() {
  const { bride, groom } = wedding.families;
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const vh = window.innerHeight, vw = window.innerWidth;
    const lite = vw < 768 ? 0.75 : 1;

    // APPROACH: the garden rises layer by layer as it scrolls into view
    const approach = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: root, start: "top bottom", end: "top top", scrub: scrub(), invalidateOnRefresh: true },
    });
    approach
      .fromTo(q(".fam-head"), { y: -0.08 * vh * lite }, { y: 0 }, 0)
      .fromTo(q(".fam-vine"), { y: -0.3 * vh * lite }, { y: 0, ease: "power1.out" }, 0)
      .fromTo(q(".fam-bloom"), { y: 0.38 * vh * lite }, { y: 0, ease: "power1.out" }, 0);
    // each frame comes in from its own edge of the screen
    (q(".fam-card") as HTMLElement[]).forEach((card, i) => {
      const photo = card.querySelector(".fam-photo") as HTMLElement;
      const off = () => {
        const left = card.getBoundingClientRect().left + photo.offsetLeft;
        return i === 0 ? -(left + photo.offsetWidth + 24) : window.innerWidth - left + 24;
      };
      approach.fromTo(photo, { x: off, y: 0.1 * vh * lite, scale: 0.9 }, { x: 0, y: 0, scale: 1, ease: "power1.out" }, 0);
    });

    // CLOSER: pinned, the camera comes in towards the families
    const closer = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: root, start: "top top", end: () => `+=${1.1 * window.innerHeight}`, pin: true, scrub: scrub(), anticipatePin: 1 },
    });
    closer
      .to(q(".fam-vine--l"), { scale: 1.45, x: -0.05 * vw, y: -0.04 * vh, transformOrigin: "0% 0%" }, 0)
      .to(q(".fam-vine--r"), { scale: 1.45, x: 0.05 * vw, y: -0.04 * vh, transformOrigin: "100% 0%" }, 0)
      // (the hydrangeas part outward and down, clear of the names)
      .to(q(".fam-bloom--l"), { scale: 1.3, x: -0.09 * vw, y: 0.04 * vh, transformOrigin: "0% 100%" }, 0)
      .to(q(".fam-bloom--r"), { scale: 1.3, x: 0.09 * vw, y: 0.04 * vh, transformOrigin: "100% 100%" }, 0)
      .to(q(".fam-head"), { yPercent: -18, scale: 0.97, transformOrigin: "50% 0%" }, 0)
      // (the frames grow upward, into the room the heading leaves; the names stay put)
      .to(q(".fam-grid"), { scale: 1.1, transformOrigin: "50% 82%" }, 0)
      // the garland draws itself between them, and its knot is tied
      .fromTo(q(".fam-link path"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.55 }, 0.05)
      .fromTo(q(".fam-knot"), { scale: 0, rotation: -40, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.2, ease: "back.out(1.7)" }, 0.55);
  });

  return (
    <section ref={ref} id="family" className="family paper" aria-labelledby="family-title">
      <div className="fam-scene" aria-hidden="true">
        <Sprite name="bed-l" className="fam-bloom fam-bloom--l" />
        <Sprite name="bed-r" className="fam-bloom fam-bloom--r" />
        <Sprite name="canopy-l" className="fam-vine fam-vine--l" />
        <Sprite name="canopy-r" className="fam-vine fam-vine--r" />
      </div>
      <div className="fam-content">
        <header className="center fam-head">
          <p className="eyebrow" data-reveal="fade">Our families</p>
          <h2 id="family-title" className="script" data-reveal="up">With Love &amp; Blessings</h2>
        </header>
        <div className="fam-grid">
          {[{ k: "bride", f: bride }, { k: "groom", f: groom }].map(({ k, f }) => (
            <article key={k} className={`fam-card fam-card--${k}`}>
              <img
                className="fam-photo"
                src={PORTRAIT[k as "bride" | "groom"].src}
                width={PORTRAIT[k as "bride" | "groom"].w}
                height={PORTRAIT[k as "bride" | "groom"].h}
                alt={`${f.parents[0]} and ${f.parents[1]}, ${k === "bride" ? "the bride's" : "the groom's"} parents`}
                loading="lazy"
                decoding="async"
              />
              <div className="fam-body">
                <p className="eyebrow">{f.title}</p>
                <p className="fam-names names">
                  <span data-reveal="chars">{f.parents[0]}</span>
                  <span className="fam-amp" aria-hidden="true">&amp;</span>
                  <span className="sr-only">and</span>
                  <span data-reveal="chars">{f.parents[1]}</span>
                </p>
              </div>
            </article>
          )).flatMap((card, i) => (i === 0 ? [card, (
            <svg key="link" className="fam-link" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
              <path d="M 0 30 C 40 6, 70 54, 100 30" />
              <path d="M 200 30 C 160 6, 130 54, 100 30" />
              <g className="fam-knot">
                <circle cx="100" cy="30" r="7" fill="#d9a5a0" stroke="#7a5e2a" strokeWidth="0.8" />
                <circle cx="100" cy="30" r="2.6" fill="#f8f4e9" />
              </g>
            </svg>
          )] : [card]))}
        </div>
      </div>
    </section>
  );
}
