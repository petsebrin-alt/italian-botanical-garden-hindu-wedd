"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { wedding } from "@/content/wedding";
import { weekdayDate } from "@/lib/dates";
import "./garden-window.css";

/**
 * The garden window invitation (inside the ceremony section).
 *
 *   1  a white wooden garden window, closed, roses climbing round it, sunlight moving over it
 *   2  a pink butterfly flies in (a faint trail of light behind it), hovers, lands on the handle
 *   3  the two shutters swing open on their hinges; warm light inside
 *   4  an ivory envelope inside: its flap lifts, the card rises out of it and comes forward
 *   5  the card: the couple's invitation, and an "Accept" button a hand points to
 *   6  accepted: the card is set aside, Janvi and Rohit appear in the window, butterflies fly
 *      across the whole section and rose petals fall
 *
 * The pieces are cut from the asset sheet by tools/build_window.py. The section starts the
 * sequence (a "gw:start" event) once its crystal curtain has drawn open.
 */
const A = "/assets/window/";

const noSubscribe = () => () => {};
const readGuest = () => {
  const p = new URLSearchParams(window.location.search);
  return (p.get("to") ?? p.get("guest") ?? "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 48);
};

/** An elegant pointing hand (ivory, gold outline), the tip of its finger at the top left. */
function Hand() {
  return (
    <svg className="gw-hand-svg" viewBox="0 0 64 72" aria-hidden="true">
      <path
        d="M14 6c3.2 0 5.6 2.5 5.6 5.7v18.6c1.2-1.4 3-2.2 5-2.2 2.4 0 4.4 1.2 5.5 3.1 1.1-1.1 2.7-1.8 4.4-1.8 2.6 0 4.8 1.5 5.8 3.7 1-.6 2.2-.9 3.4-.9 3.6 0 6.3 2.8 6.3 6.3v13.6c0 9.4-7.2 16.9-16.4 16.9h-4.2c-5.7 0-9.6-2.5-12.9-7.1L4.6 41.6c-1.6-2.3-1.1-5.4 1.2-7 2.2-1.6 5.2-1.1 6.9 1l1.7 2.1V11.7C8.4 8.5 10.8 6 14 6Z"
        fill="#fbf7ee" stroke="#9a7438" strokeWidth="2.2" strokeLinejoin="round"
      />
      <path d="M30.1 31.2v9.6M39.8 33.4v8.2M19.6 30.3v11" stroke="#9a7438" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export default function GardenWindow() {
  const root = useRef<HTMLDivElement>(null);
  const { tier, paused } = useMotion();
  const pausedNow = useRef(paused);
  pausedNow.current = paused;
  const guest = useSyncExternalStore(noSubscribe, readGuest, () => "");
  const [accepted, setAccepted] = useState(false);
  const acceptedRef = useRef(false);
  const api = useRef<{ start: () => void; accept: () => void; replay: () => void } | null>(null);
  const ceremony = wedding.events.find((e) => e.type === "ceremony");
  const { bride, groom } = wedding.couple;

  useEffect(() => {
    const el = root.current!;
    const q = (s: string) => el.querySelector(s) as HTMLElement;
    const fx = (el.closest(".cer-stage")?.querySelector(".gw-fx") as HTMLElement) ?? el;
    const still = tier === "C";
    let started = false;
    let done = false;
    const kill: (() => void)[] = [];
    const tls: gsap.core.Animation[] = [];

    const doorL = q(".gw-door--l"), doorR = q(".gw-door--r");
    const env = q(".gw-env"), flap = q(".gw-env-flap"), peek = q(".gw-env-peek");
    const card = q(".gw-card"), hand = q(".gw-hand"), btn = q(".gw-accept");
    const glow = q(".gw-glow"), couple = q(".gw-couple"), sun = q(".gw-sun-band");

    // ------------------------------------------------ the closed window
    const closed = () => {
      gsap.set([doorL, doorR], { rotationY: 0, filter: "brightness(1)" });
      gsap.set(env, { autoAlpha: 0, y: "18%", scale: 0.92 });
      gsap.set(flap, { rotationX: 0, zIndex: 3 });
      gsap.set(peek, { yPercent: 0, autoAlpha: 1 });
      gsap.set(card, { autoAlpha: 0, x: 0, y: 0, scale: 1 });
      gsap.set(card.querySelectorAll(".gw-reveal"), { autoAlpha: 0, y: 10 });
      gsap.set(hand, { autoAlpha: 0 });
      gsap.set(glow, { autoAlpha: 0 });
      gsap.set(couple, { autoAlpha: 0, scale: 1.08 });
    };
    closed();
    // sunlight drifting slowly over the closed window
    const sunTl = gsap.fromTo(sun, { xPercent: -120 }, { xPercent: 140, duration: 7, ease: "sine.inOut", repeat: -1, repeatDelay: 2.5, paused: still });
    tls.push(sunTl);

    // ------------------------------------------------ butterflies
    const bfSrc = [`${A}butterfly-1.webp`, `${A}butterfly-2.webp`, `${A}butterfly-3.webp`];
    const makeBf = (src: string, w: number) => {
      const b = document.createElement("div");
      b.className = "gw-bf";
      b.style.width = `${w}px`;
      const img = document.createElement("img");
      img.src = src; img.alt = ""; img.draggable = false;
      img.className = "gw-bf-wings";
      b.appendChild(img);
      fx.appendChild(b);
      kill.push(() => b.remove());
      return b;
    };
    const bez = (p: number[][], t: number) => {
      const u = 1 - t;
      return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]);
    };
    const trail = (x: number, y: number) => {
      const d = document.createElement("i");
      d.className = "gw-spark";
      d.style.left = `${x}px`; d.style.top = `${y}px`;
      fx.appendChild(d);
      gsap.to(d, { autoAlpha: 0, scale: 0.3, y: 12, duration: 0.9, ease: "power1.out", onComplete: () => d.remove() });
    };
    /** Fly a butterfly along a curve (fx-layer px); tilt follows the heading. */
    const fly = (b: HTMLElement, pts: number[][], duration: number, sparkle = false) => {
      const o = { t: 0 };
      let last = 0;
      return gsap.to(o, {
        t: 1, duration, ease: "sine.inOut",
        onUpdate: () => {
          const [x, y] = bez(pts, o.t);
          const [x2, y2] = bez(pts, Math.min(1, o.t + 0.01));
          const ang = Math.atan2(y2 - y, x2 - x) * 57.3;
          // nose forward, a gentle bank into the turn
          gsap.set(b, { x, y, rotation: Math.max(-35, Math.min(35, (ang > 90 || ang < -90 ? ang - 180 : ang) * 0.35)), scaleX: x2 < x ? 1 : -1 });
          const now = performance.now();
          if (sparkle && now - last > 55) { last = now; trail(x + b.offsetWidth / 2, y + b.offsetHeight / 2); }
        },
      });
    };
    const local = (node: HTMLElement) => {
      const r = node.getBoundingClientRect(), f = fx.getBoundingClientRect();
      return { x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height };
    };

    // ------------------------------------------------ the sequence
    const start = () => {
      if (started) return;
      started = true;
      if (still) {
        gsap.set([doorL, doorR], { rotationY: (i: number) => (i ? 112 : -112) });
        gsap.set(glow, { autoAlpha: 1 });
        gsap.set(env, { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(card, { autoAlpha: 1 });
        gsap.set(card.querySelectorAll(".gw-reveal"), { autoAlpha: 1, y: 0 });
        gsap.set(hand, { autoAlpha: 1 });
        return;
      }
      const f = local(fx), d = local(doorR);
      const W = f.w;
      const bw = Math.max(46, Math.min(78, d.w * 0.42));
      const handle = { x: d.x + d.w * 0.06 - bw / 2, y: d.y + d.h * 0.47 - bw * 0.62 };
      const bf = makeBf(bfSrc[0], bw);
      bf.classList.add("is-flying");
      gsap.set(bf, { x: W + 40, y: f.h * 0.3, autoAlpha: 1 });

      const tl = gsap.timeline();
      tls.push(tl);
      tl.add(fly(bf, [[W + 40, f.h * 0.3], [W * 0.82, f.h * 0.02], [handle.x + W * 0.16, handle.y - f.h * 0.22], [handle.x + bw * 0.5, handle.y - bw * 0.55]], 2.4, true), 0.4)
        // a breath of hovering beside the handle, then it settles on it
        .to(bf, { x: "-=" + bw * 0.25, y: "+=" + bw * 0.2, duration: 0.45, ease: "sine.inOut" }, 2.8)
        .to(bf, { x: "+=" + bw * 0.12, y: "-=" + bw * 0.1, duration: 0.4, ease: "sine.inOut" }, 3.25)
        .to(bf, { x: handle.x, y: handle.y, rotation: -6, duration: 0.55, ease: "power2.out", onComplete: () => bf.classList.replace("is-flying", "is-resting") }, 3.65)
        // the touch: the latch gives a little
        .to(doorR, { rotationY: 3, duration: 0.18, ease: "power1.out", yoyo: true, repeat: 1 }, 4.35)
        // it lifts off as the shutters swing open on their hinges
        .add(() => {
          bf.classList.replace("is-resting", "is-flying");
          const p = local(bf);
          fly(bf, [[p.x, p.y], [p.x + W * 0.05, p.y - f.h * 0.25], [W * 0.18, f.h * 0.1], [-120, f.h * 0.06]], 3.2);
        }, 4.75)
        .to(doorL, { rotationY: -114, filter: "brightness(0.86)", duration: 1.6, ease: "power2.inOut" }, 4.8)
        .to(doorR, { rotationY: 114, filter: "brightness(0.86)", duration: 1.6, ease: "power2.inOut" }, 4.92)
        .to(glow, { autoAlpha: 1, duration: 1.4, ease: "power1.out" }, 5.0)
        // the envelope inside comes forward, its flap lifts and the card rises out of it
        .to(env, { autoAlpha: 1, y: 0, scale: 1, duration: 1.0, ease: "power2.out" }, 5.7)
        .to(flap, { rotationX: 180, duration: 0.9, ease: "power2.inOut" }, 6.5)
        .set(flap, { zIndex: 0 }, 6.95)
        .to(peek, { yPercent: -58, duration: 0.9, ease: "power2.out" }, 7.2)
        .add(() => raiseCard(), 7.95);
    };

    /** The readable card takes over from the one in the envelope and comes forward. */
    const raiseCard = () => {
      const from = peek.getBoundingClientRect();
      gsap.set(card, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
      const to = card.getBoundingClientRect();
      const s = from.width / to.width;
      const tl = gsap.timeline();
      tls.push(tl);
      tl.fromTo(card, { x: from.left - to.left, y: from.top - to.top, scale: s, transformOrigin: "0 0" },
        { x: 0, y: 0, scale: 1, duration: 1.3, ease: "power3.inOut" }, 0)
        .to(peek, { autoAlpha: 0, duration: 0.25 }, 0.05)
        .to(env, { y: "6%", autoAlpha: 0.0, duration: 0.9, ease: "power1.in" }, 0.5)
        .to(card.querySelectorAll(".gw-reveal"), { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09, ease: "power2.out" }, 0.95)
        .add(() => { done = true; pointAt(); }, 2.0);
    };

    // ------------------------------------------------ a hand shows where to tap
    let handTl: gsap.core.Timeline | null = null;
    const pointAt = () => {
      if (acceptedRef.current || still) return;
      handTl?.kill();
      gsap.set(hand, { autoAlpha: 0, x: 46, y: 40, scale: 1 });
      handTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      handTl.to(hand, { autoAlpha: 1, x: 0, y: 0, duration: 0.9, ease: "power2.out" })
        .to(hand, { scale: 0.88, duration: 0.16, ease: "power1.in" })
        .to(btn, { scale: 0.96, duration: 0.16, ease: "power1.in" }, "<")
        .add(() => btn.classList.add("is-tapped"))
        .to(hand, { scale: 1, duration: 0.22, ease: "power1.out" })
        .to(btn, { scale: 1, duration: 0.22, ease: "power1.out" }, "<")
        .add(() => btn.classList.remove("is-tapped"), "+=0.5")
        .to(hand, { autoAlpha: 0, x: 30, y: 26, duration: 0.6, ease: "power1.in" }, "+=0.3");
      tls.push(handTl);
    };

    // ------------------------------------------------ accepted: the couple, butterflies, petals
    const accept = () => {
      handTl?.kill();
      gsap.to(hand, { autoAlpha: 0, duration: 0.25 });
      if (!done) {
        // accepted before the card had fully risen: finish the reveal at once
        tls.forEach((t) => t.progress(1));
      }
      const tl = gsap.timeline();
      tls.push(tl);
      tl.to(btn, { scale: 0.95, duration: 0.12, ease: "power1.in", yoyo: true, repeat: 1 }, 0)
        .to(card, { y: "+=" + card.offsetHeight * 0.12, autoAlpha: 0, scale: 0.94, duration: still ? 0.2 : 0.9, ease: "power2.in" }, 0.35)
        .to(couple, { autoAlpha: 1, scale: 1, duration: still ? 0.2 : 1.6, ease: "power2.out" }, still ? 0.4 : 0.9);
      if (still) return;
      celebrate();
    };

    const celebrate = () => {
      const f = local(fx);
      const W = f.w, H = f.h;
      // butterflies across the whole section
      for (let i = 0; i < 9; i++) {
        const w = 34 + Math.random() * 40;
        const b = makeBf(bfSrc[i % 3], w);
        b.classList.add("is-flying");
        b.style.setProperty("--flap", `${0.12 + Math.random() * 0.08}s`);
        const fromLeft = Math.random() < 0.5;
        const y0 = H * (0.2 + Math.random() * 0.7);
        const x0 = fromLeft ? -80 : W + 80, x3 = fromLeft ? W + 80 : -80;
        const pts = [[x0, y0], [W * (0.2 + Math.random() * 0.25), H * Math.random() * 0.7], [W * (0.55 + Math.random() * 0.25), H * (0.1 + Math.random() * 0.8)], [x3, H * Math.random() * 0.6]];
        gsap.set(b, { x: x0, y: y0, autoAlpha: 1 });
        const t = fly(b, pts, 5.5 + Math.random() * 3.5);
        t.delay(0.6 + i * 0.35);
        t.eventCallback("onComplete", () => b.remove());
        tls.push(t);
      }
      // rose petals falling over everything
      for (let i = 0; i < 30; i++) {
        const p = document.createElement("img");
        p.src = `${A}petal-${1 + (i % 3)}.webp`;
        p.alt = ""; p.className = "gw-petal";
        const size = 16 + Math.random() * 18;
        p.style.width = `${size}px`;
        p.style.setProperty("--spin", `${2.2 + Math.random() * 2.6}s`);
        fx.appendChild(p);
        kill.push(() => p.remove());
        const x = Math.random() * W;
        gsap.set(p, { x, y: -40, rotation: Math.random() * 360 });
        const dur = 6 + Math.random() * 4;
        const t = gsap.timeline({ delay: 0.4 + Math.random() * 3.2, onComplete: () => p.remove() });
        t.to(p, { y: H + 40, duration: dur, ease: "none" }, 0)
          .to(p, { x: x + (Math.random() - 0.5) * W * 0.25, duration: dur, ease: "sine.inOut" }, 0)
          .to(p, { rotation: "+=" + (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 300), duration: dur, ease: "none" }, 0);
        tls.push(t);
      }
    };

    const replay = () => {
      tls.forEach((t) => t.kill());
      tls.length = 0;
      kill.splice(0).forEach((k) => k());
      fx.querySelectorAll(".gw-bf, .gw-petal, .gw-spark").forEach((n) => n.remove());
      started = false; done = false;
      closed();
      const s2 = gsap.fromTo(sun, { xPercent: -120 }, { xPercent: 140, duration: 7, ease: "sine.inOut", repeat: -1, repeatDelay: 2.5, paused: still });
      tls.push(s2);
      requestAnimationFrame(start);
    };

    api.current = { start, accept, replay };
    const onStart = () => start();
    el.addEventListener("gw:start", onStart);
    if (still) start();
    return () => {
      el.removeEventListener("gw:start", onStart);
      tls.forEach((t) => t.kill());
      handTl?.kill();
      kill.forEach((k) => k());
      api.current = null;
    };
  }, [tier]);

  const onAccept = useCallback(() => {
    if (accepted) return;
    acceptedRef.current = true;
    setAccepted(true);
    api.current?.accept();
  }, [accepted]);

  const onReplay = useCallback(() => {
    acceptedRef.current = false;
    setAccepted(false);
    api.current?.replay();
  }, []);

  return (
    <div ref={root} className={`gw${accepted ? " gw--accepted" : ""}`}>
      <div className="gw-window">
        {/* inside the window: warm light, the envelope, and (once accepted) the couple */}
        <div className="gw-recess">
          <img className="gw-couple" src="/assets/img/ceremony-arch.webp" alt={`${bride.name} and ${groom.name} exchanging wedding garlands`} />
          <div className="gw-glow" aria-hidden="true" />
          <div className="gw-env" aria-hidden="true">
            <div className="gw-env-back" />
            <div className="gw-env-peek"><span className="gw-peek-mono">{bride.name[0]} · {groom.name[0]}</span></div>
            <div className="gw-env-front" />
            <div className="gw-env-flap" />
            <img className="gw-env-rose" src={`${A}rose.webp`} alt="" />
          </div>
        </div>
        <div className="gw-doors" aria-hidden="true">
          <div className="gw-door gw-door--l"><img src={`${A}door-l.webp`} alt="" draggable={false} /></div>
          <div className="gw-door gw-door--r"><img src={`${A}door-r.webp`} alt="" draggable={false} /></div>
        </div>
        <img className="gw-frame" src={`${A}frame.webp`} alt="" aria-hidden="true" draggable={false} />
        <div className="gw-sun" aria-hidden="true"><span className="gw-sun-band" /></div>
        <img className="gw-vine gw-vine--top" src={`${A}vine-top.webp`} alt="" aria-hidden="true" />
        <img className="gw-vine gw-vine--side" src={`${A}vine-side.webp`} alt="" aria-hidden="true" />
        <img className="gw-vine gw-vine--bottom" src={`${A}vine-bottom.webp`} alt="" aria-hidden="true" />
        <img className="gw-vine gw-vine--rose" src={`${A}rose.webp`} alt="" aria-hidden="true" />
        <img className="gw-vine gw-vine--daisy" src={`${A}daisy.webp`} alt="" aria-hidden="true" />
      </div>

      {/* the invitation card, risen out of the envelope: centred on the window (its slot centres
          it, so GSAP can own its transform) */}
      <div className="gw-card-slot">
      <div className="gw-card" role="group" aria-label="Invitation">
        <img className="gw-card-vine" src={`${A}vine-top.webp`} alt="" aria-hidden="true" />
        <p className="gw-reveal gw-card-eyebrow">Together with their families</p>
        {guest && <p className="gw-reveal gw-card-dear">Dear {guest},</p>}
        <p className="gw-reveal gw-card-names">{bride.name} <span>&amp;</span> {groom.name}</p>
        <p className="gw-reveal gw-card-line">joyfully invite you to celebrate their wedding</p>
        {ceremony?.date && <p className="gw-reveal gw-card-date">{weekdayDate(ceremony.date)} · {wedding.destination.label}</p>}
        <span className="gw-reveal gw-card-rule" aria-hidden="true" />
        <p className="gw-reveal gw-card-rsvp">Kindly RSVP</p>
        <div className="gw-reveal gw-accept-wrap">
          <button type="button" className="gw-accept" onClick={onAccept} disabled={accepted}>
            {accepted ? "Invitation accepted" : "Accept the Invitation"}
          </button>
          <span className="gw-hand" aria-hidden="true"><Hand /></span>
        </div>
      </div>
      </div>

      {accepted && (
        <div className="gw-thanks" role="status">
          <span>Thank you! We can&rsquo;t wait to celebrate with you in Tuscany.</span>
          <button type="button" className="gw-replay" onClick={onReplay} aria-label="Replay the invitation">↺<span className="gw-replay-word"> Replay</span></button>
        </div>
      )}
    </div>
  );
}
