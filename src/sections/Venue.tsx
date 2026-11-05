"use client";

import { useState } from "react";
import { wedding } from "@/content/wedding";
import { useScene } from "@/lib/scene";
import Pic, { Sprite } from "@/components/Pic";
import "./venue.css";

/** S12 · Venue & accommodation. Never invents an address: shows "to be announced" until one is set. */
export default function Venue() {
  const v = wedding.venue;
  const ref = useScene<HTMLElement>();
  const [mapOn, setMapOn] = useState(false);
  const hasPlace = Boolean(v.address || (v.lat !== undefined && v.lng !== undefined));
  const query = v.lat !== undefined && v.lng !== undefined ? `${v.lat},${v.lng}` : `${v.name} ${v.address}`;

  return (
    <section ref={ref} id="venue" className="venue section paper" aria-labelledby="venue-title" data-stage>
      <Sprite name="cypress-r" className="venue-cypress" depth={-0.15} />
      <header className="container center venue-head">
        <p className="eyebrow" data-reveal="fade">Travel &amp; stay</p>
        <h2 id="venue-title" className="script" data-reveal="up">The Venue</h2>
      </header>

      <div className="container venue-grid">
        <div className="venue-main">
          <figure className="venue-figure arch arch--frame" data-reveal="mask">
            <Pic src="/assets/img/venue-villa" alt="A Tuscan villa courtyard with garden tables, a placeholder until the venue is confirmed" inner />
          </figure>
          <article className="venue-card card" data-reveal="up">
            <p className="eyebrow">{wedding.destination.label}</p>
            <h3 className="h3">{v.name || "Venue to be announced"}</h3>
            <p className="body-s">{v.address || v.note}</p>
            {hasPlace && (
              <div className="venue-actions">
                <a className="btn btn--primary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">Google Maps</a>
                <a className="btn btn--ghost" href={`https://maps.apple.com/?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">Apple Maps</a>
              </div>
            )}
            {hasPlace && (mapOn ? (
              <iframe className="venue-map" title="Map of the venue" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`} />
            ) : (
              <button type="button" className="venue-map venue-map--facade" onClick={() => setMapOn(true)}>
                <span className="caption">Load the map</span>
              </button>
            ))}
          </article>
        </div>

        <div className="venue-info" data-reveal="stagger">
          {v.travel.map((t) => (
            <article key={t.title} className="venue-block" data-item>
              <h3 className="h3">{t.title}</h3>
              <p className="body-s">{t.text}</p>
            </article>
          ))}
          {v.hotels.length > 0 && (
            <article className="venue-block" data-item>
              <h3 className="h3">Where to stay</h3>
              <ul className="venue-hotels" role="list">
                {v.hotels.map((h) => (
                  <li key={h.name} className="card venue-hotel">
                    <strong>{h.name}</strong>
                    <span className="body-s">{h.distance} · {h.price}</span>
                    {h.code && <span className="caption">Group code {h.code}</span>}
                    {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer">Book</a>}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
