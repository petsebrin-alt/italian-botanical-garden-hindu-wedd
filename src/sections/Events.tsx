"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { publishedEvents, wedding, type WeddingEvent } from "@/content/wedding";
import { clock, shortDate, weekdayDate } from "@/lib/dates";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import AddToCalendar from "@/components/AddToCalendar";
import EventIcon from "@/components/EventIcon";
import { Sprite } from "@/components/Pic";
import "./events.css";

const PER_ROW = 5;

/** Serpentine placement: rows of up to five, every other row runs right-to-left. */
function place(i: number, n: number) {
  const row = Math.floor(i / PER_ROW);
  const inRow = Math.min(PER_ROW, n - row * PER_ROW);
  const cols = Math.min(PER_ROW, n);
  const offset = Math.floor((cols - inRow) / 2);
  const k = i % PER_ROW;
  const col = row % 2 === 0 ? offset + k : offset + (inRow - 1 - k);
  return { row: row + 1, col: col + 1 };
}

/** Curved connectors through the medallion centres: N nodes always give N − 1 curves. */
function connectorPath(pts: { x: number; y: number; row: number }[], vertical: boolean, cx: number) {
  if (pts.length < 2) return { d: "", stops: [0] };
  const segs: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (vertical) {
      const dy = b.y - a.y;
      segs.push(`C ${a.x} ${a.y + dy * 0.55}, ${b.x} ${b.y - dy * 0.55}, ${b.x} ${b.y}`);
    } else if (a.row === b.row) {
      const amp = (i % 2 ? 1 : -1) * 30;
      const dx = b.x - a.x;
      segs.push(`C ${a.x + dx / 3} ${a.y + amp}, ${b.x - dx / 3} ${b.y + amp}, ${b.x} ${b.y}`);
    } else {
      const side = a.x > cx ? 1 : -1;
      segs.push(`C ${a.x + side * 110} ${a.y}, ${b.x + side * 110} ${b.y}, ${b.x} ${b.y}`);
    }
  }
  const d = `M ${pts[0].x} ${pts[0].y} ` + segs.join(" ");
  // cumulative length at each node, so a node lights up when the line reaches it
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const stops = [0];
  let acc = `M ${pts[0].x} ${pts[0].y}`;
  segs.forEach((s) => {
    acc += " " + s;
    probe.setAttribute("d", acc);
    stops.push(probe.getTotalLength());
  });
  const total = stops[stops.length - 1] || 1;
  return { d, stops: stops.map((s) => s / total) };
}

export default function Events() {
  const events = publishedEvents();
  const [geo, setGeo] = useState<{ d: string; w: number; h: number; stops: number[] }>({ d: "", w: 0, h: 0, stops: [] });
  const [open, setOpen] = useState<WeddingEvent | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const vertical = window.innerWidth < 768;
    // layout offsets ignore the pop-in transforms, so curves always meet the medallion centres
    const offsetIn = (el: HTMLElement) => {
      let x = 0, y = 0, n: HTMLElement | null = el;
      while (n && n !== track) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return { x, y };
    };
    const pts = Array.from(track.querySelectorAll<HTMLElement>(".ev-medal")).map((m) => {
      const o = offsetIn(m);
      return { x: o.x + m.offsetWidth / 2, y: o.y + m.offsetHeight / 2, row: Number(m.dataset.row) };
    });
    const { d, stops } = connectorPath(pts, vertical, track.clientWidth / 2);
    setGeo((g) => (g.d === d ? g : { d, w: track.clientWidth, h: track.clientHeight, stops }));
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (trackRef.current) ro.observe(trackRef.current);
    document.fonts.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const ref = useScene<HTMLElement>((root, q, tier) => {
    const nodes = q(".ev-node") as HTMLElement[];
    if (tier === "C" || !geo.d) {
      nodes.forEach((n) => n.classList.add("is-on"));
      return;
    }
    const line = q(".ev-line")[0];
    const beads = q(".ev-beads")[0];
    gsap.set([line, beads], { drawSVG: "0%" });
    const st = ScrollTrigger.create({
      trigger: trackRef.current, start: "top 72%", end: "bottom 62%", scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.set(line, { drawSVG: `0% ${p * 100}%` });
        gsap.set(beads, { drawSVG: `0% ${Math.max(0, p - 0.04) * 100}%` });
        nodes.forEach((n, i) => n.classList.toggle("is-on", p >= (geo.stops[i] ?? 0) - 0.015));
      },
    });
    // the first node is lit as soon as the track arrives
    ScrollTrigger.create({ trigger: trackRef.current, start: "top 80%", onEnter: () => nodes[0]?.classList.add("is-on") });
    return () => st.kill();
  }, [geo.d]);

  const show = (e: WeddingEvent) => { setOpen(e); requestAnimationFrame(() => dialogRef.current?.showModal()); };
  const dress = open ? wedding.dressCode.find((d) => d.eventId === open.id) : undefined;

  if (!events.length) return null; // no published events: the section disappears entirely

  return (
    <section ref={ref} id="events" className="events section paper" aria-labelledby="events-title" data-stage>
      <Sprite name="strand-1" className="hang hang--l sway" depth={-0.18} />
      <Sprite name="strand-2" className="hang hang--r sway sway--slow" depth={-0.22} />
      <Sprite name="cypress-l" className="events-cypress events-cypress--l" depth={-0.12} />
      <Sprite name="cypress-r" className="events-cypress events-cypress--r" depth={-0.12} />

      <header className="container center events-head">
        <p className="eyebrow" data-reveal="fade">Join us for</p>
        <h2 id="events-title" className="script" data-reveal="up">Wedding Celebrations</h2>
        <p className="body-s events-sub" data-reveal="fade">All times are Italy time (CEST). Tap a celebration for details.</p>
      </header>

      <div className="container">
        <div ref={trackRef} className="ev-track" style={{ "--cols": Math.min(PER_ROW, events.length) } as React.CSSProperties}>
          {geo.d && (
            <svg className="ev-svg" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
              <path className="ev-line" d={geo.d} />
              <path className="ev-beads" d={geo.d} />
            </svg>
          )}
          <ol className="ev-list">
            {events.map((e, i) => {
              const { row, col } = place(i, events.length);
              return (
                <li key={e.id} className={`ev-node ${i % 2 ? "ev-node--odd" : ""}`} style={{ gridRow: row, gridColumn: col }}>
                  <button type="button" className="ev-button" onClick={() => show(e)} aria-haspopup="dialog">
                    <span className="ev-medal arch" data-row={row}>
                      <EventIcon type={e.type} />
                    </span>
                    <span className="ev-name h3">{e.name}</span>
                    <span className="ev-when caption">{shortDate(e.date!)} · {clock(e.start!)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <dialog ref={dialogRef} className="ev-dialog" onClose={() => setOpen(null)} aria-labelledby="ev-dialog-title">
        {open && (
          <div className="ev-sheet">
            <button className="ev-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close">×</button>
            <span className="ev-sheet-icon"><EventIcon type={open.type} size={52} /></span>
            <h3 id="ev-dialog-title" className="script script--m">{open.name}</h3>
            <p className="eyebrow">{weekdayDate(open.date!)}</p>
            <p className="ev-sheet-time date-display">{clock(open.start!)}{open.end ? ` – ${clock(open.end)}` : ""}</p>
            <p className="ev-sheet-area body-s">{open.area?.startsWith("[") ? "Venue details to be announced" : open.area}</p>
            {open.description && <p className="ev-sheet-desc">{open.description}</p>}
            {dress && (
              <a className="ev-chip" href="#dress-code" onClick={() => dialogRef.current?.close()}>
                <span className="ev-chip-dots">{dress.palette.slice(0, 3).map((p) => <i key={p.hex} style={{ background: p.hex }} />)}</span>
                Dress code: {dress.theme}
              </a>
            )}
            <AddToCalendar event={open} variant="primary" />
          </div>
        )}
      </dialog>
    </section>
  );
}
