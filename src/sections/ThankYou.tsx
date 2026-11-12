"use client";

import { publishedEvents, wedding } from "@/content/wedding";
import { gsap, ScrollTrigger, tokens } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { useScene } from "@/lib/scene";
import AddToCalendar from "@/components/AddToCalendar";
import { Monogram } from "@/components/Ornaments";
import { Sprite } from "@/components/Pic";
import closing from "../../public/assets/closing/closing.json";
import "./thank-you.css";

const C = "/assets/closing/";
/** The closing film's pieces, back to front (tools/build_closing.py). */
const PIECES = ["garden", "wall-l", "wall-r", "lawn", "couple", "urn-l", "urn-r", "leaves"] as const;
type Piece = (typeof PIECES)[number];
const layers = closing.layers as Record<Piece, { x: number; y: number; w: number; h: number }>;

/** A small lotus of three petals, between the parts of the thank-you. */
function Lotus() {
  return (
    <svg className="ty-lotus" viewBox="0 0 64 24" aria-hidden="true">
      <circle cx="6" cy="16" r="1.8" />
      <circle cx="58" cy="16" r="1.8" />
      <path className="ty-lotus-side" d="M32 21C24 21 18 15 15 9c6 0 13 4 17 12Z" />
      <path className="ty-lotus-side" d="M32 21c8 0 14-6 17-12-6 0-13 4-17 12Z" />
      <path className="ty-lotus-mid" d="M32 21c-4-5-4-12 0-18 4 6 4 13 0 18Z" />
    </svg>
  );
}

/**
 * S15 · Thank you. First the thank-you itself: the date, a button to add it to the calendar and
 * one to share the invitation, and a note from the couple. Then the closing film, edge to edge:
 * a Tuscan landscape (sky, hills, cypresses, lawn) fills the screen from the first moment, and the
 * couple's garden is set into it by itself, once, as soon as it comes into view (like a film, not
 * tied to the scroll). Each piece appears whole and solid, never faded in, moves straight into
 * its place and stays: the cypress avenue with the hills and the villa beyond; the stone gateways,
 * from either side; the couple on their lawn, greeting the guests with joined hands; the urns of
 * flowers and the branch overhead; the cypresses at the sides and the hydrangeas in front; and the
 * last words. Every piece is the photograph's own, so when all have arrived it is the photograph,
 * whole. With reduced motion the finished picture simply stands.
 */
export default function ThankYou() {
  const { bride, groom } = wedding.couple;
  const t = wedding.thankYou;
  const { paused, togglePaused } = useMotion();
  const ceremony = publishedEvents().find((e) => e.type === "ceremony") ?? publishedEvents()[0];
  const date = new Date(`${wedding.date}T12:00:00Z`);
  const [y, m, d] = wedding.date.split("-");
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);

  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    const L = (p: Piece) => q(`.ty-l--${p}`)[0];
    gsap.set(q(".ty-l, .ty-side, .ty-film-thanks > *"), { autoAlpha: 0 });

    // the film plays by itself, once, the moment it comes into view: each piece appears whole and
    // solid (never faded in) and moves straight into its place, one after another, and stays
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    /** A piece appears at `at`, `from` (percent of its own size) away, and moves into its place. */
    const appear = (el: Element | Element[], at: number, from: { x?: number; y?: number }, dur = 0.85) =>
      tl.set(el, { autoAlpha: 1 }, at)
        .fromTo(el, { xPercent: from.x ?? 0, yPercent: from.y ?? 0 }, { xPercent: 0, yPercent: 0, duration: dur, immediateRender: false }, at);

    // the cypress avenue with the hills and the villa beyond
    appear(L("garden"), 0, { y: 22 }, 0.95);
    // the stone gateways, from either side
    appear(L("wall-l"), 0.8, { x: -105 });
    appear(L("wall-r"), 1.25, { x: 105 });
    // the couple, on their lawn
    appear(L("lawn"), 1.9, { y: 40 }, 0.8);
    appear(L("couple"), 2.05, { y: 24 }, 0.9);
    // the urns of flowers and the branch overhead
    appear(L("urn-l"), 2.85, { y: 60 }, 0.7);
    appear(L("urn-r"), 3.0, { y: 60 }, 0.7);
    appear(L("leaves"), 3.15, { x: -40, y: -40 }, 0.8);
    // the cypresses at the sides, near and far, and the hydrangeas in front
    appear(q(".ty-side--near"), 3.4, { y: 60 }, 0.85);
    appear(q(".ty-side--far"), 3.65, { y: 60 }, 0.85);
    appear(q(".ty-side--bed"), 3.95, { y: 70 }, 0.8);
    // and the last words
    tl.fromTo(q(".ty-film-thanks > *"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.18, ease: "power2.out" }, 4.5);

    const st = ScrollTrigger.create({ trigger: q(".ty-film-stage")[0], start: "top 70%", once: true, onEnter: () => tl.play() });

    gsap.from(q(".ty-mono .mono-draw"), { drawSVG: "0%", duration: 1.4, ease: tokens.ease.cinematic, scrollTrigger: { trigger: q(".ty-footer")[0], start: "top 90%", once: true } });
    return () => { tl.kill(); st.kill(); };
  });

  const invite = `You're invited: ${bride.name} & ${groom.name}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(invite)}`;
  const share = async () => {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      try { await navigator.share({ title: invite, text: invite, url }); return; } catch { /* closed */ return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${invite} ${url}`)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section ref={ref} id="thank-you" className="ty" aria-labelledby="ty-title">
      {/* the thank-you, the date, and the note from the couple */}
      <div className="ty-top paper">
        <div className="container ty-top-inner">
          <Lotus />
          <h2 id="ty-title" className="ty-title" data-reveal="up">{t.title}</h2>
          <p className="ty-sub" data-reveal="fade">{t.sub}</p>
          <p className="ty-save" data-reveal="fade">Save the date</p>
          <p className="ty-date" data-reveal="up" aria-label={`${weekday}, ${Number(d)} August ${y}`}>{d} · {m} · {y}</p>
          <p className="ty-place" data-reveal="fade">{weekday} · {wedding.destination.label}</p>
          <div className="ty-buttons" data-reveal="fade">
            {ceremony && <AddToCalendar event={ceremony} label="Add to calendar" variant="primary" />}
            <button type="button" className="btn btn--ghost ty-share" onClick={share}>Share the invitation</button>
          </div>

          <Lotus />
          <div className="ty-note" data-reveal="up">
            <p className="ty-note-eyebrow" lang={t.note.eyebrow.lang}>{t.note.eyebrow.text}</p>
            <h3 className="ty-note-title">{t.note.title}</h3>
            <p className="ty-note-dear">Dear <strong>{t.note.greeting}</strong>,</p>
            <p className="ty-note-body">{t.note.body}</p>
            <p className="ty-note-closing">{t.note.closing}</p>
            <p className="ty-note-names">{bride.name} <span>&amp;</span> {groom.name}</p>
          </div>
        </div>
      </div>

      {/* the closing film: edge to edge, the Tuscan landscape behind from the first moment */}
      <div className="ty-film">
        <div className="ty-film-stage">
          <img className="ty-backdrop" src="/assets/window/garden-ground.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" />
          <Sprite name="cypress-r" className="ty-side ty-side--tree ty-side--far ty-side--l" />
          <Sprite name="cypress-l" className="ty-side ty-side--tree ty-side--far ty-side--r" />
          <Sprite name="cypress-l" className="ty-side ty-side--tree ty-side--near ty-side--l" />
          <Sprite name="cypress-r" className="ty-side ty-side--tree ty-side--near ty-side--r" />
          <div className="ty-scene" role="img" aria-label={`${bride.name} and ${groom.name} greeting their guests with joined hands, between two stone gateways in a Tuscan garden of cypresses, with the hills beyond`}>
            {PIECES.map((p) => {
              const b = layers[p];
              return (
                <img
                  key={p}
                  className={`ty-l ty-l--${p}`}
                  src={`${C}${p}.webp`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }}
                />
              );
            })}
          </div>
          <Sprite name="bed-l" className="ty-side ty-side--bed ty-side--l" />
          <Sprite name="bed-r" className="ty-side ty-side--bed ty-side--r" />
          <div className="ty-film-thanks">
            <p className="ty-film-title" aria-hidden="true">{t.title}</p>
            <p className="ty-film-line">{t.film.line}</p>
            <p className="ty-film-names">{bride.name} &amp; {groom.name}</p>
          </div>
        </div>
      </div>

      <footer className="ty-footer paper">
        <div className="container ty-footer-inner">
          <Monogram className="ty-mono" size={96} />
          <p className="script script--m">With love, {bride.name} &amp; {groom.name}</p>
          <p className="eyebrow">{wedding.hashtag}</p>
          <div className="ty-actions">
            <a className="btn btn--gold" href={whatsapp} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
            <button className="btn btn--ghost" type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy link</button>
            <a className="btn btn--ghost" href="#top">Back to top</a>
          </div>
          <p className="ty-small body-s">
            <button type="button" className="rsvp-link" onClick={togglePaused} aria-pressed={paused}>{paused ? "Resume animations" : "Pause animations"}</button>
            {" · "}<a href="/privacy">Privacy</a>
          </p>
        </div>
      </footer>
    </section>
  );
}
