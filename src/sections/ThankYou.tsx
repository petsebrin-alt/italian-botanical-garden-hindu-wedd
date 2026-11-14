"use client";

import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import villa from "../../public/assets/villa/villa.json";
import roses from "../../public/assets/villa/roses/roses.json";
import "./thank-you.css";

const V = "/assets/villa/";
type Box = { x: number; y: number; w: number; h: number };
const L = villa.layers as unknown as Record<string, Box>;
/** The scene's pieces, back to front (tools/build_villa.py). */
const PIECES = ["back", "row-l", "row-r", "lawn", "gate-l", "gate-r", "front-l", "front-r"] as const;


/* ------------------------------------------------------------------ the roses (tools/build_roses.py)
 * Each plant is its base (the plant with its roses still closed, in green bud) and its roses,
 * every one a sprite of its own atlas that opens over its bud. Places are in the photograph's own
 * pixels (1000 x 1333). */
type Plant = (typeof roses)["bush"];
type Sprite = Plant["roses"][number];
const PW = villa.w, PH = villa.h;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
/** The plants: a bush at the foot of each gateway, and the garland along the foot of the section,
 *  edge to edge (two lengths of it, the second turned round). */
const PLANTS: { key: string; kind: "bush" | "garland"; x: number; y: number; w: number; flip?: boolean }[] = [
  { key: "bush-l", kind: "bush", x: 18, y: 0, w: 300 },
  { key: "bush-r", kind: "bush", x: 640, y: 0, w: 300, flip: true },
  { key: "garland-1", kind: "garland", x: -45, y: 0, w: 570 },
  { key: "garland-2", kind: "garland", x: 470, y: 0, w: 590, flip: true },
];
/** Where each plant stands: its foot (photo px) — the bushes on the gateways' feet, the garland
 *  hanging a little below the section's edge. */
const FOOT: Record<string, number> = { "bush-l": 1088, "bush-r": 1046, "garland-1": 1352, "garland-2": 1356 };
/** A rose: its sprite from the atlas, filling its box. */
function rose(kind: "bush" | "garland", r: Sprite, white: boolean, style: React.CSSProperties, key: string) {
  const at = roses[kind].atlas;
  const [ax, ay, aw, ah] = r.a;
  return (
    <span
      key={key}
      className="ty-rose"
      style={{
        ...style,
        backgroundImage: `url(${V}roses/${kind}-roses${white ? "-white" : ""}.webp)`,
        backgroundSize: `${(at.w / aw) * 100}% ${(at.h / ah) * 100}%`,
        backgroundPosition: `${at.w === aw ? 0 : (ax / (at.w - aw)) * 100}% ${at.h === ah ? 0 : (ay / (at.h - ah)) * 100}%`,
      }}
    />
  );
}

/**
 * S15 · Thank you: the last screen of the invitation, edge to edge, and nothing else. The Tuscan
 * garden of Villa Cetinale is set together across the whole width by itself, once, as soon as it
 * comes into view (like a film, not tied to the scroll): each piece appears whole and solid, never
 * faded in, moves straight into its place and stays. The sky and the hills with the hermitage at
 * the avenue's end; the two rows of cypresses; the grass path between them; the couple's photograph in a
 * gold-framed arch, standing on the path; the two brick gateways, one and then the other;
 * and the trees in front. Then "Thank You", the last line and the date on the sky, and a button back
 * to the top on the lawn. Every piece is the photograph's own (when all have arrived it is the
 * photograph, whole, with the couple's photograph on the path). With reduced motion the finished scene stands.
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
    gsap.set(q(".ty-p, .ty-frame, .ty-plant, .ty-words > *, .ty-top-btn"), { autoAlpha: 0 });

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
    // the couple's photograph, in its frame on the path
    appear(q(".ty-frame")[0], 2.2, { y: 22 });
    // the gateways, from either side, one and then the other
    appear(P("gate-l"), 2.9, { x: -110 });
    appear(P("gate-r"), 3.35, { x: 110 });
    // the trees in front
    appear(P("front-l"), 3.85, { y: 60 }, 0.8);
    appear(P("front-r"), 3.95, { y: 40 }, 0.9);
    // the rose bushes at the gateways' feet and the garland along the foot, still in bud
    appear(q(".ty-plant--bush-l")[0], 4.35, { y: 35 }, 0.9);
    appear(q(".ty-plant--bush-r")[0], 4.5, { y: 35 }, 0.9);
    appear(q(".ty-plant--garland-1")[0], 4.65, { y: 70 }, 0.9);
    appear(q(".ty-plant--garland-2")[0], 4.75, { y: 70 }, 0.9);
    // the words
    tl.fromTo(q(".ty-words > *"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.16, ease: "power2.out" }, 5.0);
    // and then, slowly, every rose opens: from a deep-pink bud, turning as its petals unfold
    const buds = q(".ty-rose") as HTMLElement[];
    gsap.set(buds, { autoAlpha: 0 });
    buds.forEach((b, i) => {
      const at = 5.5 + ((i * 0.6180339) % 1) * 3.2;
      const turn = (i % 2 ? 1 : -1) * (28 + ((i * 37) % 30));
      tl.set(b, { autoAlpha: 1 }, at)
        .fromTo(b, { scale: 0.22, rotation: turn, filter: "brightness(0.72) saturate(1.5)" },
          { scale: 1, rotation: 0, filter: "brightness(1) saturate(1)", duration: 2.6, ease: "power2.out", immediateRender: false }, at);
    });
    tl.fromTo(q(".ty-top-btn"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 6.2);

    const st = ScrollTrigger.create({ trigger: q(".ty-stage")[0], start: "top 75%", once: true, onEnter: () => tl.play() });
    return () => { tl.kill(); st.kill(); };
  });

  return (
    <section ref={ref} id="thank-you" className="ty" aria-labelledby="ty-title">
      <div className="ty-stage">
        <div className="ty-scene" role="img" aria-label={`A photograph of ${bride.name} and ${groom.name} holding hands, in a gold-framed arch on the grass path of a cypress avenue between two brick gateways with statues, in a Tuscan garden, with the hermitage on the hill beyond`}>
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

          {/* the couple's photograph, in a gold-framed arch standing on the path */}
          <figure className="ty-frame">
            <div className="ty-frame-photo">
              <img src={t.photo.src} alt={t.photo.alt} loading="lazy" decoding="async" draggable={false} style={{ objectPosition: t.photo.focus }} />
            </div>
          </figure>

          {/* the roses: the bushes at the gateways and the garland along the foot */}
          {PLANTS.map((pl) => {
            const pdata = roses[pl.kind];
            const h = (pl.w * pdata.h) / pdata.w;
            const foot = FOOT[pl.key];
            return (
              <div
                key={pl.key}
                className={`ty-plant ty-plant--${pl.key} ty-plant--${pl.kind}${pl.flip ? " is-flipped" : ""}`}
                style={{ left: pct(pl.x, PW), top: pct(foot - h, PH), width: pct(pl.w, PW), height: pct(h, PH) }}
              >
                <img className="ty-plant-base" src={`${V}roses/${pl.kind}-base.webp`} alt="" loading="lazy" decoding="async" draggable={false} />
                {pdata.roses.map((r, i) =>
                  rose(pl.kind, r, pl.kind === "garland" && i % 4 === 2, { left: `${r.p[0] * 100}%`, top: `${r.p[1] * 100}%`, width: `${r.p[2] * 100}%`, height: `${r.p[3] * 100}%` }, `${pl.key}-${i}`))}
              </div>
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
