"use client";

import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import Pic, { Sprite } from "@/components/Pic";
import "./story.css";

/** S04 · Our Love Story: a vine grows down the timeline and buds bloom at each memory. */
export default function Story() {
  const items = wedding.story;
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C" || items.length < 2) return;
    const list = q(".story-list")[0];
    gsap.from(q(".story-vine-path"), {
      drawSVG: "0%", ease: "none",
      scrollTrigger: { trigger: list, start: "top 62%", end: "bottom 62%", scrub: true },
    });
    (q(".story-item") as HTMLElement[]).forEach((item) => {
      const bud = item.querySelector(".story-bud");
      gsap.fromTo(bud, { scale: 0.35, rotation: -25, backgroundColor: "#A9BBA0" }, {
        scale: 1, rotation: 0, backgroundColor: "#D9A5A0", duration: 0.6, ease: "back.out(1.6)",
        scrollTrigger: { trigger: item, start: "top 58%", toggleActions: "play none none reverse" },
      });
      const text = item.querySelectorAll(".story-label, .story-title, .story-body");
      gsap.from(text, {
        y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: tokens.ease.reveal,
        scrollTrigger: { trigger: item, start: "top 78%", once: true },
      });
    });

    if (window.innerWidth < 1024) return;
    // desktop: the arched stage swaps photographs as each memory crosses the centre
    const photos = q(".story-photo") as HTMLElement[];
    gsap.set(photos, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(photos[0], { clipPath: "inset(0% 0% 0% 0%)" });
    let current = 0;
    const show = (i: number) => {
      if (i === current) return;
      const down = i > current;
      const incoming = photos[i], outgoing = photos[current];
      gsap.set(incoming, { zIndex: 2 });
      gsap.set(outgoing, { zIndex: 1 });
      gsap.fromTo(incoming, { clipPath: down ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: tokens.ease.cinematic, overwrite: true,
      });
      gsap.fromTo(incoming.querySelector("img"), { scale: 1.12 }, { scale: 1, duration: 1.1, ease: tokens.ease.reveal });
      gsap.to(outgoing.querySelector("img"), { scale: 1.04, duration: 0.9 });
      current = i;
      q(".story-caption-text").forEach((c, n) => c.classList.toggle("is-on", n === i));
    };
    (q(".story-item") as HTMLElement[]).forEach((item, i) => {
      ScrollTrigger.create({ trigger: item, start: "top 55%", end: "bottom 55%", onEnter: () => show(i), onEnterBack: () => show(i) });
    });
  });

  return (
    <section ref={ref} id="story" className="story section paper" aria-labelledby="story-title" data-stage>
      <Sprite name="wisteria-2" className="hang hang--r sway" depth={-0.2} />
      <header className="container center story-head">
        <p className="eyebrow" data-reveal="fade">A journey of friendship, laughter and countless memories</p>
        <h2 id="story-title" className="script" data-reveal="up">Our Love Story</h2>
      </header>

      <div className="container story-grid">
        <div className="story-stage-wrap" aria-hidden="true">
          <div className="story-stage arch arch--frame">
            {items.map((m, i) => (
              <div key={i} className="story-photo">
                <Pic src={m.image} alt="" />
              </div>
            ))}
          </div>
          <p className="story-caption caption">
            {items.map((m, i) => (
              <span key={i} className={`story-caption-text${i === 0 ? " is-on" : ""}`}>{m.title}</span>
            ))}
          </p>
        </div>

        <ol className="story-list">
          {items.length > 1 && (
            <svg className="story-vine" viewBox="0 0 40 1000" preserveAspectRatio="none" aria-hidden="true">
              <path className="story-vine-path" d="M20 0 C 2 90, 38 170, 20 250 C 2 330, 38 420, 20 500 C 2 580, 38 670, 20 750 C 2 830, 38 920, 20 1000"
                fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
          {items.map((m, i) => (
            <li key={i} className="story-item">
              <span className="story-bud" aria-hidden="true" />
              <figure className="story-inline arch arch--frame">
                <Pic src={m.image} alt={m.alt} inner />
              </figure>
              <p className="story-label eyebrow">{m.label}</p>
              <h3 className="story-title h3">{m.title}</h3>
              <p className="story-body">{m.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
