"use client";

import { useMemo } from "react";
import { wedding } from "@/content/wedding";
import { clock, weekdayDate } from "@/lib/dates";
import { gsap, scrub, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import { Sprite } from "@/components/Pic";
import "./ceremony.css";

/** Deterministic RNG so the server and the browser draw the same jasmine. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A curtain half: strands of jasmine (mogra) buds with the odd blush rose. */
function JasmineCurtain({ side }: { side: "l" | "r" }) {
  const strands = useMemo(() => {
    const r = rng(side === "l" ? 11 : 29);
    const out: { x: number; len: number; buds: { y: number; s: number; rose: boolean; dx: number }[] }[] = [];
    const n = 17;
    for (let i = 0; i < n; i++) {
      const x = 8 + (i / (n - 1)) * 284 + (r() - 0.5) * 6;
      const len = 560 + r() * 280 - (side === "l" ? i : n - i) * 6;
      const buds = [];
      for (let y = 10 + r() * 14; y < len; y += 15 + r() * 7) buds.push({ y, s: 0.75 + r() * 0.5, rose: r() < 0.06, dx: (r() - 0.5) * 3 });
      out.push({ x, len, buds });
    }
    return out;
  }, [side]);
  return (
    <svg className={`jas jas--${side}`} viewBox="0 0 300 900" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <radialGradient id={`bud-${side}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fffdf7" />
          <stop offset="0.7" stopColor="#f3eedf" />
          <stop offset="1" stopColor="#d9d2bd" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="300" height="10" fill="#c4a66a" />
      {strands.map((s, i) => (
        <g key={i} className="jas-strand" style={{ animationDelay: `${(i % 5) * -0.7}s` }}>
          <line x1={s.x} y1="8" x2={s.x} y2={s.len} stroke="#6f8a5c" strokeWidth="0.8" />
          {s.buds.map((b, j) => b.rose
            ? <circle key={j} cx={s.x + b.dx} cy={b.y} r={4.6 * b.s} fill="#d9a5a0" stroke="#9c5b55" strokeWidth="0.5" />
            : <ellipse key={j} cx={s.x + b.dx} cy={b.y} rx={3.1 * b.s} ry={4.2 * b.s} fill={`url(#bud-${side})`} stroke="#cfc6ad" strokeWidth="0.4" />)}
        </g>
      ))}
    </svg>
  );
}

/** Seven-lobed (scalloped) mandap arch, as an SVG path in a 600 × 700 box. */
function scallopPath() {
  const cx = 300, cy = 340, R = 168, lobes = 9;
  const pts = Array.from({ length: lobes + 1 }, (_, i) => {
    const a = Math.PI - (i / lobes) * Math.PI;
    // rounded so the server and the browser print the identical path
    return [Math.round((cx + R * Math.cos(a)) * 10) / 10, Math.round((cy - R * Math.sin(a) * 1.08) * 10) / 10];
  });
  let d = `M ${cx - R} 660 L ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    const chord = Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
    const rr = (chord * 0.56).toFixed(1);
    d += ` A ${rr} ${rr} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ` L ${cx + R} 660 Z`;
}

function Mandap() {
  const arch = useMemo(scallopPath, []);
  return (
    <svg className="mandap" viewBox="0 0 600 700" role="img" aria-label="A wedding mandap with a scalloped arch, framing Janvi and Rohit exchanging garlands">
      <defs>
        <clipPath id="mandap-open"><path d={arch} /></clipPath>
        <linearGradient id="pillar" x1="0" x2="1">
          <stop offset="0" stopColor="#efe6d2" /><stop offset="0.5" stopColor="#fbf7ee" /><stop offset="1" stopColor="#e6dbc3" />
        </linearGradient>
      </defs>
      <image href="/assets/img/ceremony-arch.webp" x="120" y="150" width="360" height="520" preserveAspectRatio="xMidYMax slice" clipPath="url(#mandap-open)" />
      <g className="mandap-lines" fill="none" stroke="#7a5e2a" strokeWidth="1.6" strokeLinejoin="round">
        <path d={arch} />
        {/* canopy and finial */}
        <path d="M 70 196 C 150 120, 230 86, 300 70 C 370 86, 450 120, 530 196" />
        <path d="M 54 206 H 546" />
        <path d="M 300 70 V 44 M 288 44 C 288 30, 312 30, 312 44 Z M 300 30 V 16" />
        <path d="M 120 150 C 120 136, 136 136, 136 150 M 464 150 C 464 136, 480 136, 480 150" />
        {/* front pillars */}
        <rect x="76" y="206" width="52" height="454" fill="url(#pillar)" />
        <rect x="472" y="206" width="52" height="454" fill="url(#pillar)" />
        <path d="M 70 236 H 134 M 70 630 H 134 M 466 236 H 530 M 466 630 H 530" />
        <path d="M 102 260 V 606 M 498 260 V 606" strokeDasharray="2 10" />
        {/* garland swags */}
        <path className="mandap-swag" d="M 102 230 Q 200 300, 300 236 Q 400 300, 498 230" stroke="#c4a66a" strokeDasharray="0.1 9" strokeWidth="6" strokeLinecap="round" />
        <path d="M 102 230 Q 200 300, 300 236 Q 400 300, 498 230" stroke="#9c5b55" strokeWidth="0.8" />
        {/* plinth */}
        <path d="M 40 660 H 560 M 28 676 H 572 M 28 676 V 690 H 572 V 676" fill="#f3ecdc" />
      </g>
    </svg>
  );
}

const DIYAS = [-2, -1, 0, 1, 2];

/** S08 · The wedding ceremony. */
export default function Ceremony() {
  const c = wedding.ceremony;
  const event = wedding.events.find((e) => e.type === "ceremony");
  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const mobile = window.innerWidth < 768;
    const vw = window.innerWidth, vh = window.innerHeight;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: q(".cer-stage")[0], start: "top top", end: `+=${(mobile ? 1.7 : 2.2) * vh}`, pin: true, scrub: scrub(), anticipatePin: 1 },
    });
    tl.to(q(".jas--l"), { x: -(mobile ? 0.72 : 0.62) * vw, rotation: -2, y: -0.04 * vh, ease: "power1.in", duration: 0.35 }, 0)
      .to(q(".jas--r"), { x: (mobile ? 0.72 : 0.62) * vw, rotation: 2, y: -0.04 * vh, ease: "power1.in", duration: 0.35 }, 0)
      .fromTo(q(".cer-mandap"), { scale: 1.12, y: 0.04 * vh }, { scale: 1, y: 0, ease: "power2.out", duration: 0.45 }, 0.1)
      .fromTo(q(".cer-garden"), { scale: 1.05 }, { scale: 1, duration: 0.55 }, 0)
      .fromTo(q(".diya-glow"), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.12, stagger: { each: 0.03, from: "center" } }, 0.4)
      .fromTo(q(".cer-petal"), { y: -0.15 * vh }, { y: 1.1 * vh, rotation: (i: number) => 140 + i * 37, x: (i: number) => (i % 2 ? 1 : -1) * 0.05 * vw, duration: 0.4, stagger: 0.012 }, 0.4)
      .from(q(".cer-text > *"), { y: 30, autoAlpha: 0, duration: 0.1, stagger: 0.03, ease: tokens.ease.reveal }, 0.46)
      .to({}, { duration: 0.15 });
  });

  return (
    <section ref={ref} id="ceremony" className="cer" aria-labelledby="cer-title">
      <div className="cer-stage">
        <div className="cer-garden" aria-hidden="true">
          <Sprite name="cypress-l" className="cer-cypress cer-cypress--l" />
          <Sprite name="cypress-r" className="cer-cypress cer-cypress--r" />
          <div className="cer-lawn" />
        </div>
        <div className="cer-mandap">
          <Mandap />
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
        <JasmineCurtain side="l" />
        <JasmineCurtain side="r" />
      </div>

      <div className="container cer-guide section">
        <header className="center cer-guide-head">
          <p className="eyebrow" data-reveal="fade">What to expect</p>
          <h3 className="h2" data-reveal="up">The rituals, gently explained</h3>
        </header>
        <ol className="cer-rituals" data-reveal="stagger">
          {c.rituals.map((r, i) => (
            <li key={r.name} className="cer-ritual card" data-item>
              <span className="cer-num names">{String(i + 1).padStart(2, "0")}</span>
              <h4 className="h3">{r.name}</h4>
              <p className="body-s">{r.text}</p>
            </li>
          ))}
        </ol>
        <p className="cer-note center measure" data-reveal="fade">{c.note}</p>
      </div>
    </section>
  );
}
