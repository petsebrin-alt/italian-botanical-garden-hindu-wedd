"use client";

import { wedding } from "@/content/wedding";
import { gsap, scrub, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import Pic, { Sprite } from "@/components/Pic";
import "./destination.css";

/**
 * S06 · Destination: a Tuscan arch window opens onto the cypress avenue, then the
 * camera walks down it. The avenue scales towards its vanishing point while the
 * near cypress rows sweep outward past the lens.
 */
export default function Destination() {
  const d = wedding.destination;
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const stage = q(".dest-stage")[0] as HTMLElement;
    const scene = q(".dest-scene")[0] as HTMLElement;
    const outline = q(".dest-outline")[0] as HTMLElement;
    const mobile = window.innerWidth < 768;
    const lite = tier === "B" ? 0.7 : 1;

    const win = { t: 0 };
    const apply = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const e = gsap.parseEase(tokens.ease.cinematic)(win.t);
      const w0 = W * (mobile ? 0.66 : 0.3), h0 = Math.min(H * 0.66, w0 * 1.38);
      const w = w0 + (W - w0) * e, h = h0 + (H - h0) * e;
      const left = (W - w) / 2, top = (H - h) / 2 + (1 - e) * H * 0.05;
      const r = (w / 2) * (1 - e);
      scene.style.clipPath = `inset(${top}px ${W - left - w}px ${H - top - h}px ${left}px round ${r}px ${r}px 0px 0px)`;
      Object.assign(outline.style, { left: `${left - 10}px`, top: `${top - 10}px`, width: `${w + 20}px`, height: `${h + 10}px`, borderRadius: `${r + 10}px ${r + 10}px 0 0`, opacity: String(1 - e) });
    };
    apply();

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: root, start: "top top", end: () => `+=${(mobile ? 2.0 : 2.6) * window.innerHeight}`, pin: stage, scrub: scrub(), anticipatePin: 1 },
    });
    tl.to(win, { t: 1, duration: 0.24, onUpdate: apply }, 0)
      .to(q(".dest-hang"), { yPercent: -40, autoAlpha: 0, duration: 0.18 }, 0.02)
      .fromTo(q(".dest-avenue"), { scale: 1.02 }, { scale: 1.5 * lite + (1 - lite), duration: 0.78 }, 0)
      .fromTo(q(".dest-near--l"), { x: 0, scale: 1 }, { x: -0.5 * window.innerWidth * lite, scale: 1.9, duration: 0.62 }, 0.1)
      .fromTo(q(".dest-near--r"), { x: 0, scale: 1 }, { x: 0.5 * window.innerWidth * lite, scale: 1.9, duration: 0.62 }, 0.1)
      // the ivory card arrives with its words (it must not show empty over the sky first)
      .fromTo(q(".dest-title"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.19)
      .from(q(".dest-title > *"), { y: 40, autoAlpha: 0, duration: 0.1, stagger: 0.03, ease: "power2.out" }, 0.2)
      .to(q(".dest-title"), { y: -0.08 * window.innerHeight, autoAlpha: 0, duration: 0.1, ease: "power1.in" }, 0.58)
      .to(q(".dest-veil"), { opacity: 1, duration: 0.12 }, 0.66)
      .from(q(".dest-card"), { y: 70, autoAlpha: 0, duration: 0.12, stagger: 0.04, ease: "power2.out" }, 0.72)
      .to({}, { duration: 0.08 });
  });

  return (
    <section ref={ref} id="destination" className="dest paper" aria-labelledby="dest-title">
      <div className="dest-stage">
        <span className="dest-outline" aria-hidden="true" />
        <div className="dest-hangs" aria-hidden="true">
          <Sprite name="strand-2" className="dest-hang dest-hang--1 sway" />
          <Sprite name="strand-1" className="dest-hang dest-hang--2 sway sway--slow" />
          <Sprite name="strand-3" className="dest-hang dest-hang--3 sway" />
        </div>

        <div className="dest-scene">
          <Pic src="/assets/img/cypress-avenue" alt="" className="dest-avenue" eager />
          <Sprite name="cypress-l" className="dest-near dest-near--l" />
          <Sprite name="cypress-r" className="dest-near dest-near--r" />
          <div className="dest-veil" aria-hidden="true" />

          <div className="dest-title">
            <p className="eyebrow">The destination</p>
            <h2 id="dest-title" className="names dest-heading">{d.label}</h2>
            <p className="script script--m">{d.welcome}</p>
          </div>

          <div className="container dest-cards">
            {d.highlights.map((h) => (
              <article key={h.title} className="dest-card card">
                <h3 className="h3">{h.title}</h3>
                <p className="body-s">{h.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
