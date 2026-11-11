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
/** Until this many guests have written, the couple's own cards keep the booth company. */
const MIN_WISHES = 5;
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
  return { tilt: r(1) * 6, dx: r(2) * 12, dy: r(3) * 6, tone: Math.floor(((r(4) + 1) / 2) * 3.999) };
}

/** A small gold five-petal blossom, the seal at the head of each card. */
function Blossom() {
  return (
    <svg className="wb-card-bloom" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
      {[0, 72, 144, 216, 288].map((r) => (
        <path key={r} d="M13 13 C 10 9, 10.5 4.5, 13 2.5 C 15.5 4.5, 16 9, 13 13 Z" transform={`rotate(${r} 13 13)`} />
      ))}
      <circle cx="13" cy="13" r="2" fill="#fffaf0" />
    </svg>
  );
}

function WishCard({ c, z, still }: { c: Card; z?: number; still?: boolean }) {
  const s = lay(c.id);
  const style = still ? undefined : ({ "--tilt": `${s.tilt}deg`, "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, zIndex: z } as React.CSSProperties);
  return (
    <article
      className={`wb-card${c.prompt ? " wb-card--prompt" : ""}${c.couple ? " wb-card--couple" : ""}${c.mine ? " wb-card--mine" : ""}`}
      data-tone={s.tone}
      style={style}
      data-tilt={s.tilt.toFixed(2)} data-dx={s.dx.toFixed(1)} data-dy={s.dy.toFixed(1)}
      aria-hidden={c.prompt || undefined}
    >
      <Blossom />
      <p className="wb-card-msg">{c.prompt ? c.message : `“${c.message}”`}</p>
      <span className="wb-card-rule" aria-hidden="true" />
      <p className="wb-card-name">{c.name}</p>
      {c.relation && <p className="wb-card-rel">{c.relation}</p>}
      {c.mine && <p className="wb-card-tag">Delivered · the couple will read it soon</p>}
    </article>
  );
}

/** The folded paper plane that carries a wish (drawn pointing right, centred on 0,0). */
function Plane() {
  return (
    <g className="wb-plane-art">
      <path d="M15 0 L-13 -11 L-5 0 L-13 11 Z" fill="#fffdf6" stroke="#8a6a32" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M15 0 L-5 0 L-9 6.5 Z" fill="#eadcbc" stroke="#8a6a32" strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * S · The wishing booth. Guests' wishes stand as cards in a booth on a gold ledge. With the scroll,
 * the newest cards rise one by one and settle on the deck, each at its own small tilt; then the
 * two-field form comes up beneath. Sending folds the wish into a paper plane, which loops once and
 * flies along a fine gold trail into the booth, where the new card lands on top. "View all wishes"
 * opens every wish in a pop-up. Guests' wishes wait for the couple's approval in /studio before
 * anyone else sees them.
 */
export default function Wishes() {
  const { tier } = useMotion();
  const still = tier === "C";
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [mine, setMine] = useState<Card[]>([]);
  const [form, setForm] = useState({ name: "", message: "", website: "" });
  const [errors, setErrors] = useState<{ name?: string; message?: string; form?: string }>({});
  const [phase, setPhase] = useState<"idle" | "folding" | "flying" | "delivered">("idle");
  const [open, setOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const boothRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/wishes?limit=${DECK}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.wishes) setWishes(d.wishes); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // bottom to top: the couple's cards (while the booth is young), then the wishes, newest on top
  const prompts: Card[] = wishes.length < MIN_WISHES
    ? wedding.wishBooth.prompts.map((p, i) => ({ id: `prompt-${i}`, name: p.name, message: p.message, prompt: true, couple: i === 0 })).reverse()
    : [];
  const deck: Card[] = [...prompts, ...wishes.slice(0, DECK).reverse()];

  const ref = useScene<HTMLElement>((root, q, t) => {
    if (t === "C") return;
    const cards = q(".wb-booth > .wb-card:not(.wb-card--mine)") as HTMLElement[];
    const rising = cards.slice(-RISE);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root, start: "top top",
        end: () => `+=${(rising.length * 0.42 + 0.4) * window.innerHeight}`,
        pin: true, scrub: scrub(), anticipatePin: 1, invalidateOnRefresh: true,
      },
    });
    // each card rises from below the screen and settles on the deck, swinging into its tilt
    // (GSAP takes over the card's transform, so the tilt and offset are tweened here)
    rising.forEach((c, i) => {
      const tilt = Number(c.dataset.tilt), dx = Number(c.dataset.dx), dy = Number(c.dataset.dy);
      tl.fromTo(c,
        { x: dx, y: () => window.innerHeight * 0.95, rotation: tilt + (i % 2 ? 10 : -10), translate: "none", rotate: "none" },
        { x: dx, y: dy, rotation: tilt, duration: 1, ease: "power2.out" }, i * 0.8);
    });
    // then the form comes up beneath the booth
    tl.fromTo(q(".wb-send"), { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" }, Math.max(0, rising.length * 0.8 - 0.2));
  }, [deck.length]);
  useEffect(() => { queueRefresh(); }, [deck.length]);

  // a delivered wish lands on top of the booth
  useEffect(() => {
    if (!mine.length || still) return;
    const card = boothRef.current?.querySelector<HTMLElement>(".wb-card--mine:last-of-type");
    const glow = boothRef.current?.querySelector<HTMLElement>(".wb-glow");
    if (!card) return;
    const tilt = Number(card.dataset.tilt) * 0.5;
    gsap.fromTo(card,
      { x: 0, y: -70, scale: 1.08, rotation: tilt + 8, autoAlpha: 0, translate: "none", rotate: "none" },
      { y: 0, scale: 1, rotation: tilt, autoAlpha: 1, duration: 0.9, ease: "back.out(1.4)" });
    if (glow) gsap.fromTo(glow, { autoAlpha: 0.9, scale: 0.7 }, { autoAlpha: 0, scale: 1.35, duration: 1.3, ease: "power2.out" });
  }, [mine.length, still]);

  /** Where the plane starts (at the button) and where it lands (in the top of the booth), in stage px. */
  const geometry = () => {
    const st = stageRef.current!.getBoundingClientRect();
    const b = btnRef.current!.getBoundingClientRect();
    const d = boothRef.current!.getBoundingClientRect();
    return {
      S: { x: b.right - st.left - 30, y: b.top - st.top + b.height / 2 },
      T: { x: d.left - st.left + d.width / 2, y: d.top - st.top + d.height * 0.28 },
    };
  };
  const placePlane = (x: number, y: number, a: number, s: number) =>
    planeRef.current?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${s.toFixed(3)})`);

  /** Folding: the plane takes shape on the button and lifts off it. */
  const fold = async () => {
    const { S } = geometry();
    const p = { k: 0 };
    gsap.set(planeRef.current, { autoAlpha: 1 });
    await gsap.to(p, {
      k: 1, duration: 0.75, ease: "back.out(1.6)",
      onUpdate: () => placePlane(S.x + 8 * p.k, S.y - 26 * p.k, -40 + 30 * p.k, p.k),
    });
  };

  /** The flight: one loop, then along a long gold trail into the booth. */
  const fly = async () => {
    const { S, T } = geometry();
    const s0 = { x: S.x + 8, y: S.y - 26 };
    const r = 30, c = { x: s0.x + 44, y: s0.y - 50 };
    const d = [
      `M ${s0.x} ${s0.y}`,
      `C ${s0.x + 22} ${s0.y - 4} ${c.x + r} ${c.y + r * 0.7} ${c.x + r} ${c.y}`,
      `A ${r} ${r} 0 1 0 ${c.x - r} ${c.y}`,
      `A ${r} ${r} 0 1 0 ${c.x + r} ${c.y}`,
      `C ${c.x + r + 150} ${c.y - 60} ${T.x + 90} ${T.y - 260} ${T.x} ${T.y}`,
    ].join(" ");
    const path = trailRef.current!;
    path.setAttribute("d", d);
    const L = path.getTotalLength();
    const TR = 280;
    path.style.strokeDasharray = `${TR} ${L + TR}`;
    gsap.set(path, { autoAlpha: 1 });
    const o = { l: 0 };
    await gsap.to(o, {
      l: L, duration: 2.5, ease: "power1.inOut",
      onUpdate: () => {
        const pt = path.getPointAtLength(o.l);
        const ah = path.getPointAtLength(Math.min(L, o.l + 2));
        const ang = Math.atan2(ah.y - pt.y, ah.x - pt.x) * 57.2958;
        // it dips into the booth at the end of its flight
        const end = Math.max(0, (o.l - (L - 120)) / 120);
        placePlane(pt.x, pt.y, ang, 1 - 0.55 * end);
        path.style.strokeDashoffset = `${TR - o.l}`;
      },
    });
    gsap.to(planeRef.current, { autoAlpha: 0, duration: 0.25 });
    gsap.to(path, { autoAlpha: 0, duration: 0.6, delay: 0.1 });
  };

  /** When a wish cannot be sent: the plane drifts down and fades. */
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
    const send = fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, consent: true, website: form.website }),
    })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .catch(() => ({ ok: false, data: {} as Record<string, unknown> }));
    const [res] = await Promise.all([send, still ? Promise.resolve() : fold().then(() => wait(150))]);
    if (!res.ok) {
      if (!still) drop();
      const d = res.data as { error?: string; fields?: Record<string, string> };
      setErrors({ form: d.fields?.message || d.fields?.name || d.error || "Something went wrong. Please try again." });
      setPhase("idle");
      return;
    }
    if (!still) {
      setPhase("flying");
      await fly();
    }
    setMine((m) => [...m, { id: `mine-${Date.now()}`, name, message, mine: true }]);
    setForm({ name: "", message: "", website: "" });
    setPhase("delivered");
    await wait(2800);
    setPhase("idle");
  }

  const label = { idle: "Send your wish", folding: "Folding…", flying: "Sending…", delivered: "Delivered" }[phase];
  const total = wishes.length + mine.length;

  return (
    <section ref={ref} id="wishes" className="wishes paper" aria-labelledby="wishes-title">
      <div ref={stageRef} className="wb-stage">
        <span className="wb-watermark" aria-hidden="true">Blessings</span>
        <header className="center wb-head">
          <p className="eyebrow" data-reveal="fade">Leave a blessing</p>
          <h2 id="wishes-title" className="script" data-reveal="up">Wishing Booth</h2>
        </header>

        <div className="wb-booth-wrap">
          <div ref={boothRef} className="wb-booth">
            {deck.map((c, i) => <WishCard key={c.id} c={c} z={i + 1} still={still} />)}
            {mine.map((c, i) => <WishCard key={c.id} c={c} z={100 + i} still={still} />)}
            <span className="wb-glow" aria-hidden="true" />
          </div>
          <div className="wb-ledge" aria-hidden="true">
            <span className="wb-plate">For {wedding.couple.bride.name} &amp; {wedding.couple.groom.name}</span>
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
          {total > 0 && (
            <button ref={viewRef} type="button" className="wb-view" onClick={() => setOpen(true)}>
              View all wishes <span aria-hidden="true">→</span>
            </button>
          )}
        </div>

        {/* the paper plane's flight, over the whole stage */}
        <svg className="wb-flight" aria-hidden="true">
          <path ref={trailRef} className="wb-trail" />
          <g ref={planeRef} className="wb-plane"><Plane /></g>
        </svg>
      </div>

      {open && <AllWishes mine={mine} onClose={() => { setOpen(false); viewRef.current?.focus(); }} still={still} />}
    </section>
  );
}

/** Every wish, in a pop-up at the centre of the screen. */
function AllWishes({ mine, onClose, still }: { mine: Card[]; onClose: () => void; still: boolean }) {
  const [list, setList] = useState<Wish[]>([]);
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
      if (d?.wishes) { setList((l) => (p === 0 ? d.wishes : [...l, ...d.wishes])); setMore(!!d.more); setPage(p); }
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

  const cards: Card[] = [...[...mine].reverse(), ...list];
  return createPortal(
    <div ref={shade} className="wb-modal" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={panel} className="wb-modal-panel" role="dialog" aria-modal="true" aria-labelledby="wb-all-title">
        <button ref={closeBtn} type="button" className="wb-close" onClick={close} aria-label="Close">×</button>
        <header className="center wb-all-head">
          <p className="eyebrow">The wishing booth</p>
          <h3 id="wb-all-title" className="script">Every Wish</h3>
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
