"use client";

import { useEffect, useState } from "react";
import { publishedEvents, wedding } from "@/content/wedding";
import { clock, localEquivalent, weddingInstant } from "@/lib/dates";
import { gsap, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import AddToCalendar from "@/components/AddToCalendar";
import Countdown from "@/components/Countdown";
import { Sprite } from "@/components/Pic";
import "./save-the-date.css";

function LocalTime() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => setText(localEquivalent(weddingInstant())), []);
  return text ? <span className="std-local"> · {text}</span> : null;
}

/** S05 · Save the Date. */
export default function SaveTheDate() {
  const ceremony = publishedEvents().find((e) => e.type === "ceremony") ?? publishedEvents()[0];
  const [y, m, d] = wedding.date.split("-");
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${wedding.date}T12:00:00Z`));

  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier === "C") return;
    gsap.from(q(".std-date-part"), {
      yPercent: 110, duration: 1.1, ease: tokens.ease.title, stagger: 0.15,
      scrollTrigger: { trigger: q(".std-date")[0], start: "top 80%", once: true },
    });
    gsap.from(q(".std-card .rule"), {
      scaleX: 0, duration: 1, ease: tokens.ease.cinematic,
      scrollTrigger: { trigger: q(".std-date")[0], start: "top 80%", once: true },
    });
  });

  return (
    <section ref={ref} id="save-the-date" className="std" aria-labelledby="std-title" data-stage>
      <div className="std-sky" aria-hidden="true" />
      <Sprite name="cloud-1" className="std-cloud std-cloud--1" depth={-0.3} />
      <Sprite name="cloud-2" className="std-cloud std-cloud--2" depth={-0.2} />
      <Sprite name="cypress-l" className="std-cypress std-cypress--l" depth={0.15} />
      <Sprite name="cypress-r" className="std-cypress std-cypress--r" depth={0.15} />
      <Sprite name="bed-l" className="std-bloom std-bloom--l" depth={0.45} />
      <Sprite name="bed-r" className="std-bloom std-bloom--r" depth={0.45} />

      <div className="container std-wrap">
        <div className="std-card card">
          <div className="std-garland" aria-hidden="true">
            <Sprite name="strand-2" className="std-w std-w--1 sway" />
            <Sprite name="strand-1" className="std-w std-w--2 sway sway--slow" />
            <Sprite name="strand-3" className="std-w std-w--3 sway" />
            <Sprite name="strand-1" className="std-w std-w--4 sway" />
            <Sprite name="strand-2" className="std-w std-w--5 sway sway--slow" />
          </div>
          <h2 id="std-title" className="script" data-reveal="up">Save the Date</h2>
          <div className="ornament std-rules" aria-hidden="true"><span className="rule" /><span className="std-dot" /><span className="rule" /></div>
          <p className="std-date names" aria-label={`${Number(d)} ${month} ${y}`}>
            <span className="line-mask"><span className="std-date-part std-num">{Number(d)}</span></span>
            <span className="line-mask"><span className="std-date-part">{month}</span></span>
            <span className="line-mask"><span className="std-date-part std-num">{y}</span></span>
          </p>
          <p className="std-meta eyebrow" data-reveal="fade">
            {clock(wedding.time)} · {wedding.destination.label}
          </p>
          <p className="std-zone body-s" data-reveal="fade">
            Italy time (CEST)<LocalTime />
          </p>
          <div className="std-countdown" data-reveal="stagger">
            <Countdown />
          </div>
          {ceremony && (
            <div className="std-actions" data-reveal="up">
              <AddToCalendar event={ceremony} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
