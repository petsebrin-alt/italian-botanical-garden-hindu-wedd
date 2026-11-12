"use client";

import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import villa from "../../public/assets/villa/villa.json";
import "./thank-you.css";

const V = "/assets/villa/";
type Box = { x: number; y: number; w: number; h: number };
const L = villa.layers as unknown as Record<string, Box>;
/** The scene's pieces, back to front (tools/build_villa.py). */
const PIECES = ["back", "row-l", "row-r", "lawn", "gate-l", "gate-r", "couple", "front-l", "front-r"] as const;

/**
 * S15 · Thank you: the last screen of the invitation, edge to edge, and nothing else. The Tuscan
 * garden of Villa Cetinale is set together across the whole width by itself, once, as soon as it
 * comes into view (like a film, not tied to the scroll): each piece appears whole and solid, never
 * faded in, moves straight into its place and stays. The sky and the hills with the hermitage at
 * the avenue's end; the two rows of cypresses; the grass path between them; the couple, standing on
 * the path greeting the guests with joined hands; the two brick gateways, one and then the other;
 * and the trees in front. Then "Thank You", the last line and the date on the sky, and a button back
 * to the top on the lawn. Every piece is the photograph's own (when all have arrived it is the
 * photograph, whole, with the couple on the path). With reduced motion the finished scene stands.
 */
export default function ThankYou() {
  const { bride, groom } = wedding.couple;
  const t = wedding.thankYou;
  const date = new Date(`${wedding.date}T12:00:00Z`);
  const [y, m, d] = wedding.date.split("-");
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(date);

  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const P = (c: string) => q(`.ty-p--${c}`)[0];
    gsap.set(q(".ty-p, .ty-words > *, .ty-top-btn"), { autoAlpha: 0 });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    /** A piece appears at `at`, `from` (percent of its own size) away, and moves into its place. */
    const appear = (el: Element, at: number, from: { x?: number; y?: number }, dur = 0.9) =>
      tl.set(el, { autoAlpha: 1 }, at)
        .fromTo(el, { xPercent: from.x ?? 0, yPercent: from.y ?? 0 }, { xPercent: 0, yPercent: 0, duration: dur, immediateRender: false }, at);

    // the sky and the hills, with the hermitage at the avenue's end
    appear(P("back"), 0, { y: 14 }, 1);
    // the two rows of cypresses, one and then the other
    appear(P("row-l"), 0.75, { y: 40 });
    appear(P("row-r"), 1.05, { y: 40 });
    // the grass path between them
    appear(P("lawn"), 1.55, { y: 30 });
    // the couple, standing on the path
    appear(P("couple"), 2.2, { y: 22 });
    // the gateways, from either side, one and then the other
    appear(P("gate-l"), 2.9, { x: -110 });
    appear(P("gate-r"), 3.35, { x: 110 });
    // the trees in front
    appear(P("front-l"), 3.85, { y: 60 }, 0.8);
    appear(P("front-r"), 3.95, { y: 40 }, 0.9);
    // the words, and the way back to the top
    tl.fromTo(q(".ty-words > *"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.16, ease: "power2.out" }, 4.4)
      .fromTo(q(".ty-top-btn"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 5);

    const st = ScrollTrigger.create({ trigger: q(".ty-stage")[0], start: "top 75%", once: true, onEnter: () => tl.play() });
    return () => { tl.kill(); st.kill(); };
  });

  return (
    <section ref={ref} id="thank-you" className="ty" aria-labelledby="ty-title">
      <div className="ty-stage">
        <div className="ty-scene" role="img" aria-label={`${bride.name} and ${groom.name} greeting their guests with joined hands, on the grass path of a cypress avenue between two brick gateways with statues, in a Tuscan garden, with the hermitage on the hill beyond`}>
          {PIECES.map((p) => {
            const b = L[p];
            return (
              <img
                key={p}
                className={`ty-p ty-p--${p}`}
                src={`${V}${p}.webp`}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
              />
            );
          })}
        </div>

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
