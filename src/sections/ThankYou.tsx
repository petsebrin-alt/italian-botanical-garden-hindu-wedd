"use client";

import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import closing from "../../public/assets/closing/closing.json";
import "./thank-you.css";

const C = "/assets/closing/";
type Box = { x: number; y: number; w: number; h: number };
const L = closing.layers as unknown as Record<string, Box>;
/** The photograph's size, in its own pixels: the scene is laid out in them, at full height. */
const PW = closing.w, PH = closing.h, MID = PW / 2;
/** How many repeats of each row of cypresses reach out to the edge on the widest screens. */
const REPEATS = 7;

/** Where a piece sits: measured from the screen's centre, in the photo's pixels (`--f` turns
 *  them into the screen's). `edge` pins a piece at the photo's side to the screen's edge instead,
 *  whenever the screen is wider than the photo. */
function place(b: Box, edge?: "l" | "r", scale = 1, dx = 0, dy = 0): React.CSSProperties {
  const x = b.x * PW + dx, y = b.y * PH + dy, w = b.w * PW * scale, h = b.h * PH * scale;
  const s: React.CSSProperties = { top: `calc(${y.toFixed(1)} * var(--f))`, width: `calc(${w.toFixed(1)} * var(--f))`, height: `calc(${h.toFixed(1)} * var(--f))` };
  if (edge === "l") s.left = `min(0px, calc(50% - ${MID} * var(--f)))`;
  else if (edge === "r") s.right = `min(0px, calc(50% - ${MID} * var(--f)))`;
  else s.left = `calc(50% + ${(x - MID).toFixed(1)} * var(--f))`;
  return s;
}

/** The rows of cypresses, repeated outward from the avenue: each a little nearer (larger, and
 *  standing a little lower) than the one inside it, and in front of it. */
function rows() {
  const out: { key: string; src: string; side: "l" | "r"; k: number; style: React.CSSProperties }[] = [];
  const tl = L["trees-l"], tr = L["trees-r"];
  // each row's inner edge reaches well back over the row inside it, so no gap ever shows
  const OVERLAP = 0.45;
  let lEdge = tl.x * PW, rEdge = (tr.x + tr.w) * PW;
  for (let k = 1; k <= REPEATS; k++) {
    const sc = 1 + 0.09 * k;
    const lift = 16 * k;
    const lw = tl.w * PW * sc, lh = tl.h * PH * sc;
    const lRight = lEdge + lw * OVERLAP;
    lEdge = lRight - lw;
    out.push({ key: `l${k}`, src: "trees-l", side: "l", k, style: {
      left: `calc(50% + ${(lRight - lw - MID).toFixed(1)} * var(--f))`, top: `calc(${(tl.y * PH + tl.h * PH + lift - lh).toFixed(1)} * var(--f))`,
      width: `calc(${lw.toFixed(1)} * var(--f))`, height: `calc(${lh.toFixed(1)} * var(--f))`, zIndex: 2 + k,
    } });
    const rw = tr.w * PW * sc, rh = tr.h * PH * sc;
    const rLeft = rEdge - rw * OVERLAP;
    rEdge = rLeft + rw;
    out.push({ key: `r${k}`, src: "trees-r", side: "r", k, style: {
      left: `calc(50% + ${(rLeft - MID).toFixed(1)} * var(--f))`, top: `calc(${(tr.y * PH + tr.h * PH + lift - rh).toFixed(1)} * var(--f))`,
      width: `calc(${rw.toFixed(1)} * var(--f))`, height: `calc(${rh.toFixed(1)} * var(--f))`, zIndex: 2 + k,
    } });
  }
  return out;
}

/**
 * S15 · Thank you: the last screen of the invitation, edge to edge, and nothing else. The couple's
 * Tuscan garden is set together across the whole screen by itself, once, as soon as it comes into
 * view (like a film, not tied to the scroll): each piece appears whole and solid, never faded in,
 * moves straight into its place and stays. The hills; the cypress avenue and its rows of cypresses
 * reaching out to both edges; the lawn; the couple on the path, greeting the guests with joined
 * hands; the stone gateways at the screen's edges, one and then the other; the urns of flowers and
 * the branch overhead. Then "Thank You", the last line, the date, and a button back to the top.
 * Every piece is cut from the one photograph (tools/build_closing.py). With reduced motion the
 * finished scene simply stands.
 */
export default function ThankYou() {
  const { bride, groom } = wedding.couple;
  const t = wedding.thankYou;
  const date = new Date(`${wedding.date}T12:00:00Z`);
  const [y, m, d] = wedding.date.split("-");
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(date);
  const repeats = rows();

  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const P = (c: string) => q(`.ty-p--${c}`);
    gsap.set(q(".ty-p, .ty-words > *, .ty-top-btn"), { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    /** A piece appears at `at`, `from` (percent of its own size) away, and moves into its place. */
    const appear = (el: Element | Element[], at: number, from: { x?: number; y?: number }, dur = 0.85) =>
      tl.set(el, { autoAlpha: 1 }, at)
        .fromTo(el, { xPercent: from.x ?? 0, yPercent: from.y ?? 0 }, { xPercent: 0, yPercent: 0, duration: dur, immediateRender: false }, at);

    // the hills
    appear(P("hills"), 0, { y: 30 }, 0.8);
    // the cypress avenue, and its rows reaching out to both edges, one after another
    appear(P("avenue"), 0.45, { y: 26 }, 0.9);
    for (let k = 1; k <= REPEATS; k++) appear(q(`.ty-p--row[data-k="${k}"]`), 0.6 + k * 0.12, { y: 30 }, 0.85);
    // the lawn, and the couple on the path
    appear(P("lawn"), 1.4, { y: 40 }, 0.8);
    appear(P("couple"), 1.6, { y: 24 }, 0.9);
    // the stone gateways at the edges, one and then the other
    appear(P("wall-l"), 2.35, { x: -105 });
    appear(P("wall-r"), 2.8, { x: 105 });
    // the urns of flowers and the branch overhead
    appear(P("urn-l"), 3.35, { y: 60 }, 0.7);
    appear(P("urn-r"), 3.5, { y: 60 }, 0.7);
    appear(P("leaves"), 3.65, { x: -40, y: -40 }, 0.8);
    // the words, and the way back to the top
    tl.fromTo(q(".ty-words > *"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.16, ease: "power2.out" }, 4.1)
      .fromTo(q(".ty-top-btn"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 4.7);

    const st = ScrollTrigger.create({ trigger: q(".ty-stage")[0], start: "top 70%", once: true, onEnter: () => tl.play() });
    return () => { tl.kill(); st.kill(); };
  });

  const img = (cls: string, src: string, style: React.CSSProperties, k?: number, key?: string) => (
    <img key={key} className={`ty-p ${cls}`} src={`${C}${src}.webp`} alt="" loading="lazy" decoding="async" draggable={false} style={style} data-k={k} />
  );

  return (
    <section ref={ref} id="thank-you" className="ty" aria-labelledby="ty-title">
      <div className="ty-stage" role="img" aria-label={`${bride.name} and ${groom.name} greeting their guests with joined hands, on the path of a cypress avenue in a Tuscan garden, between two stone gateways, with the hills beyond`}>
        {img("ty-p--hills", "hills", {})}
        {img("ty-p--avenue", "avenue", { ...place(L.avenue), zIndex: 2 })}
        {repeats.map((r) => img(`ty-p--row ty-p--row-${r.side}`, r.src, r.style, r.k, r.key))}
        {img("ty-p--lawn", "lawn-wide", { ...place(L["lawn-wide"]), zIndex: 10 })}
        {img("ty-p--couple", "couple", { ...place(L.couple), zIndex: 12 })}
        {img("ty-p--wall-l", "wall-l", { ...place(L["wall-l"], "l"), zIndex: 20 })}
        {img("ty-p--wall-r", "wall-r", { ...place(L["wall-r"], "r"), zIndex: 20 })}
        {/* (the photo cuts the left urn in half: it is the right one, mirrored, standing opposite) */}
        {img("ty-p--urn-l", "urn-r", { ...place({ ...L["urn-r"], x: 1 - L["urn-r"].x - L["urn-r"].w }), zIndex: 22, scale: "-1 1" })}
        {img("ty-p--urn-r", "urn-r", { ...place(L["urn-r"]), zIndex: 22 })}
        {img("ty-p--leaves", "leaves", { ...place(L.leaves, "l"), zIndex: 23 })}

        <div className="ty-words">
          <h2 id="ty-title" className="ty-title">{t.title}</h2>
          <p className="ty-line">{t.line}</p>
          <p className="ty-date" aria-label={`${weekday}, ${Number(d)} ${month} ${y}, ${wedding.destination.label}`}>
            <span className="ty-date-num">{d} · {m} · {y}</span>
            <span className="ty-date-place">{weekday} · {wedding.destination.label}</span>
          </p>
        </div>
        <a className="ty-top-btn" href="#top">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12.5V3.5M3.8 7.6 8 3.4l4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Return to top
        </a>
      </div>
    </section>
  );
}
