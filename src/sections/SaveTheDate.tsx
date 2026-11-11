"use client";

import { useEffect, useState } from "react";
import { publishedEvents, wedding } from "@/content/wedding";
import { clock, localEquivalent, weddingInstant } from "@/lib/dates";
import { gsap, ScrollTrigger, scrub, tokens } from "@/lib/gsap";
import { useScene } from "@/lib/scene";
import AddToCalendar from "@/components/AddToCalendar";
import CalendarCountdown from "@/components/CalendarCountdown";
import { InvocationIcon } from "@/components/Ornaments";
import Pic, { Sprite } from "@/components/Pic";
import "./welcome.css";
import "./save-the-date.css";

function LocalTime() {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => setText(localEquivalent(weddingInstant())), []);
  return text ? <span className="std-local"> · {text}</span> : null;
}

/* ------------------------------------------------------------------ the dial
 * A gauge of the wedding month: 220° of arc, one tick every half day, the days labelled. The
 * needle sweeps from the 1st to the wedding day while the number in the middle counts up through
 * a soft blur; a small bead then runs along the inner track with the countdown's seconds.
 */
const CX = 180, CY = 178, R = 146;
const A0 = 200, SPAN = 220;            // degrees: the arc runs from A0 clockwise through SPAN
const MAJOR = [1, 5, 10, 15, 20, 25, 31];
const TRACK = R - 24;

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (deg: number, r: number) => [CX + r * Math.cos(rad(deg)), CY - r * Math.sin(rad(deg))] as const;
/** The angle of a day of the month (1–31) on the dial. */
const dayAngle = (day: number) => A0 - ((day - 1) / 30) * SPAN;
const arc = (r: number) => {
  const [x0, y0] = pt(A0, r), [x1, y1] = pt(A0 - SPAN, r);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 1 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

function Dial({ day }: { day: number }) {
  const dayLit = day;
  const ticks = Array.from({ length: 61 }, (_, k) => {
    const d = 1 + k / 2;
    const major = MAJOR.includes(d);
    const a = dayAngle(d);
    const [x0, y0] = pt(a, R);
    const [x1, y1] = pt(a, R - (major ? 14 : 7));
    // without scripts (or with reduced motion) the dial shows its final state
    const on = d <= dayLit ? " is-on" : "";
    return <line key={k} className={`dial-tick${major ? " dial-tick--major" : ""}${on}`} data-day={d}
      x1={x0.toFixed(1)} y1={y0.toFixed(1)} x2={x1.toFixed(1)} y2={y1.toFixed(1)} />;
  });
  const [nx0, ny0] = pt(90, R - 22);
  const [nx1, ny1] = pt(90, R - 50);
  // the needle is drawn pointing straight up (90°) and rotated to its day
  const turn = 90 - dayAngle(day);
  return (
    <svg className="dial-svg" viewBox="0 0 360 236" aria-hidden="true">
      <path className="dial-track" d={arc(TRACK)} />
      <g className="dial-ticks">{ticks}</g>
      <g className="dial-labels">
        {MAJOR.map((d) => {
          const [x, y] = pt(dayAngle(d), R + 15);
          return <text key={d} className="dial-label" data-day={d} x={x.toFixed(1)} y={(y + 4).toFixed(1)}>{d}</text>;
        })}
      </g>
      <g className="dial-needle" transform={`rotate(${turn.toFixed(2)} ${CX} ${CY})`}>
        <line x1={nx0} y1={ny0} x2={nx1} y2={ny1} />
        <circle cx={nx1} cy={ny1} r="3.6" />
      </g>
      <circle className="dial-bead" cx={pt(A0, TRACK)[0]} cy={pt(A0, TRACK)[1]} r="3" />
    </svg>
  );
}

/**
 * S02 · Save the Date, in the open sky of the sunlit Tuscan garden (the photograph split into
 * depth layers by tools/build_welcome.py: the sky drifts slowest, the villa terrace, hydrangeas
 * and wisteria settle in from below as the section arrives). No card: the dial finds the day,
 * then the month and year, the hour, and the countdown on its tear-off calendar pads.
 */
export default function SaveTheDate() {
  const ceremony = publishedEvents().find((e) => e.type === "ceremony") ?? publishedEvents()[0];
  const [y, , d] = wedding.date.split("-");
  const day = Number(d);
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${wedding.date}T12:00:00Z`));
  const [run, setRun] = useState(false);

  const { invocation } = wedding.welcome;

  const ref = useScene<HTMLElement>((root, q, tier) => {
    if (tier !== "C") {
      // the near layers only ever settle downward-to-home, so nothing they cover is uncovered
      const enter = { trigger: root, start: "top bottom", end: "top 18%", scrub: scrub() };
      gsap.fromTo(q(".wel-near--l"), { yPercent: 3 }, { yPercent: 0, ease: "power2.out", scrollTrigger: enter });
      gsap.fromTo(q(".wel-near--r"), { yPercent: 1.4 }, { yPercent: 0, ease: "power2.out", scrollTrigger: enter });
    }
    const needle = q(".dial-needle")[0] as SVGGElement;
    const num = q(".std-day")[0] as HTMLElement;
    const ticks = q(".dial-tick") as SVGLineElement[];
    const bead = q(".dial-bead")[0] as SVGCircleElement;
    const light = (upTo: number) => ticks.forEach((t) => t.classList.toggle("is-on", Number(t.dataset.day) <= upTo + 0.01));

    // the bead keeps time with the countdown's seconds (left to right each minute)
    let beadTimer = 0;
    const tickBead = () => {
      const left = Math.max(0, Math.floor((weddingInstant().getTime() - Date.now()) / 1000));
      const s = left % 60;
      const a = rad(A0 - ((59 - s) / 59) * SPAN);
      const x = CX + TRACK * Math.cos(a), yy = CY - TRACK * Math.sin(a);
      if (s === 59 || tier === "C") gsap.set(bead, { attr: { cx: x, cy: yy } });
      else gsap.to(bead, { attr: { cx: x, cy: yy }, duration: 0.35, ease: "power2.out" });
      beadTimer = window.setTimeout(tickBead, 1000 - (Date.now() % 1000) + 5);
    };

    if (tier === "C") {
      light(day);
      setRun(true);
      tickBead();
      return () => window.clearTimeout(beadTimer);
    }

    const parts = q(".std-seq");
    gsap.set(parts, { autoAlpha: 0, y: 18 });
    gsap.set(q(".std-date-part"), { yPercent: 110 });
    gsap.set(needle, { rotation: 90 - dayAngle(1), svgOrigin: `${CX} ${CY}`, autoAlpha: 0 });
    gsap.set([q(".dial-tick"), q(".dial-label"), q(".dial-track"), bead], { autoAlpha: 0 });
    gsap.set(q(".std-dial-num"), { autoAlpha: 0 });
    num.textContent = "1";
    light(0);

    const counter = { v: 1 };
    let shown = 1;
    const tl = gsap.timeline({ paused: true });
    tl.to(q(".dial-track"), { autoAlpha: 1, duration: 0.6, ease: "none" }, 0)
      .to(ticks, { autoAlpha: 1, duration: 0.25, stagger: 0.012, ease: "none" }, 0)
      .to(q(".dial-label"), { autoAlpha: 1, duration: 0.4, stagger: 0.06 }, 0.25)
      .to([needle, q(".std-dial-num")[0]], { autoAlpha: 1, duration: 0.4 }, 0.55)
      // the needle sweeps to the day; the number follows it, each new figure arriving out of a blur
      .to(needle, { rotation: 90 - dayAngle(day), duration: 2.1, ease: "power3.inOut" }, 0.75)
      .to(counter, {
        v: day, duration: 2.1, ease: "power3.inOut",
        onUpdate: () => {
          const now = Math.max(1, Math.round(counter.v));
          light(counter.v);
          if (now === shown) return;
          shown = now;
          num.textContent = String(now);
          gsap.fromTo(num, { filter: "blur(7px)", opacity: 0.25, scale: 0.96 }, { filter: "blur(0px)", opacity: 1, scale: 1, duration: 0.28, ease: "power2.out", overwrite: true });
        },
      }, 0.75)
      .to(bead, { autoAlpha: 1, duration: 0.5, onStart: tickBead }, 2.9)
      // then the month and year, the hour, the countdown, and the calendar button last
      .to(q(".std-date-part"), { yPercent: 0, duration: 1, ease: tokens.ease.title, stagger: 0.14 }, 2.75)
      .to(q(".std-rules .rule"), { scaleX: 1, duration: 0.9, ease: tokens.ease.cinematic }, 2.8)
      .to(parts, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.2, ease: tokens.ease.reveal, clearProps: "transform" }, 3.1)
      .add(() => setRun(true), 3.5);
    gsap.set(q(".std-rules .rule"), { scaleX: 0 });

    const st = ScrollTrigger.create({ trigger: q(".std-dial")[0], start: "top 78%", once: true, onEnter: () => tl.play() });
    return () => {
      window.clearTimeout(beadTimer);
      tl.kill();
      st.kill();
    };
  });

  return (
    <section ref={ref} id="save-the-date" className="welcome std" aria-labelledby="std-title" data-stage>
      <div className="wel-scene" aria-hidden="true">
        <div className="wel-box">
          <div className="wel-layer" data-depth="-0.3"><Pic src="/assets/img/welcome-sky" alt="" /></div>
          <div className="wel-layer"><Pic src="/assets/img/welcome-far" alt="" /></div>
          <div className="wel-layer wel-near wel-near--l"><Pic src="/assets/img/welcome-near-l" alt="" /></div>
          <div className="wel-layer wel-near wel-near--r"><Pic src="/assets/img/welcome-near-r" alt="" /></div>
        </div>
        {/* clouds drift across the open sky the dial and the calendar sit in */}
        <Sprite name="cloud-1" className="std-cloud std-cloud--1" depth={-0.12} />
        <Sprite name="cloud-2" className="std-cloud std-cloud--2" depth={-0.18} />
        <Sprite name="cloud-3" className="std-cloud std-cloud--3" depth={-0.08} />
        <Sprite name="cloud-2" className="std-cloud std-cloud--4" depth={-0.05} />
        {/* phones see the villa side of the garden: wisteria and hydrangeas join it */}
        <Sprite name="canopy-l" className="wel-canopy" depth={0.14} />
        <Sprite name="bed-l" className="wel-m wel-m-bed" depth={0.22} />
      </div>

      <div className="container wel-text std-text">
        {invocation.enabled && (
          <>
            <div data-reveal="draw" className="welcome-icon"><InvocationIcon /></div>
            <p lang={invocation.lang} className="welcome-invocation" data-reveal="up">{invocation.text}</p>
          </>
        )}
        <h2 id="std-title" className="script std-title" data-reveal="up">Save the Date</h2>

        <div className="std-dial" aria-hidden="true">
          <Dial day={day} />
          <div className="std-dial-num"><span className="std-day std-num">{day}</span></div>
        </div>
        <p className="std-date names" aria-label={`${day} ${month} ${y}`}>
          <span className="line-mask"><span className="std-date-part">{month}</span></span>
          <span className="line-mask"><span className="std-date-part std-num">{y}</span></span>
        </p>
        <div className="ornament std-rules" aria-hidden="true"><span className="rule" /><span className="std-dot" /><span className="rule" /></div>

        <p className="std-meta eyebrow std-seq">
          {clock(wedding.time)} · {wedding.destination.label}
        </p>
        <p className="std-zone body-s std-seq">
          Italy time (CEST)<LocalTime />
        </p>
        <div className="std-countdown std-seq">
          <CalendarCountdown run={run} />
        </div>
        {ceremony && (
          <div className="std-actions std-seq">
            <AddToCalendar event={ceremony} />
          </div>
        )}
      </div>
    </section>
  );
}
