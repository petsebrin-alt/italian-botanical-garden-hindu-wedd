"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { InvocationIcon, LotusDivider } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import { heroAsset } from "@/lib/heroAsset";
import Ridges from "@/components/Ridges";
import "./welcome.css";

/**
 * S02 · Welcome: one Italian garden scene, no framed photo. The blessing sits in the open sky;
 * the arbour and hydrangeas frame the left, the villa terrace and its cypresses the right, with
 * hills on the horizon. Every layer moves at its own depth as the page scrolls, and the garden
 * gathers in from both sides as the scene arrives.
 */
export default function Welcome() {
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const enter = { trigger: root, start: "top bottom", end: "top 12%", scrub: scrub() };
    gsap.fromTo(q(".wel-villa"), { x: "9vw" }, { x: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".wel-canopy"), { x: "-7vw", rotation: -2 }, { x: 0, rotation: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".wel-bed"), { scale: 1.12 }, { scale: 1, transformOrigin: "50% 100%", ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".wel-cypress--l"), { x: "-4vw" }, { x: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".wel-cypress--r"), { x: "4vw" }, { x: 0, ease: "power2.out", scrollTrigger: enter });
    // the clouds keep drifting apart while the section crosses the screen
    (q(".wel-cloud") as HTMLElement[]).forEach((c, i) => {
      gsap.fromTo(c, { x: `${(i % 2 ? 1 : -1) * 3}vw` }, {
        x: `${(i % 2 ? -1 : 1) * 3}vw`, ease: "none",
        scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: scrub() },
      });
    });
  });
  const { invocation, message } = wedding.welcome;

  return (
    <section ref={ref} id="welcome" className="welcome rise-over" aria-labelledby="welcome-title" data-stage>
      <div className="wel-scene" aria-hidden="true">
        <div className="wel-sky" data-depth="-0.4"><span className="wel-sun" /></div>
        <div className="wel-clouds" data-depth="-0.3">
          {[1, 2, 3, 1].map((n, i) => (
            <img key={i} className={`wel-cloud wel-cloud--${i + 1}`} src={heroAsset(`cloud-${n}.webp`)} alt="" loading="lazy" decoding="async" />
          ))}
        </div>
        <Ridges id="wel" className="wel-ridge" depths={[-0.26, -0.17, -0.08]} />
        <Sprite name="trees-r" className="wel-cypress wel-cypress--r" depth={-0.06} />
        <Sprite name="trees-l" className="wel-cypress wel-cypress--l" depth={-0.06} />
        <div className="wel-villa" data-depth="0.05">
          <Pic src="/assets/img/welcome-villa" alt="" />
        </div>
        <Sprite name="frame-l" className="wel-canopy sway sway--slow" depth={0.16} />
        <div className="wel-bed" data-depth="0.3"><Sprite name="bloom-r" className="wel-bed-img" /></div>
        <div className="wel-mist" />
      </div>

      <div className="container wel-text">
        {invocation.enabled && (
          <>
            <div data-reveal="draw" className="welcome-icon"><InvocationIcon /></div>
            <p lang={invocation.lang} className="welcome-invocation" data-reveal="up">{invocation.text}</p>
          </>
        )}
        <h2 id="welcome-title" className="script wel-title" data-reveal="up" data-delay="0.1">Welcome</h2>
        <p className="eyebrow wel-eyebrow" data-reveal="fade" data-delay="0.2">To our wedding celebration</p>
        <LotusDivider className="welcome-ornament" />
        <p className="welcome-message" data-reveal="lines">{message}</p>
      </div>
    </section>
  );
}
