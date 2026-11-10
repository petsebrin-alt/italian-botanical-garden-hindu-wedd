"use client";

import { useRef, useState } from "react";
import { publishedEvents, wedding, type DressCode as Entry } from "@/content/wedding";
import { useScene } from "@/lib/scene";
import Pic, { Sprite } from "@/components/Pic";
import "./dress-code.css";

/** Picks forest or ivory for a label on a swatch, whichever passes 4.5:1. */
function labelOn(hex: string) {
  const c = hex.replace("#", "").match(/../g)!.map((h) => parseInt(h, 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return (L + 0.05) / (0.0492 + 0.05) >= 4.5 ? "#294535" : "#F8F4E9";
}

/** A fabric-like swatch drawn from the palette when no outfit image is uploaded. */
function fabric(p: Entry["palette"]) {
  const [a, b, c] = [p[0]?.hex, p[1]?.hex ?? p[0]?.hex, p[2]?.hex ?? p[0]?.hex];
  return {
    background: `repeating-linear-gradient(115deg, rgb(255 255 255 / 0.07) 0 2px, transparent 2px 9px),
      radial-gradient(120% 80% at 20% 10%, ${b} 0%, transparent 60%),
      radial-gradient(90% 70% at 85% 90%, ${c} 0%, transparent 65%), ${a}`,
  };
}

/** S10 · Dress code: one arched card per celebration, always in step with the event list. */
export default function DressCode() {
  const live = new Map(publishedEvents().map((e) => [e.id, e]));
  const entries = wedding.dressCode.filter((d) => live.has(d.eventId));
  const [open, setOpen] = useState<Entry | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const ref = useScene<HTMLElement>();
  if (!entries.length) return null;

  const show = (d: Entry) => { setOpen(d); requestAnimationFrame(() => dialog.current?.showModal()); };

  return (
    <section ref={ref} id="dress-code" className="dress section paper" aria-labelledby="dress-title" data-stage>
      <header className="container center dress-head">
        <p className="eyebrow" data-reveal="fade">What to wear</p>
        <h2 id="dress-title" className="script" data-reveal="up">Dress Code</h2>
        <p className="body-s dress-sub" data-reveal="fade">A colour story for every celebration. Tap a card for the full palette.</p>
      </header>

      <div className="dress-scroller" data-reveal="stagger">
        <ul className="dress-list" role="list">
          {entries.map((d) => (
            <li key={d.eventId} className="dress-item" data-item>
              <button type="button" className="dress-card" onClick={() => show(d)} aria-haspopup="dialog">
                <span className="dress-arch arch arch--frame" style={d.image ? undefined : fabric(d.palette)}>
                  {d.image && <Pic src={d.image} alt="" inner />}
                </span>
                <span className="dress-plate">
                  <span className="dress-event h3">{live.get(d.eventId)!.name}</span>
                  <span className="dress-theme">{d.theme}</span>
                  <span className="dress-dots" aria-hidden="true">
                    {d.palette.map((p) => <i key={p.hex} style={{ background: p.hex }} />)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog ref={dialog} className="dress-dialog" onClose={() => setOpen(null)} aria-labelledby="dress-dialog-title">
        {open && (
          <div className="dress-sheet">
            <button className="ev-close" type="button" onClick={() => dialog.current?.close()} aria-label="Close">×</button>
            <p className="eyebrow">{live.get(open.eventId)?.name}</p>
            <h3 id="dress-dialog-title" className="script script--m">{open.theme}</h3>
            <ul className="dress-swatches" role="list">
              {open.palette.map((p) => (
                <li key={p.hex} className="dress-swatch" style={{ background: p.hex, color: labelOn(p.hex) }}>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
            <p>{open.note}</p>
            {open.avoid && <p className="dress-avoid body-s"><strong>Please avoid:</strong> {open.avoid}</p>}
          </div>
        )}
      </dialog>
    </section>
  );
}
