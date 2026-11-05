"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub, SplitText, tokens } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { useScene } from "@/lib/scene";
import { Monogram } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./thank-you.css";

/** S15 · Thank you: the garden turns golden, cypress silhouettes rise and the lines arrive one by one. */
export default function ThankYou() {
  const { bride, groom } = wedding.couple;
  const { paused, togglePaused } = useMotion();
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const stage = q(".ty-stage")[0] as HTMLElement;
    const mobile = window.innerWidth < 768;
    gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top bottom", end: "top top", scrub: scrub() } })
      .fromTo(q(".ty-sun"), { scale: 0.8, autoAlpha: 0.2 }, { scale: 1.2, autoAlpha: 1 }, 0)
      .fromTo(q(".ty-hills"), { y: "10vh" }, { y: 0 }, 0)
      .fromTo(q(".ty-cypress"), { y: "22vh" }, { y: 0 }, 0)
      .fromTo(q(".ty-couple"), { y: "8vh", scale: 0.95 }, { y: 0, scale: 1 }, 0);

    const lines = q(".ty-line") as HTMLElement[];
    const splits = lines.map((l) => new SplitText(l, { type: "words", mask: "words" }));
    const tl = gsap.timeline({
      scrollTrigger: { trigger: stage, start: "top top", end: `+=${(mobile ? 0.8 : 1) * window.innerHeight}`, pin: true, scrub: scrub(), anticipatePin: 1 },
    });
    splits.forEach((s, i) => tl.from(s.words, { yPercent: 110, autoAlpha: 0, duration: 0.15, stagger: 0.03, ease: tokens.ease.reveal }, 0.05 + i * 0.25));
    tl.from(q(".ty-names, .ty-date"), { y: 30, autoAlpha: 0, duration: 0.15, stagger: 0.05 }, 0.78);
    gsap.from(q(".ty-mono .mono-draw"), { drawSVG: "0%", duration: 1.4, ease: tokens.ease.cinematic, scrollTrigger: { trigger: q(".ty-footer")[0], start: "top 90%", once: true } });
  });

  const share = `https://wa.me/?text=${encodeURIComponent(`You're invited: ${bride.name} & ${groom.name}`)}`;

  return (
    <section ref={ref} id="thank-you" className="ty" aria-labelledby="ty-title">
      <div className="ty-stage">
        <div className="ty-sky" aria-hidden="true" />
        <span className="ty-sun" aria-hidden="true" />
        <span className="ty-motes ambient" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</span>
        <Pic src="/assets/img/tuscan-hills-strip" alt="" className="ty-hills" />
        <Sprite name="cypress-l" className="ty-cypress ty-cypress--l" />
        <div className="ty-ground" aria-hidden="true" />
        <Sprite name="cypress-r" className="ty-cypress ty-cypress--r" />
        <Sprite name="couple" className="ty-couple" />
        <Sprite name="bed-l" className="ty-bloom ty-bloom--l" />
        <Sprite name="bed-r" className="ty-bloom ty-bloom--r" />

        <div className="ty-text">
          <h2 id="ty-title" className="ty-lines">
            {wedding.thankYou.lines.map((l) => <span key={l} className="ty-line">{l}</span>)}
          </h2>
          <p className="ty-names names">{bride.name} <span className="ty-amp">&amp;</span> {groom.name}</p>
          <p className="ty-date eyebrow">15 · 08 · 2027 · {wedding.destination.region}</p>
        </div>
      </div>

      <footer className="ty-footer paper">
        <div className="container ty-footer-inner">
          <Monogram className="ty-mono" size={96} />
          <p className="script script--m">With love, {bride.name} &amp; {groom.name}</p>
          <p className="eyebrow">{wedding.hashtag}</p>
          <div className="ty-actions">
            <a className="btn btn--gold" href={share} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
            <button className="btn btn--ghost" type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy link</button>
            <a className="btn btn--ghost" href="#top">Back to top</a>
          </div>
          <p className="ty-small body-s">
            <button type="button" className="rsvp-link" onClick={togglePaused} aria-pressed={paused}>{paused ? "Resume animations" : "Pause animations"}</button>
            {" · "}<a href="/privacy">Privacy</a>
          </p>
        </div>
      </footer>
    </section>
  );
}
