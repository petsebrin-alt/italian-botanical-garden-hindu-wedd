"use client";

import { wedding } from "@/content/wedding";
import { clock, weekdayDate } from "@/lib/dates";
import { gsap, scrub, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { Sprite } from "@/components/Pic";
import GardenWindow from "./GardenWindow";
import { CrystalCurtain, type AtlasMeta } from "./crystal-curtain";
import atlasMeta from "../../public/assets/img/crystal-atlas.json";
import "./ceremony.css";


/** S08 · The wedding ceremony. */
export default function Ceremony() {
  const c = wedding.ceremony;
  const event = wedding.events.find((e) => e.type === "ceremony");
  const ref = useScene<HTMLElement>((root, q, tier) => {
    // the crystal curtain, drawn live from the real crystals (crystal-curtain.ts)
    const canvas = q(".crys-canvas")[0] as HTMLCanvasElement;
    const atlas = new Image();
    atlas.decoding = "async";
    atlas.src = "/assets/img/crystal-atlas.webp";
    let curtain: CrystalCurtain | null = null;
    const pending = { wave: 0, open: 0 };
    let alive = true;
    atlas.decode().catch(() => undefined).then(() => {
      if (!alive) return;
      curtain = new CrystalCurtain(canvas, atlas, atlasMeta as AtlasMeta, tier === "C");
      curtain.state = pending;
      curtain.draw();
    });
    const cleanup = () => { alive = false; curtain?.destroy(); };
    if (tier === "C") return cleanup;

    const mobile = window.innerWidth < 768;
    const vw = window.innerWidth, vh = window.innerHeight;
    void vw;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: q(".cer-stage")[0],
        start: "top top",
        end: `+=${(mobile ? 1.5 : 1.8) * vh}`,
        pin: true,
        scrub: scrub(),
        anticipatePin: 1,
      },
    });
    // the curtain ripples first, then its strands are drawn open to both sides
    tl.to(pending, { wave: 1, duration: 0.16, ease: "sine.inOut" }, 0)
      .to(pending, { open: 1, duration: 0.42, ease: "power1.inOut" }, 0.15)
      .to(pending, { wave: 0.2, duration: 0.25, ease: "sine.inOut" }, 0.42)
      .fromTo(q(".cer-window-wrap"), { scale: 1.08, y: 0.04 * vh }, { scale: 1, y: 0, ease: "power2.out", duration: 0.45 }, 0.08)
      .fromTo(q(".cer-garden"), { scale: 1.05 }, { scale: 1, duration: 0.55 }, 0)
      // once the curtain has drawn open, the butterfly comes to the window
      .add(() => { q(".gw")[0]?.dispatchEvent(new Event("gw:start")); }, 0.42)
      .from(q(".cer-text > *"), { y: 30, autoAlpha: 0, duration: 0.1, stagger: 0.03, ease: tokens.ease.reveal }, 0.4)
      .to({}, { duration: 0.15 });
    return cleanup;
  });

  return (
    <section ref={ref} id="ceremony" className="cer" aria-labelledby="cer-title">
      <div className="cer-stage">
        {/* open sky and a real lawn: nothing between the window and the garden */}
        <div className="cer-garden" aria-hidden="true">
          <Sprite name="cloud-1" className="cer-cloud cer-cloud--1" />
          <Sprite name="cloud-2" className="cer-cloud cer-cloud--2" />
          <Sprite name="cloud-3" className="cer-cloud cer-cloud--3" />
          <img className="cer-lawn" src="/assets/window/lawn.webp" alt="" />
        </div>
        <div className="cer-window-wrap">
          <GardenWindow />
        </div>
        <div className="cer-text">
          <p className="eyebrow">The wedding ceremony</p>
          <h2 id="cer-title" className="script">{c.title}</h2>
          {event?.date && event.start && <p className="date-display cer-when">{weekdayDate(event.date)} <span className="cer-when-time">· {clock(event.start)}</span></p>}
        </div>
        <canvas className="crys-canvas" aria-hidden="true" />
        <div className="gw-fx" aria-hidden="true" />
      </div>
    </section>
  );
}
