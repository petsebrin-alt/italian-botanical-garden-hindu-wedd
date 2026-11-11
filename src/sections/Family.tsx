"use client";

import { wedding } from "@/content/wedding";
import { gsap } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { Sprite } from "@/components/Pic";
import "./family.css";

/** The parents' portraits, each in its oval beaded frame (cut by tools/build_parents.py). */
const PORTRAIT = {
  bride: { src: "/assets/img/family-bride.webp", w: 679, h: 872 },
  groom: { src: "/assets/img/family-groom.webp", w: 681, h: 874 },
} as const;

/** S09 · Family introduction: the parents' portraits in oval frames, joined by a drawn garland. */
export default function Family() {
  const { bride, groom } = wedding.families;
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    gsap.from(q(".fam-link path"), {
      drawSVG: "0%", ease: "none",
      scrollTrigger: { trigger: q(".fam-grid")[0], start: "top 70%", end: "center 50%", scrub: true },
    });
    gsap.from(q(".fam-knot"), {
      scale: 0, rotation: -40, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(1.7)",
      scrollTrigger: { trigger: q(".fam-grid")[0], start: "center 52%", toggleActions: "play none none reverse" },
    });
    gsap.from(q(".fam-card--bride"), { x: -24, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: q(".fam-grid")[0], start: "top 75%", once: true } });
    gsap.from(q(".fam-card--groom"), { x: 24, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: q(".fam-grid")[0], start: "top 75%", once: true } });
  });

  return (
    <section ref={ref} id="family" className="family section paper" aria-labelledby="family-title" data-stage>
      <Sprite name="bed-l" className="fam-bloom fam-bloom--l" depth={0.3} />
      <Sprite name="bed-r" className="fam-bloom fam-bloom--r" depth={0.3} />
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
