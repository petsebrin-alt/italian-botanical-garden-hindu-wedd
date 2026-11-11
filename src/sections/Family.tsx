"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import Pic, { Sprite } from "@/components/Pic";
import "./family.css";

/** The parents' portraits, each in its oval beaded frame (cut by tools/build_parents.py). */
const PORTRAIT = {
  bride: { src: "/assets/img/family-bride.webp", w: 679, h: 872 },
  groom: { src: "/assets/img/family-groom.webp", w: 681, h: 874 },
} as const;

/**
 * S09 · Family introduction: the parents' portraits in oval frames, joined by a drawn garland, in
 * a garden of its own (wisteria above, hydrangeas and the Tuscan fields below). With the scroll,
 * the bride's family's frame comes in from the left edge of the screen and the groom's from the
 * right, while every layer moves at its own depth: the wisteria comes down, the heading and the
 * fields lag, the frames float a little ahead and the hydrangeas rise. Scrolling back up plays it
 * in reverse.
 */
export default function Family() {
  const { bride, groom } = wedding.families;
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const mobile = window.innerWidth < 768;
    const v = window.innerHeight * (mobile ? 0.6 : 1);
    const grid = q(".fam-grid")[0] as HTMLElement;

    // the wisteria closes in over the section as it arrives
    const enter = { trigger: root, start: "top bottom", end: "top 20%", scrub: scrub() };
    gsap.fromTo(q(".fam-vine--l"), { x: "-5vw", rotation: -3 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".fam-vine--r"), { x: "5vw", rotation: 3 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });

    // the depth layers, across the whole pass of the section (none ever uncovers an edge)
    const pass = { trigger: root, start: "top bottom", end: "bottom top", scrub: scrub() };
    const layer = (sel: string, from: number, to: number) =>
      gsap.fromTo(q(sel), { y: from * v }, { y: to * v, ease: "none", scrollTrigger: pass });
    layer(".fam-meadow", -0.07, 0.07);
    layer(".fam-vine", -0.17, 0.02);
    layer(".fam-head", -0.05, 0.05);
    layer(".fam-grid", 0.07, -0.07);
    layer(".fam-bloom", 0.22, -0.01);

    // each frame comes in from its own edge of the screen, with the scroll
    (q(".fam-card") as HTMLElement[]).forEach((card, i) => {
      const photo = card.querySelector(".fam-photo") as HTMLElement;
      const off = () => {
        const left = card.getBoundingClientRect().left + photo.offsetLeft;
        return i === 0 ? -(left + photo.offsetWidth + 24) : window.innerWidth - left + 24;
      };
      gsap.fromTo(photo, { x: off, scale: 0.94 }, {
        x: 0, scale: 1, ease: "power1.out",
        scrollTrigger: { trigger: card, start: "top bottom", end: mobile ? "top 45%" : "top 32%", scrub: scrub(), invalidateOnRefresh: true },
      });
    });

    // the garland draws between them, and its knot is tied
    gsap.from(q(".fam-link path"), {
      drawSVG: "0%", ease: "none",
      scrollTrigger: { trigger: grid, start: "top 70%", end: "center 50%", scrub: true },
    });
    gsap.from(q(".fam-knot"), {
      scale: 0, rotation: -40, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.7)",
      scrollTrigger: { trigger: grid, start: "center 52%", toggleActions: "play none none reverse" },
    });
  });

  return (
    <section ref={ref} id="family" className="family section paper" aria-labelledby="family-title" data-stage>
      <div className="fam-scene" aria-hidden="true">
        {/* the real Tuscan fields along the foot (tools/build_fields.py) */}
        <div className="fam-meadow"><Pic src="/assets/img/fields-meadow" alt="" className="fam-fields" /></div>
        <Sprite name="canopy-l" className="fam-vine fam-vine--l" />
        <Sprite name="canopy-r" className="fam-vine fam-vine--r" />
        <Sprite name="bed-l" className="fam-bloom fam-bloom--l" />
        <Sprite name="bed-r" className="fam-bloom fam-bloom--r" />
      </div>
      <header className="container center fam-head">
        <p className="eyebrow" data-reveal="fade">Our families</p>
        <h2 id="family-title" className="script" data-reveal="up">With Love &amp; Blessings</h2>
      </header>
      <div className="container fam-grid">
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
    </section>
  );
}
