"use client";

import { useState, useCallback } from "react";
import { wedding } from "@/content/wedding";
import { clock, weekdayDate } from "@/lib/dates";
import { gsap, scrub, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { Sprite } from "@/components/Pic";
import { CrystalCurtain, type AtlasMeta } from "./crystal-curtain";
import atlasMeta from "../../public/assets/img/crystal-atlas.json";
import "./ceremony.css";


/** Rustic Italian floral window with 3D opening shutters, flying butterfly, and couple reveal. */
function FloralWindow() {
  const [accepted, setAccepted] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleAccept = useCallback(() => {
    if (accepted || animating) return;
    setAnimating(true);
    setAccepted(true);
    setTimeout(() => setAnimating(false), 2600);
  }, [accepted, animating]);

  const handleReplay = useCallback(() => {
    setAccepted(false);
    setAnimating(false);
  }, []);

  return (
    <div className={`cer-window ${accepted ? "cer-window--open" : "cer-window--closed"}`}>
      {/* 1. Behind the window: The couple exchanging garlands in Tuscany */}
      <div className="win-opening">
        <img
          src="/assets/img/ceremony-arch.webp"
          alt="Janvi and Rohit exchanging wedding garlands under the Tuscan sun"
          className="win-couple-img"
        />
        <div className="win-sunbeam" aria-hidden="true" />
      </div>

      {/* 2. 3D Shutters that swing open when invitation is accepted */}
      <div className="win-shutters-stage" aria-hidden="true">
        <div className="win-shutter win-shutter--l">
          <img src="/assets/img/window-shutter-l.webp" alt="" className="win-shutter-tex" />
        </div>
        <div className="win-shutter win-shutter--r">
          <img src="/assets/img/window-shutter-r.webp" alt="" className="win-shutter-tex" />
        </div>
      </div>

      {/* 3. The Floral Stone Window Frame with Climbing Roses, Ivy, Daisies & Butterflies */}
      <img
        src="/assets/img/floral-window-frame.webp"
        className="win-frame-overlay"
        alt="Italian rustic floral arched window frame"
        aria-hidden="true"
      />

      {/* 4. Flying butterfly that flutters across the window when accepted */}
      <div
        className={`win-flying-bf ${accepted ? "win-flying-bf--flying" : ""}`}
        aria-hidden="true"
      >
        <img
          src="/assets/img/window-butterfly-pink.webp"
          alt=""
          className="win-bf-wing"
        />
        <div className="win-bf-sparkle" />
      </div>

      {/* 5. "Invite the Guest" RSVP Section on the Window */}
      <div className={`win-invite-card ${accepted ? "win-invite-card--hidden" : ""}`}>
        <div className="win-card-inner">
          <span className="win-badge">Tuscan Villa Wedding</span>
          <h3 className="win-title">Invite the Guest · RSVP</h3>
          <p className="win-couple">Janvi &amp; Rohit</p>
          <p className="win-quote">
            “Two souls, one heart, united forever under the Tuscan sun.”
          </p>
          <p className="win-note">
            Together with their families, Janvi &amp; Rohit warmly invite you to celebrate their sacred union.
          </p>
          <button
            type="button"
            className="win-accept-btn"
            onClick={handleAccept}
            aria-label="Accept our invitation"
          >
            <span className="win-btn-shimmer" aria-hidden="true" />
            <span className="win-btn-text">Accept Our Invitation 💌</span>
          </button>
        </div>
      </div>

      {/* 6. Confirmation Banner after acceptance */}
      {accepted && (
        <div className="win-accepted-banner" role="status">
          <span className="win-accepted-text">✨ Invitation Accepted · See you in Tuscany! ✨</span>
          <button
            type="button"
            className="win-replay-btn"
            onClick={handleReplay}
            title="Replay window animation"
            aria-label="Replay window animation"
          >
            ↺ Replay
          </button>
        </div>
      )}
    </div>
  );
}

const DIYAS = [-2, -1, 0, 1, 2];

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
      .fromTo(q(".diya-glow"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.12, stagger: { each: 0.03, from: "center" } }, 0.35)
      .fromTo(q(".cer-petal"), { y: -0.15 * vh }, { y: 1.1 * vh, rotation: (i: number) => 140 + i * 37, x: (i: number) => (i % 2 ? 1 : -1) * 0.05 * vw, duration: 0.4, stagger: 0.012 }, 0.35)
      .from(q(".cer-text > *"), { y: 30, autoAlpha: 0, duration: 0.1, stagger: 0.03, ease: tokens.ease.reveal }, 0.4)
      .to({}, { duration: 0.15 });
    return cleanup;
  });

  return (
    <section ref={ref} id="ceremony" className="cer" aria-labelledby="cer-title">
      <div className="cer-stage">
        <div className="cer-garden" aria-hidden="true">
          <Sprite name="cypress-l" className="cer-cypress cer-cypress--l" />
          <Sprite name="cypress-r" className="cer-cypress cer-cypress--r" />
          <div className="cer-lawn" />
        </div>
        <div className="cer-window-wrap">
          <FloralWindow />
          <div className="cer-diyas" aria-hidden="true">
            {DIYAS.map((d) => (
              <span key={d} className="diya" style={{ "--i": d } as React.CSSProperties}>
                <span className="diya-glow" />
                <svg viewBox="0 0 40 30" width="40" height="30">
                  <path className="diya-flame" d="M20 2 C 24 8, 24 12, 20 15 C 16 12, 16 8, 20 2 Z" fill="#f3b54a" />
                  <path d="M4 16 C 8 27, 32 27, 36 16 Z" fill="#b8893b" stroke="#7a5e2a" strokeWidth="0.8" />
                </svg>
              </span>
            ))}
          </div>
        </div>
        <div className="cer-text">
          <p className="eyebrow">The wedding ceremony</p>
          <h2 id="cer-title" className="script">{c.title}</h2>
          {event?.date && event.start && <p className="date-display cer-when">{weekdayDate(event.date)} · {clock(event.start)}</p>}
        </div>
        <div className="cer-petals" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <svg key={i} className="cer-petal" style={{ left: `${6 + i * 9.5}%` }} viewBox="0 0 20 24" width="18" height="22">
              <path d="M10 1 C 18 6, 19 16, 10 23 C 1 16, 2 6, 10 1 Z" fill={i % 3 ? "#e8b9b4" : "#d9a5a0"} />
            </svg>
          ))}
        </div>
        <canvas className="crys-canvas" aria-hidden="true" />
      </div>
    </section>
  );
}
