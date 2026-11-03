"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wedding } from "@/content/wedding";
import { gsap, scrub, tokens } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { useScene } from "@/lib/scene";
import Pic from "@/components/Pic";
import "./gallery.css";

const CATS = ["All", "Portraits", "Pre-wedding", "Moments", "Destination"] as const;

/** S11 · Gallery: a pinned horizontal reel on desktop, a swipe reel on phones, and a lightbox. */
export default function Gallery() {
  const all = wedding.gallery;
  const { tier } = useMotion();
  const [index, setIndex] = useState<number | null>(null);
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const lightbox = useRef<HTMLDialogElement>(null);
  const grid = useRef<HTMLDialogElement>(null);
  const from = useRef<HTMLElement | null>(null);

  const ref = useScene<HTMLElement>((root, q, t) => {
    if (t === "C" || window.innerWidth < 1024) return;
    const track = q(".gal-track")[0] as HTMLElement;
    const distance = () => track.scrollWidth - window.innerWidth;
    const reel = gsap.to(track, {
      x: () => -distance(), ease: "none",
      // the reel may travel further than the scroll: the pin never exceeds 2.5 viewports (PRD §14.3)
      scrollTrigger: { trigger: q(".gal-pin")[0], start: "top top", end: () => `+=${Math.min(distance(), 2.5 * window.innerHeight)}`, pin: true, scrub: scrub(), invalidateOnRefresh: true, anticipatePin: 1 },
    });
    (q(".gal-frame") as HTMLElement[]).forEach((frame) => {
      const img = frame.querySelector("img");
      gsap.fromTo(img, { xPercent: -7 }, {
        xPercent: 7, ease: "none",
        scrollTrigger: { trigger: frame, containerAnimation: reel, start: "left right", end: "right left", scrub: true },
      });
      gsap.fromTo(frame, { clipPath: "inset(0% 100% 0% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: tokens.ease.cinematic,
        scrollTrigger: { trigger: frame, containerAnimation: reel, start: "left 92%", once: true },
      });
    });
  });

  const open = useCallback((i: number, el: HTMLElement) => {
    from.current = el;
    setIndex(i);
    requestAnimationFrame(() => {
      const dlg = lightbox.current!;
      if (!dlg.open) dlg.showModal();
      const img = dlg.querySelector(".lb-img img") as HTMLElement;
      if (tier === "C" || !img) return;
      const a = el.getBoundingClientRect(), b = img.getBoundingClientRect();
      gsap.fromTo(img,
        { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2), scale: a.width / b.width },
        { x: 0, y: 0, scale: 1, duration: 0.6, ease: tokens.ease.cinematic });
    });
  }, [tier]);

  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + all.length) % all.length)), [all.length]);

  useEffect(() => {
    const dlg = lightbox.current;
    if (!dlg || index === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); };
    dlg.addEventListener("keydown", onKey);
    return () => dlg.removeEventListener("keydown", onKey);
  }, [index, step]);

  // swipe in the lightbox
  const touch = useRef(0);

  if (all.length < 3) return null;
  const shown = all.map((g, i) => ({ g, i })).filter(({ g }) => cat === "All" || g.category === cat);
  const current = index === null ? null : all[index];

  return (
    <section ref={ref} id="gallery" className="gallery paper" aria-labelledby="gallery-title">
      <div className="gal-pin">
        <header className="container gal-head">
          <div>
            <p className="eyebrow" data-reveal="fade">Moments in bloom</p>
            <h2 id="gallery-title" className="script" data-reveal="up">Gallery</h2>
          </div>
          <button className="btn btn--ghost" type="button" onClick={() => grid.current?.showModal()}>View all photos</button>
        </header>
        <div className="gal-viewport">
          <ul className="gal-track" role="list">
            {all.map((g, i) => (
              <li key={g.src} className={`gal-item gal-item--${g.shape ?? "square"}`}>
                <button type="button" className={`gal-frame ${g.shape === "arch" || g.shape === "tall" ? "arch" : ""}`} onClick={(e) => open(i, e.currentTarget)} aria-label={`Open photo: ${g.alt}`}>
                  <Pic src={g.src} alt={g.alt} />
                </button>
                {g.caption && <p className="gal-caption caption">{g.caption}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dialog ref={grid} className="gal-grid-dialog" aria-label="All photos">
        <div className="gal-grid-head container">
          <div className="gal-chips" role="group" aria-label="Filter photos">
            {CATS.map((c) => (
              <button key={c} type="button" className={`chip${cat === c ? " is-on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <button className="ev-close" type="button" onClick={() => grid.current?.close()} aria-label="Close">×</button>
        </div>
        <ul className="gal-grid container" role="list">
          {shown.map(({ g, i }) => (
            <li key={g.src}>
              <button type="button" className="gal-grid-item" onClick={(e) => open(i, e.currentTarget)} aria-label={`Open photo: ${g.alt}`}>
                <Pic src={g.src} alt={g.alt} />
              </button>
            </li>
          ))}
        </ul>
      </dialog>

      <dialog
        ref={lightbox}
        className="lb"
        aria-label="Photo viewer"
        onClose={() => { setIndex(null); from.current?.focus(); }}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }}
      >
        {current && (
          <>
            <figure className="lb-figure">
              <Pic key={current.src} src={current.src} alt={current.alt} className="lb-img" eager />
              <figcaption className="lb-caption">
                <span className="caption">{(index ?? 0) + 1} / {all.length}</span>
                {current.caption && <span className="lb-cap-text">{current.caption}</span>}
              </figcaption>
            </figure>
            <button className="lb-nav lb-nav--prev" type="button" onClick={() => step(-1)} aria-label="Previous photo">‹</button>
            <button className="lb-nav lb-nav--next" type="button" onClick={() => step(1)} aria-label="Next photo">›</button>
            <button className="ev-close lb-close" type="button" onClick={() => lightbox.current?.close()} aria-label="Close">×</button>
          </>
        )}
      </dialog>
    </section>
  );
}
