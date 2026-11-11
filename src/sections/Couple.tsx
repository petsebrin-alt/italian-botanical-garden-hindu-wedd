"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { LotusDivider, Sprig } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./couple.css";

const PEOPLE = [
  { key: "bride", photo: "/assets/img/portrait-bride", alt: "Janvi in a blush-pink lehenga with kundan jewellery and a sheer dupatta" },
  { key: "groom", photo: "/assets/img/portrait-groom", alt: "Rohit in an ivory embroidered sherwani with a maroon velvet dupatta and a jewelled safa" },
] as const;

/** A small gold five-petal blossom, the full stop under each name. */
function Blossom() {
  return (
    <svg className="person-blossom" width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
      {[0, 72, 144, 216, 288].map((r) => (
        <path key={r} d="M13 13 C 10 9, 10.5 4.5, 13 2.5 C 15.5 4.5, 16 9, 13 13 Z" transform={`rotate(${r} 13 13)`} />
      ))}
      <circle cx="13" cy="13" r="2" fill="var(--ivory)" />
    </svg>
  );
}

/**
 * S03 · Couple: two arched portraits side by side in a garden frame (arbour vines above,
 * hydrangeas below, the photographed Tuscan fields on the horizon). With the scroll, the bride's
 * portrait comes in from the left edge of the screen and the groom's from the right, to meet in
 * the middle, while every layer moves at its own depth: the vines come down, the hills lag, the
 * portraits float a little ahead and the hydrangeas rise. Scrolling back up plays it in reverse.
 */
export default function Couple() {
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const mobile = window.innerWidth < 768;
    const v = window.innerHeight * (mobile ? 0.6 : 1);

    // the garden frame closes in around them as the section arrives
    const enter = { trigger: root, start: "top bottom", end: "top 20%", scrub: scrub() };
    gsap.fromTo(q(".cpl-vine--l"), { x: "-5vw", rotation: -3 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".cpl-vine--r"), { x: "5vw", rotation: 3 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".cpl-bed--l"), { x: "-6vw" }, { x: 0, ease: "power2.out", scrollTrigger: { ...enter, start: "top 70%", end: "bottom bottom" } });
    gsap.fromTo(q(".cpl-bed--r"), { x: "6vw" }, { x: 0, ease: "power2.out", scrollTrigger: { ...enter, start: "top 70%", end: "bottom bottom" } });

    // the depth layers, across the whole pass of the section (none ever uncovers an edge)
    const pass = { trigger: root, start: "top bottom", end: "bottom top", scrub: scrub() };
    const layer = (sel: string, from: number, to: number) =>
      gsap.fromTo(q(sel), { y: from * v }, { y: to * v, ease: "none", scrollTrigger: pass });
    layer(".cpl-horizon", -0.07, 0.07);
    layer(".cpl-vine", -0.17, 0.02);
    layer(".couple-head", -0.05, 0.05);
    layer(".couple-grid", 0.07, -0.07);
    layer(".cpl-bed", 0.22, -0.01);

    // the portraits come in from the edges of the screen to the middle, with the scroll
    const grid = q(".couple-grid")[0] as HTMLElement;
    const slide = { trigger: grid, start: "top bottom", end: "top 32%", scrub: scrub(), invalidateOnRefresh: true };
    (q(".person-slide") as HTMLElement[]).forEach((el, i) => {
      // (measured from its resting place: the grid only ever moves up and down)
      const off = () => {
        const g = grid.getBoundingClientRect().left;
        return i === 0 ? -(g + el.offsetLeft + el.offsetWidth + 24) : window.innerWidth - (g + el.offsetLeft) + 24;
      };
      gsap.fromTo(el, { x: off, scale: 0.94 }, { x: 0, scale: 1, ease: "power1.out", scrollTrigger: slide });
    });
  });
  const { bride, groom } = wedding.couple;
  const info = { bride, groom };

  return (
    <section ref={ref} id="couple" className="couple section paper" aria-labelledby="couple-title" data-stage>
      <div className="cpl-frame" aria-hidden="true">
        {/* the real Tuscan fields: vineyard hills, the far mountains and the lawn (tools/build_fields.py) */}
        <div className="cpl-horizon"><Pic src="/assets/img/fields-hills" alt="" className="cpl-fields" /></div>
        <Sprite name="canopy-l" className="cpl-vine cpl-vine--l" />
        <Sprite name="canopy-r" className="cpl-vine cpl-vine--r" />
        <Sprite name="bed-l" className="cpl-bed cpl-bed--l" />
        <Sprite name="bed-r" className="cpl-bed cpl-bed--r" />
      </div>

      <header className="container center couple-head">
        <h2 id="couple-title" className="script" data-reveal="up">The Couple</h2>
        <LotusDivider className="couple-ornament" />
      </header>

      <div className="container couple-grid">
        {PEOPLE.map((p) => {
          const person = info[p.key];
          return (
            <article key={p.key} className={`person person--${p.key}`}>
              <div className="person-slide">
                <figure className="person-arch">
                  <div className="person-photo arch">
                    <Pic src={p.photo} alt={p.alt} inner />
                  </div>
                </figure>
              </div>
              <h3 className="person-name names" data-reveal="chars">{person.name}</h3>
              <p className="person-role script" data-reveal="up" data-delay="0.15">{person.role}</p>
              <p className="person-line body-s" data-reveal="fade" data-delay="0.25">{person.line}</p>
              <div className="person-flourish" data-reveal="fade" data-delay="0.35" aria-hidden="true">
                <Sprig /><Blossom /><Sprig flip />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
