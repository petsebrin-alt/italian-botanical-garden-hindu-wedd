"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { Monogram } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./couple.css";

const PEOPLE = [
  { key: "bride", photo: "/assets/img/portrait-bride", alt: "Janvi in a blush-pink lehenga with kundan jewellery and a sheer dupatta", sprite: "wisteria-1" },
  { key: "groom", photo: "/assets/img/portrait-groom", alt: "Rohit in an ivory embroidered sherwani and a turban with a pearl kalgi", sprite: "wisteria-2" },
] as const;

/** S03 · Couple: two arched portraits uncover from below and meet in the middle. */
export default function Couple() {
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C" || window.innerWidth < 1024) return;
    // desktop: the portraits converge towards the monogram as the section arrives
    gsap.fromTo(q(".person--bride"), { x: "-7vw" }, {
      x: 0, ease: "power2.inOut",
      scrollTrigger: { trigger: q(".couple-grid")[0], start: "top 95%", end: "center 55%", scrub: scrub() },
    });
    gsap.fromTo(q(".person--groom"), { x: "7vw" }, {
      x: 0, ease: "power2.inOut",
      scrollTrigger: { trigger: q(".couple-grid")[0], start: "top 95%", end: "center 55%", scrub: scrub() },
    });
    gsap.from(q(".couple-mono"), {
      scale: 0.7, autoAlpha: 0, ease: "power2.out",
      scrollTrigger: { trigger: q(".couple-grid")[0], start: "top 70%", end: "center 55%", scrub: scrub() },
    });
  });
  const { bride, groom } = wedding.couple;
  const info = { bride, groom };

  return (
    <section ref={ref} id="couple" className="couple section paper" aria-labelledby="couple-title" data-stage>
      <Sprite name="bloom-l" className="couple-corner couple-corner--l" depth={0.3} />
      <Sprite name="bloom-r" className="couple-corner couple-corner--r" depth={0.3} />

      <header className="container center couple-head">
        <p className="eyebrow" data-reveal="fade">Meet</p>
        <h2 id="couple-title" className="script" data-reveal="up">The Couple</h2>
      </header>

      <div className="container couple-grid">
        {PEOPLE.map((p) => {
          const person = info[p.key];
          return (
            <article key={p.key} className={`person person--${p.key}`}>
              <div className="person-frame">
                <Sprite name={p.sprite} className="person-wisteria sway" depth={-0.08} />
                <figure className="person-arch arch arch--frame" data-reveal="mask">
                  <Pic src={p.photo} alt={p.alt} inner />
                </figure>
              </div>
              <h3 className="person-name names" data-reveal="chars">{person.name}</h3>
              <p className="person-role script script--m" data-reveal="up" data-delay="0.15">{person.role}</p>
              <p className="person-line body-s" data-reveal="fade" data-delay="0.25">{person.line}</p>
            </article>
          );
        }).flatMap((card, i) => (i === 0 ? [card, (
          <div key="mono" className="couple-mono" aria-hidden="true">
            <Monogram size={110} />
          </div>
        )] : [card]))}
      </div>
    </section>
  );
}
