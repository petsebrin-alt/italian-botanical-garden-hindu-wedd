"use client";

import { wedding } from "@/content/wedding";
import { useScene } from "@/lib/scene";
import Pic, { Sprite } from "@/components/Pic";
import "./venue.css";

/** Placeholder notes in [square brackets] stay in the content file, not on the page. */
const clean = (t: string) => t.replace(/\s*\[[^\]]*\]\s*/g, " ").replace(/\s+/g, " ").trim();

const ICONS: Record<string, React.ReactNode> = {
  "Flying in": <path d="M3 13.5 21 7l-2.5 4.5-6 1.5-3.5 5H7l1.5-4.2L4.5 15Z" />,
  "Getting around": <><path d="M4 15v-3.5L6.5 7h11l2.5 4.5V15" /><path d="M3 15h18v2.5H3z" /><circle cx="7.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" /></>,
  "Travel essentials": <><rect x="6" y="3.5" width="12" height="17" rx="2" /><circle cx="12" cy="10" r="2.6" /><path d="M9 15.5h6" /></>,
  Ferragosto: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
};

/**
 * Venue · travel and stay: the villa in a wide arch with its name and a Location button, and the
 * travel notes as small tiles. Never invents an address: the map opens on the region until the
 * villa's name and address are set in src/content/wedding.ts.
 */
export default function Venue() {
  const v = wedding.venue;
  const ref = useScene<HTMLElement>();
  const query = [v.name, v.address].filter(Boolean).join(", ") || v.mapsQuery || wedding.destination.label;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <section ref={ref} id="venue" className="venue section paper" aria-labelledby="venue-title" data-stage>
      <Sprite name="strand-2" className="hang hang--l sway" depth={-0.18} />
      <Sprite name="strand-3" className="hang hang--r sway sway--slow" depth={-0.22} />
      <header className="container center venue-head">
        <p className="eyebrow" data-reveal="fade">Travel &amp; stay</p>
        <h2 id="venue-title" className="script" data-reveal="up">The Venue</h2>
      </header>

      <div className="container">
        <div className="venue-hero">
          <figure className="venue-figure" data-reveal="mask">
            <Pic src="/assets/img/venue-villa" alt="A Tuscan villa courtyard with garden tables under the trees" inner />
          </figure>
          <article className="venue-card" data-reveal="up">
            <p className="eyebrow">{wedding.destination.label}</p>
            <h3 className="venue-name names">{v.name || "Our Tuscan Villa"}</h3>
            <p className="body-s venue-addr">{v.address || "The villa's name and address will be shared here soon."}</p>
            <div className="venue-actions">
              <a className="btn btn--primary venue-map" href={maps} target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.6" />
                </svg>
                Location
              </a>
              <a className="btn btn--ghost" href="#rsvp">RSVP</a>
            </div>
          </article>
        </div>

        <div className="venue-tips" data-reveal="stagger">
          {v.travel.map((t) => (
            <article key={t.title} className="venue-tip" data-item>
              <span className="venue-tip-icon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
                  {ICONS[t.title] ?? <circle cx="12" cy="12" r="6" />}
                </svg>
              </span>
              <h4 className="venue-tip-title">{t.title}</h4>
              <p className="body-s">{clean(t.text)}</p>
            </article>
          ))}
        </div>

        {v.hotels.length > 0 && (
          <div className="venue-hotels" data-reveal="stagger">
            {v.hotels.map((h) => (
              <article key={h.name} className="venue-tip" data-item>
                <h4 className="venue-tip-title">{h.name}</h4>
                <p className="body-s">{h.distance} · {h.price}{h.code ? ` · Group code ${h.code}` : ""}</p>
                {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer">Book</a>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
