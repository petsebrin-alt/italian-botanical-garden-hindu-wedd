"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { InvocationIcon, LotusDivider } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./welcome.css";

/**
 * S02 · Welcome: one sunlit Tuscan garden, photographed, with the blessing in its open sky.
 * The photograph is split into depth layers (tools/build_welcome.py): the sky drifts slowest,
 * the lawn and hills hold, and the villa terrace, the hydrangeas and the wisteria canopy settle
 * in from below as the section arrives, nearer layers faster.
 */
export default function Welcome() {
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    // the near layers only ever settle downward-to-home, so nothing they cover is uncovered
    const enter = { trigger: root, start: "top bottom", end: "top 18%", scrub: scrub() };
    gsap.fromTo(q(".wel-near--l"), { yPercent: 3 }, { yPercent: 0, ease: "power2.out", scrollTrigger: enter });
    gsap.fromTo(q(".wel-near--r"), { yPercent: 1.4 }, { yPercent: 0, ease: "power2.out", scrollTrigger: enter });
  });
  const { invocation, message } = wedding.welcome;

  return (
    <section ref={ref} id="welcome" className="welcome rise-over" aria-labelledby="welcome-title" data-stage>
      <div className="wel-scene" aria-hidden="true">
        <div className="wel-box">
          <div className="wel-layer" data-depth="-0.3"><Pic src="/assets/img/welcome-sky" alt="" /></div>
          <div className="wel-layer"><Pic src="/assets/img/welcome-far" alt="" /></div>
          <div className="wel-layer wel-near wel-near--l"><Pic src="/assets/img/welcome-near-l" alt="" /></div>
          <div className="wel-layer wel-near wel-near--r"><Pic src="/assets/img/welcome-near-r" alt="" /></div>
        </div>
        {/* phones see the villa side of the garden: wisteria and hydrangeas join it */}
        <Sprite name="canopy-l" className="wel-canopy" depth={0.14} />
        <Sprite name="bed-l" className="wel-m wel-m-bed" depth={0.22} />
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
