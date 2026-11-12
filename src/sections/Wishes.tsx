"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { wedding } from "@/content/wedding";
import { gsap, scrub } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { queueRefresh, useScene } from "@/lib/scene";
import "./wishes.css";

type Wish = { id: string; name: string; relation?: string; message: string; pinned?: boolean };
type Card = Wish & { prompt?: boolean; couple?: boolean; mine?: boolean };

/** The booth holds the latest 25 wishes; the top six rise into it with the scroll. */
const DECK = 25;
const RISE = 6;
/** "1,024": counts as people write them. */
const fmt = (n: number) => new Intl.NumberFormat("en-GB").format(n);
const wishesWord = (n: number) => `${fmt(n)} ${n === 1 ? "wish" : "wishes"}`;
const PAGE = 24;

/** A steady, gentle tilt and offset for each card, from its id (so it never jumps on re-render). */
function lay(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  // a well-mixed value in -1..1 for each property
  const r = (k: number) => {
    let x = Math.imul(h ^ (k * 0x9e3779b9), 0x85ebca6b);
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
    return ((x >>> 0) / 4294967295) * 2 - 1;
  };
  return { tilt: r(1) * 5, dx: r(2) * 10, dy: r(3) * 6 };
}

function WishCard({ c, z, still, fresh }: { c: Card; z?: number; still?: boolean; fresh?: boolean }) {
  const s = lay(c.id);
  const style = still ? undefined : ({ "--tilt": `${s.tilt}deg`, "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, zIndex: z } as React.CSSProperties);
  return (
    <article
      className={`wb-card${c.prompt ? " wb-card--prompt" : ""}${c.couple ? " wb-card--couple" : ""}${c.mine ? " wb-card--mine" : ""}${fresh ? " is-new" : ""}`}
      style={style}
      data-tilt={s.tilt.toFixed(2)} data-dx={s.dx.toFixed(1)} data-dy={s.dy.toFixed(1)}
      aria-hidden={c.prompt || undefined}
    >
      <div className="wb-card-text">
        <p className="wb-card-msg">{c.prompt ? c.message : `“${c.message}”`}</p>
        <span className="wb-card-rule" aria-hidden="true" />
        <p className="wb-card-name">{c.name}</p>
        {c.relation && <p className="wb-card-rel">{c.relation}</p>}
        {c.mine && <p className="wb-card-tag">Delivered</p>}
      </div>
    </article>
  );
}

/** The folded paper plane that carries a wish, a line drawing (pointing right, centred on 0,0). */
function Plane() {
  return (
    <g className="wb-plane-art">
      <path className="wb-plane-wing" pathLength={1} d="M15 0 L-11 -9.5 L-3 -0.5 Z" />
      <path className="wb-plane-wing" pathLength={1} d="M15 0 L-3 -0.5 L-12.5 8.5 Z" />
      <path className="wb-plane-fold" pathLength={1} d="M15 0 L-3 -0.5 L-5.5 5 Z" />
    </g>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The guest's own wishes, kept in their browser: they see them on the booth until the couple have
 * approved them, and a wish the booth could not take just then (no connection, the database
 * resting) is sent again quietly, on this visit or the next.
 */
type Kept = { id: string; name: string; message: string; at: number; sent: boolean };
const KEEP = "wb-mine";
function readKept(): Kept[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEEP) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeKept(k: Kept[]) {
  try { localStorage.setItem(KEEP, JSON.stringify(k.slice(-8))); } catch { /* private mode */ }
}

type Outcome = "ok" | "later" | { error: string; final: boolean };
/** Send one wish. "later" when the booth cannot be reached; an error only for a wish it refuses. */
async function post(name: string, message: string, website = ""): Promise<Outcome> {
  try {
    const r = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, consent: true, website }),
    });
    if (r.ok) return "ok";
    if (r.status === 400 || r.status === 422 || r.status === 429) {
      const d = await r.json().catch(() => ({}));
      return { error: d.fields?.message || d.fields?.name || d.error || "Please check your wish and try again.", final: r.status !== 429 };
    }
    return "later";
  } catch {
    return "later";
  }
}

/**
 * S · The wishing booth, on a soft garden green. "Wishing Booth" is written large across the
 * screen; with the scroll, the section holds and the guests' wish cards (each in its scalloped
 * green frame with painted flowers) come up one by one over the title and settle into a deck,
 * each at its own small tilt. Then the two-field form comes up beneath. Sending folds the wish
 * into a little paper plane (a line drawing), which loops once and flies up over the deck,
 * drawing a pencil line behind it, and dips into the top of the deck, where the new card is
 * slipped in. "View all wishes" opens every wish in a pop-up. Guests' wishes wait for the
 * couple's approval in /studio before anyone else sees them.
 */
export default function Wishes() {
  const { tier } = useMotion();
  const still = tier === "C";
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [realTotal, setRealTotal] = useState(0);
  const [saved, setSaved] = useState<Card[]>([]);
  const [mine, setMine] = useState<Card[]>([]);
  const [form, setForm] = useState({ name: "", message: "", website: "" });
  const [errors, setErrors] = useState<{ name?: string; message?: string; form?: string }>({});
  const [phase, setPhase] = useState<"idle" | "folding" | "delivered">("idle");
  const [open, setOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const boothRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);
  const flushRef = useRef<() => void>(() => {});

  // the approved wishes, then the guest's own (those not yet approved) on top
  useEffect(() => {
    let alive = true;
    fetch(`/api/wishes?limit=${DECK}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((d) => {
        if (!alive) return;
        const list: Wish[] = d?.wishes ?? [];
        setWishes(list);
        setRealTotal(typeof d?.total === "number" ? d.total : list.length);
        const seen = new Set(list.map((w) => `${w.name}\n${w.message}`));
        setSaved(readKept().filter((k) => !seen.has(`${k.name}\n${k.message}`)).slice(-3)
          .map((k) => ({ id: k.id, name: k.name, message: k.message, mine: true })));
      });
    return () => { alive = false; };
  }, []);

  // wishes that could not be sent yet go again, quietly, every minute while the page is open
  useEffect(() => {
    let alive = true, timer = 0, busy = false;
    const flush = async () => {
      if (busy) return;
      busy = true;
      window.clearTimeout(timer);
      const done = new Set<string>();
      for (const k of readKept().filter((x) => !x.sent)) {
        const r = await post(k.name, k.message);
        if (r === "ok" || (typeof r === "object" && r.final)) done.add(k.id);
        else break;
      }
      const now = readKept();
      if (done.size) writeKept(now.map((k) => (done.has(k.id) ? { ...k, sent: true } : k)));
      busy = false;
      if (alive && now.some((k) => !k.sent && !done.has(k.id))) timer = window.setTimeout(flush, 60_000);
    };
    flushRef.current = () => { window.clearTimeout(timer); timer = window.setTimeout(flush, 60_000); };
    timer = window.setTimeout(flush, 3000);
    window.addEventListener("online", flush);
    return () => { alive = false; window.clearTimeout(timer); window.removeEventListener("online", flush); };
  }, []);

  // until enough guests have written, the couple's welcome card and the sample wishes (both in
  // src/content/wedding.ts) keep the booth full
  const booth = wedding.wishBooth;
  const young = realTotal < booth.samplesUntil;
  const samples: Card[] = young ? booth.samples.map((w, i) => ({ id: `sample-${i}`, ...w })) : [];
  const welcome: Card[] = young ? [{ id: "welcome", ...booth.welcome, prompt: true, couple: true }] : [];
  // bottom to top: the welcome card, the samples, the wishes (newest on top), and the guest's own
  const room = Math.max(0, DECK - wishes.length);
  const deck: Card[] = [...welcome, ...samples.slice(0, room).reverse(), ...wishes.slice(0, DECK).reverse(), ...saved];

  const ref = useScene<HTMLElement>((root, q, t) => {
    if (t === "C") return;
    const cards = q(".wb-booth > .wb-card:not(.is-new)") as HTMLElement[];
    const rising = cards.slice(-RISE);
    const under = cards.slice(0, Math.max(0, cards.length - RISE));
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root, start: "top top",
        end: () => `+=${(rising.length * 0.42 + 0.4) * window.innerHeight}`,
        pin: true, scrub: scrub(), anticipatePin: 1, invalidateOnRefresh: true,
      },
    });
    // the title stands alone at first; the hint to scroll fades as the first card comes up
    tl.to(q(".wb-hint"), { autoAlpha: 0, y: -10, duration: 0.5 }, 0);
    // each card comes up from below the screen, over the title, and settles on the deck, swinging
    // into its tilt (GSAP takes over the card's transform, so the tilt and offset are tweened here)
    rising.forEach((c, i) => {
      const tilt = Number(c.dataset.tilt), dx = Number(c.dataset.dx), dy = Number(c.dataset.dy);
      tl.fromTo(c,
        { x: dx, y: () => window.innerHeight * 0.95, rotation: tilt + (i % 2 ? 9 : -9), translate: "none", rotate: "none" },
        { x: dx, y: dy, rotation: tilt, duration: 1, ease: "power2.out" }, i * 0.8);
    });
    // (the deck's shadow comes with the first card)
    tl.fromTo(q(".wb-booth"), { "--shade": 0 }, { "--shade": 1, duration: 0.6 }, 0.4);
    // (the older cards are already in the deck beneath the first one up)
    if (under.length) tl.fromTo(under, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.75);
    // then the form comes up beneath the booth
    tl.fromTo(q(".wb-send"), { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" }, Math.max(0, rising.length * 0.8 - 0.2));
  }, [deck.length]);
  useEffect(() => { queueRefresh(); }, [deck.length]);

  // a sent wish is slipped into the top of the deck
  useEffect(() => {
    if (!mine.length || still) return;
    const card = boothRef.current?.querySelector<HTMLElement>(".wb-card.is-new:last-of-type");
    const glow = boothRef.current?.querySelector<HTMLElement>(".wb-glow");
    if (!card) return;
    const tilt = Number(card.dataset.tilt) * 0.5;
    gsap.fromTo(card,
      { x: 0, yPercent: -16, y: 0, scale: 1.03, rotation: tilt - 5, autoAlpha: 0, translate: "none", rotate: "none" },
      { yPercent: 0, scale: 1, rotation: tilt, autoAlpha: 1, duration: 0.95, ease: "back.out(1.3)" });
    if (glow) gsap.fromTo(glow, { autoAlpha: 0.9, scale: 0.7 }, { autoAlpha: 0, scale: 1.35, duration: 1.3, ease: "power2.out" });
  }, [mine.length, still]);

  /** The button and the deck, in stage px. */
  const geometry = () => {
    const st = stageRef.current!.getBoundingClientRect();
    const b = btnRef.current!.getBoundingClientRect();
    const d = boothRef.current!.getBoundingClientRect();
    return {
      W: st.width,
      S: { x: b.right - st.left - 34, y: b.top - st.top + 6 },
      D: { l: d.left - st.left, r: d.right - st.left, t: d.top - st.top, w: d.width, h: d.height },
    };
  };
  const placePlane = (x: number, y: number, a: number, s: number) =>
    planeRef.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${(s * 1.2).toFixed(3)})`);

  /** Folding: the plane is drawn, line by line, just above the button, and lifts off it. */
  const fold = async () => {
    const { S } = geometry();
    const g = planeRef.current!;
    const lines = g.querySelectorAll("path");
    gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 });
    gsap.set(g, { autoAlpha: 1 });
    const p = { k: 0 };
    placePlane(S.x, S.y, -30, 0.7);
    await gsap.timeline()
      .to(lines, { strokeDashoffset: 0, duration: 0.5, stagger: 0.1, ease: "power1.inOut" }, 0)
      .to(lines, { fillOpacity: 1, duration: 0.3 }, 0.45)
      .to(p, { k: 1, duration: 0.55, ease: "power2.out", onUpdate: () => placePlane(S.x + 6 * p.k, S.y - 22 * p.k, -30 + 18 * p.k, 0.7 + 0.3 * p.k) }, 0.3);
  };

  /** The flight: one loop above the button, then up beside the deck, over its top, and down into
   * it, drawing a pencil line behind; once it is in, the line is taken up after it. */
  const fly = async () => {
    const { W, S, D } = geometry();
    const p0 = { x: S.x + 6, y: S.y - 22 };
    const r = 26;
    const c = { x: Math.min(W - r - 12, p0.x + 34), y: p0.y - 44 };
    const T = { x: D.l + D.w * 0.5, y: D.t + D.h * 0.05 };
    const side = Math.min(W - 18, D.r + Math.max(48, D.w * 0.3));
    const M = { x: side, y: D.t + D.h * 0.3 };
    const A = { x: T.x + D.w * 0.16, y: Math.max(8, D.t - Math.max(56, D.h * 0.16)) };
    const d = [
      `M ${p0.x} ${p0.y}`,
      `C ${p0.x + 18} ${p0.y - 2} ${c.x + r} ${c.y + r * 0.8} ${c.x + r} ${c.y}`,
      `A ${r} ${r} 0 1 0 ${c.x - r} ${c.y}`,
      `A ${r} ${r} 0 1 0 ${c.x + r} ${c.y}`,
      `C ${c.x + r} ${c.y - 80} ${M.x + 10} ${M.y + 110} ${M.x} ${M.y}`,
      `C ${M.x - 6} ${D.t - 10} ${A.x + 80} ${A.y} ${A.x} ${A.y}`,
      `C ${A.x - 60} ${A.y} ${T.x - 6} ${T.y - 70} ${T.x} ${T.y}`,
    ].join(" ");
    const path = trailRef.current!;
    path.setAttribute("d", d);
    const L = path.getTotalLength();
    path.style.strokeDasharray = `${L} ${L}`;
    path.style.strokeDashoffset = `${L}`;
    gsap.set(path, { autoAlpha: 1 });
    const o = { l: 0 };
    await gsap.to(o, {
      l: L, duration: Math.min(3.2, 1.9 + L / 1400), ease: "sine.inOut",
      onUpdate: () => {
        const pt = path.getPointAtLength(o.l);
        const ah = path.getPointAtLength(Math.min(L, o.l + 2));
        const back = path.getPointAtLength(Math.max(0, o.l - 2));
        const ang = Math.atan2(ah.y - back.y, ah.x - back.x) * 57.2958;
        // it slips into the deck at the end of its flight
        const end = Math.max(0, (o.l - (L - 90)) / 90);
        placePlane(pt.x, pt.y, ang, 1 - 0.6 * end);
        gsap.set(planeRef.current, { autoAlpha: 1 - 0.9 * end });
        path.style.strokeDashoffset = `${L - o.l}`;
      },
    });
    gsap.set(planeRef.current, { autoAlpha: 0 });
    // the pencil line is taken up from its start, after the plane
    const e = { a: 0 };
    gsap.to(e, {
      a: L, duration: 1.1, ease: "power2.inOut", delay: 0.35,
      onUpdate: () => {
        path.style.strokeDasharray = `${Math.max(0, L - e.a)} ${L * 2}`;
        path.style.strokeDashoffset = `${-e.a}`;
      },
      onComplete: () => { gsap.set(path, { autoAlpha: 0 }); },
    });
  };

  /** On a phone the keyboard (and the page with it) may have moved the booth: it is brought back
   * into full view before the plane sets off. */
  const settle = async () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && stageRef.current?.contains(active)) {
      active.blur();
      await wait(250);
    }
    const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
    const deck = boothRef.current!.getBoundingClientRect();
    const btn = btnRef.current!.getBoundingClientRect();
    if (deck.top >= nav && btn.bottom <= window.innerHeight) return;
    const top = stageRef.current!.parentElement!.getBoundingClientRect().top;
    window.scrollTo({ top: window.scrollY + top, behavior: still ? "auto" : "smooth" });
    await wait(still ? 50 : 700);
  };

  /** When a wish is refused (too short, too many from one place): the plane drifts down and fades. */
  const drop = () => {
    const g = planeRef.current;
    if (!g) return;
    gsap.to(g, { y: 40, autoAlpha: 0, duration: 0.7, ease: "power2.in", onComplete: () => gsap.set(g, { y: 0 }) });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    const name = form.name.trim(), message = form.message.trim();
    const errs: typeof errors = {};
    if (name.length < 2) errs.name = "Please add your name.";
    if (message.length < 10) errs.message = "Please write a few words (at least 10 characters).";
    setErrors(errs);
    if (errs.name || errs.message) return;

    setPhase("folding");
    const sending = post(name, message, form.website);
    await settle();
    if (!still) await fold();
    // (a refusal comes back quickly; anything slower simply flies, and is settled after)
    const early = await Promise.race([sending, wait(still ? 4000 : 900).then(() => null)]);
    if (early && typeof early === "object" && early.final) {
      if (!still) drop();
      setErrors({ form: early.error });
      setPhase("idle");
      return;
    }
    if (!still) await fly();
    const id = `mine-${Date.now()}`;
    setMine((m) => [...m, { id, name, message, mine: true }]);
    setForm({ name: "", message: "", website: "" });
    setPhase("delivered");
    if (!form.website) {
      const outcome = await sending;
      writeKept([...readKept(), { id, name, message, at: Date.now(), sent: outcome === "ok" || (typeof outcome === "object" && outcome.final) }]);
      if (outcome !== "ok") flushRef.current();
    }
    await wait(2800);
    setPhase("idle");
  }

  const label = { idle: "Send your wish", folding: "Folding…", delivered: "Delivered" }[phase];
  const own = [...saved, ...mine];
  const total = realTotal + own.length + samples.length;

  return (
    <section ref={ref} id="wishes" className="wishes" aria-labelledby="wishes-title">
      <div ref={stageRef} className="wb-stage">
        <header className="center wb-head">
          <p className="eyebrow" data-reveal="fade">Leave a blessing</p>
          {!still && <p className="wb-hint" aria-hidden="true">Scroll down<span className="wb-hint-line" /></p>}
        </header>

        <div className="wb-booth-wrap">
          <h2 id="wishes-title" className="wb-word"><span data-reveal="up">Wishing Booth</span></h2>
          <div ref={boothRef} className="wb-booth">
            {deck.map((c, i) => <WishCard key={c.id} c={c} z={i + 1} still={still} />)}
            {mine.map((c, i) => <WishCard key={c.id} c={c} z={100 + i} still={still} fresh />)}
            <span className="wb-glow" aria-hidden="true" />
          </div>
        </div>

        <div className="wb-send">
          <form className="wb-form" onSubmit={submit} noValidate>
            <label className="sr-only" htmlFor="wb-name">Your name</label>
            <input
              id="wb-name" className="wb-input wb-input--name" placeholder="Your name" autoComplete="name" maxLength={60}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              aria-invalid={!!errors.name} disabled={phase !== "idle"}
            />
            <label className="sr-only" htmlFor="wb-msg">Your wish</label>
            <textarea
              id="wb-msg" className="wb-input wb-input--wish" placeholder="Your wish for them…" rows={1} maxLength={300}
              value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              aria-invalid={!!errors.message} disabled={phase !== "idle"}
            />
            <div className="wb-hp" aria-hidden="true">
              <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
            </div>
            <button ref={btnRef} className={`wb-btn is-${phase}`} type="submit" disabled={phase !== "idle"}>
              <span>{label}</span>
              {phase === "delivered"
                ? <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5 L8.2 14.5 L16 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg viewBox="-16 -12 32 24" aria-hidden="true"><Plane /></svg>}
            </button>
          </form>
          <div className="wb-msgs" aria-live="polite">
            {(errors.name || errors.message || errors.form) && <p className="wb-error" role="alert">{errors.name || errors.message || errors.form}</p>}
            {phase === "delivered" && <p className="wb-note">Delivered. {wedding.couple.bride.name} &amp; {wedding.couple.groom.name} will read it, and it joins the booth for everyone soon.</p>}
          </div>
          {/* (its place is kept while there is nothing to view, so the booth never shifts) */}
          <button ref={viewRef} type="button" className="wb-view" onClick={() => setOpen(true)} style={total ? undefined : { visibility: "hidden" }}>
            View all {total > 1 ? `${fmt(total)} ` : ""}wishes <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* the paper plane's flight, over the whole stage */}
        <svg className="wb-flight" aria-hidden="true">
          <defs>
            {/* a pencil's slight unevenness */}
            <filter id="wb-pencil" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="3" />
              <feDisplacementMap in="SourceGraphic" scale="1.6" />
            </filter>
          </defs>
          <path ref={trailRef} className="wb-trail" filter="url(#wb-pencil)" />
          <g ref={planeRef} className="wb-plane"><Plane /></g>
        </svg>
      </div>

      {open && <AllWishes mine={own} samples={samples} realTotal={realTotal} onClose={() => { setOpen(false); viewRef.current?.focus(); }} still={still} />}
    </section>
  );
}

/** Every wish, in a pop-up at the centre of the screen, with how many there are: the guest's own
 * first, then everyone's (newest first, a page at a time), then the samples while the booth is
 * young. */
function AllWishes({ mine, samples, realTotal, onClose, still }: { mine: Card[]; samples: Card[]; realTotal: number; onClose: () => void; still: boolean }) {
  const [list, setList] = useState<Wish[]>([]);
  const [apiTotal, setApiTotal] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const panel = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/wishes?limit=${PAGE}&page=${p}`);
      const d = r.ok ? await r.json() : null;
      if (d?.wishes) {
        setList((l) => (p === 0 ? d.wishes : [...l, ...d.wishes]));
        setMore(!!d.more);
        setPage(p);
        if (typeof d.total === "number") setApiTotal(d.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(0); }, [load]);

  // (the parent's onClose changes on every render: the pop-up is set up once, so it reads it from a ref)
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const close = useCallback(() => {
    if (still) { onCloseRef.current(); return; }
    gsap.to(panel.current, { y: 18, scale: 0.97, autoAlpha: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(shade.current, { autoAlpha: 0, duration: 0.35, onComplete: () => onCloseRef.current() });
  }, [still]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    closeBtn.current?.focus();
    if (!still) {
      gsap.fromTo(shade.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
      gsap.fromTo(panel.current, { y: 26, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: "power3.out" });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        // keep the focus inside the pop-up
        const f = panel.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { html.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [close, still]);

  // the cards settle in, a few at a time
  useEffect(() => {
    if (still || !panel.current) return;
    const fresh = panel.current.querySelectorAll<HTMLElement>(".wb-all-grid .wb-card:not(.is-in)");
    fresh.forEach((c) => c.classList.add("is-in"));
    gsap.fromTo(fresh, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.04, ease: "power2.out", delay: 0.1 });
  }, [list.length, still]);

  const cards: Card[] = [...[...mine].reverse(), ...list, ...(more ? [] : samples)];
  const count = (apiTotal ?? realTotal) + mine.length + samples.length;
  return createPortal(
    <div ref={shade} className="wb-modal" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={panel} className="wb-modal-panel" role="dialog" aria-modal="true" aria-labelledby="wb-all-title">
        <button ref={closeBtn} type="button" className="wb-close" onClick={close} aria-label="Close">×</button>
        <header className="center wb-all-head">
          <p className="eyebrow">The wishing booth</p>
          <h3 id="wb-all-title">Every Wish</h3>
          {count > 0 && <p className="wb-all-count">{wishesWord(count)} from family &amp; friends</p>}
        </header>
        <div className="wb-all-body">
          {cards.length ? (
            <div className="wb-all-grid">
              {cards.map((c) => <WishCard key={c.id} c={c} still />)}
            </div>
          ) : (
            <p className="wb-all-empty center">{loading ? "Opening the booth…" : "No wishes yet. Be the first to leave one."}</p>
          )}
          {more && (
            <div className="center">
              <button type="button" className="wb-view" disabled={loading} onClick={() => load(page + 1)}>{loading ? "Loading…" : "More wishes"}</button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
