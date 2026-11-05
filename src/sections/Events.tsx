"use client";

import { publishedEvents, wedding } from "@/content/wedding";
import { clock, weekdayDate } from "@/lib/dates";
import { gsap, ScrollTrigger, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import AddToCalendar from "@/components/AddToCalendar";
import Pic, { Sprite } from "@/components/Pic";
import "./events.css";

/** Each celebration's photograph (tools/build_events.py), with a description for screen readers. */
const PHOTOS: Record<string, { src: string; alt: string }> = {
  haldi: { src: "/assets/img/event-haldi", alt: "The Haldi set in a villa garden: yellow drapes, marigold strings, a bowl of turmeric and lemons" },
  mehendi: { src: "/assets/img/event-mehendi", alt: "The Mehendi lounge: a carved bench with jewel cushions under bougainvillea and brass lanterns" },
  sangeet: { src: "/assets/img/event-sangeet", alt: "The Sangeet stage at night: a lit arch, purple drapes, curtains of fairy lights and a dhol" },
  ceremony: { src: "/assets/img/event-ceremony", alt: "The wedding mandap: ivory drapes and roses on a garden lawn" },
  reception: { src: "/assets/img/event-reception", alt: "The reception: round tables with pink centrepieces under string lights" },
};

/** The villa on a map: its name and address once confirmed (src/content/wedding.ts), else the region. */
const mapsUrl = () => {
  const v = wedding.venue;
  const query = [v.name, v.address].filter(Boolean).join(", ") || v.mapsQuery || wedding.destination.label;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </svg>
  );
}

/**
 * S04 · Celebrations: the love-story layout, for the five events. On wide screens an arched
 * photograph stays in place while the timeline scrolls past it, and each celebration slides its
 * own photograph in as it reaches the middle of the screen; a vine grows down the timeline and a
 * bud blooms at each event. Phones show each photograph inline.
 */
export default function Events() {
  const events = publishedEvents();

  const ref = useScene<HTMLElement>((root, q, tier) => {
    const items = q(".ev-item") as HTMLElement[];
    if (tier === "C" || items.length < 1) return;
    gsap.from(q(".ev-vine-path"), {
      drawSVG: "0%", ease: "none",
      scrollTrigger: { trigger: q(".ev-list")[0], start: "top 62%", end: "bottom 62%", scrub: true },
    });
    items.forEach((item) => {
      gsap.fromTo(item.querySelector(".ev-bud"), { scale: 0.35, rotation: -25, backgroundColor: "#A9BBA0" }, {
        scale: 1, rotation: 0, backgroundColor: "#D9A5A0", duration: 0.6, ease: "back.out(1.6)",
        scrollTrigger: { trigger: item, start: "top 58%", toggleActions: "play none none reverse" },
      });
      gsap.from(item.querySelectorAll(".ev-reveal"), {
        y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.09, ease: tokens.ease.reveal,
        scrollTrigger: { trigger: item, start: "top 78%", once: true },
      });
    });

    if (window.innerWidth < 1024) return;
    // wide screens: the arched stage changes photograph as each celebration crosses the middle
    const photos = q(".ev-photo") as HTMLElement[];
    gsap.set(photos, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(photos[0], { clipPath: "inset(0% 0% 0% 0%)" });
    let current = 0;
    const show = (i: number) => {
      if (i === current) return;
      const down = i > current;
      const incoming = photos[i], outgoing = photos[current];
      gsap.set(incoming, { zIndex: 2 });
      gsap.set(outgoing, { zIndex: 1 });
      gsap.fromTo(incoming, { clipPath: down ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", duration: 0.95, ease: tokens.ease.cinematic, overwrite: true,
      });
      gsap.fromTo(incoming.querySelector("img"), { scale: 1.14 }, { scale: 1, duration: 1.2, ease: tokens.ease.reveal });
      gsap.to(outgoing.querySelector("img"), { scale: 1.05, duration: 0.95 });
      current = i;
      q(".ev-caption-text").forEach((c, n) => c.classList.toggle("is-on", n === i));
      q(".ev-dot").forEach((c, n) => c.classList.toggle("is-on", n === i));
      const count = q(".ev-count-now")[0];
      if (count) count.textContent = String(i + 1).padStart(2, "0");
    };
    items.forEach((item, i) => {
      ScrollTrigger.create({ trigger: item, start: "top 55%", end: "bottom 55%", onEnter: () => show(i), onEnterBack: () => show(i) });
    });
  });

  if (!events.length) return null; // no published events: the section disappears entirely

  return (
    <section ref={ref} id="events" className="events section paper" aria-labelledby="events-title" data-stage>
      <Sprite name="strand-1" className="hang hang--l sway" depth={-0.18} />
      <Sprite name="strand-2" className="hang hang--r sway sway--slow" depth={-0.22} />

      <header className="container center events-head">
        <p className="eyebrow" data-reveal="fade">Join us for</p>
        <h2 id="events-title" className="script" data-reveal="up">Wedding Celebrations</h2>
        <p className="body-s events-sub" data-reveal="fade">Five celebrations at our Tuscan villa. All times are Italy time (CEST).</p>
      </header>

      <div className="container ev-grid">
        <div className="ev-stage-wrap" aria-hidden="true">
          <div className="ev-stage arch arch--frame">
            {events.map((e) => (
              <div key={e.id} className="ev-photo">
                <Pic src={(PHOTOS[e.id] ?? PHOTOS.ceremony).src} alt="" />
              </div>
            ))}
          </div>
          <p className="ev-caption caption">
            {events.map((e, i) => (
              <span key={e.id} className={`ev-caption-text${i === 0 ? " is-on" : ""}`}>{e.name}</span>
            ))}
          </p>
          <div className="ev-progress">
            <span className="ev-count names"><span className="ev-count-now">01</span> / {String(events.length).padStart(2, "0")}</span>
            <span className="ev-dots">
              {events.map((e, i) => <i key={e.id} className={`ev-dot${i === 0 ? " is-on" : ""}`} />)}
            </span>
          </div>
        </div>

        <ol className="ev-list">
          {events.length > 1 && (
            <svg className="ev-vine" viewBox="0 0 40 1000" preserveAspectRatio="none" aria-hidden="true">
              <path className="ev-vine-path" d="M20 0 C 2 90, 38 170, 20 250 C 2 330, 38 420, 20 500 C 2 580, 38 670, 20 750 C 2 830, 38 920, 20 1000"
                fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
          {events.map((e, i) => {
            const photo = PHOTOS[e.id] ?? PHOTOS.ceremony;
            return (
              <li key={e.id} className="ev-item">
                <span className="ev-bud" aria-hidden="true" />
                <figure className="ev-inline arch arch--frame" data-reveal="mask">
                  <Pic src={photo.src} alt={photo.alt} inner />
                </figure>
                <p className="ev-label eyebrow ev-reveal">
                  <span className="ev-num">{String(i + 1).padStart(2, "0")}</span> {weekdayDate(e.date!)}
                </p>
                <h3 className="ev-title script ev-reveal">{e.name}</h3>
                <p className="ev-time date-display ev-reveal">{clock(e.start!)}{e.end ? ` – ${clock(e.end)}` : ""}</p>
                {e.area && <p className="ev-place body-s ev-reveal"><PinIcon /> {e.area} · {wedding.destination.label}</p>}
                {e.description && <p className="ev-body ev-reveal">{e.description}</p>}
                <div className="ev-actions ev-reveal">
                  <a className="btn btn--ghost ev-map" href={mapsUrl()} target="_blank" rel="noopener noreferrer">
                    <PinIcon /> Location
                  </a>
                  <AddToCalendar event={e} variant="gold" align="start" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
