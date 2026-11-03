"use client";

import { wedding } from "@/content/wedding";
import { useScene } from "@/lib/scene";
import { InvocationIcon, LotusDivider } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./welcome.css";

/** S02 · Welcome: an ivory garden wall rises over the hero, carrying the blessing. */
export default function Welcome() {
  const ref = useScene<HTMLElement>();
  const { invocation, message } = wedding.welcome;
  return (
    <section ref={ref} id="welcome" className="welcome rise-over paper" aria-labelledby="welcome-title" data-stage>
      <div className="welcome-edge" aria-hidden="true">
        <Sprite name="bloom-l" className="welcome-bloom welcome-bloom--l" depth={0.35} />
        <Sprite name="bloom-r" className="welcome-bloom welcome-bloom--r" depth={0.35} />
      </div>
      <Sprite name="wisteria-1" className="hang hang--l sway" depth={-0.18} />
      <Sprite name="wisteria-3" className="hang hang--l2 sway sway--slow" depth={-0.1} />
      <Sprite name="wisteria-2" className="hang hang--r sway" depth={-0.22} />

      <div className="container welcome-grid">
        <figure className="welcome-figure arch arch--frame" data-reveal="mask">
          <Pic src="/assets/img/villa-terrace" alt="A honey-stone Tuscan villa with arched windows and blush flowers" inner />
        </figure>

        <div className="welcome-text">
          {invocation.enabled && (
            <>
              <div data-reveal="draw" className="welcome-icon"><InvocationIcon /></div>
              <p lang={invocation.lang} className="welcome-invocation" data-reveal="up">{invocation.text}</p>
            </>
          )}
          <h2 id="welcome-title" className="script" data-reveal="up" data-delay="0.1">Welcome</h2>
          <p className="eyebrow" data-reveal="fade" data-delay="0.2">To our wedding celebration</p>
          <LotusDivider className="welcome-ornament" />
          <p className="welcome-message" data-reveal="lines">{message}</p>
        </div>
      </div>
    </section>
  );
}
