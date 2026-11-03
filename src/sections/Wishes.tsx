"use client";

import { useCallback, useEffect, useState } from "react";
import { wedding } from "@/content/wedding";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { queueRefresh, useScene } from "@/lib/scene";
import "./wishes.css";

type Wish = { id: string; name: string; relation?: string; message: string; pinned?: boolean };
const RELATIONS = ["Family of the bride", "Family of the groom", "Friend", "Colleague", "Other"];

function corner(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return { variant: Math.abs(h) % 6, tilt: ((Math.abs(h) % 7) - 3) * 0.5 };
}

/** S14 · Wishing wall: guests leave blessings; the couple approves them in /studio. */
export default function Wishes() {
  const { tier } = useMotion();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [mine, setMine] = useState<Wish | null>(null);
  const [form, setForm] = useState({ name: "", relation: "", message: "", consent: false, website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const load = useCallback(async (p: number) => {
    const res = await fetch(`/api/wishes?page=${p}`);
    if (!res.ok) return;
    const data = await res.json();
    setWishes((w) => (p === 0 ? data.wishes : [...w, ...data.wishes]));
    setMore(data.more);
    setPage(p);
  }, []);
  useEffect(() => { load(0); }, [load]);

  const ref = useScene<HTMLElement>((root, q, t) => {
    if (t === "C") return;
    ScrollTrigger.batch(q(".wish:not(.is-in)"), {
      start: "top 88%", once: true,
      onEnter: (els) => {
        els.forEach((el) => el.classList.add("is-in"));
        gsap.from(els, { y: 40, autoAlpha: 0, rotation: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" });
      },
    });
  }, [wishes.length, mine?.id]);
  useEffect(() => { queueRefresh(); }, [wishes.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    const res = await fetch("/api/wishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 422) { setErrors(data.fields || {}); setState("idle"); return; }
    if (!res.ok) { setErrors({ form: data.error || "Something went wrong. Please try again." }); setState("idle"); return; }
    setMine({ id: "mine", name: form.name, relation: form.relation, message: form.message });
    setState("sent");
    if (tier !== "C") requestAnimationFrame(() => gsap.from(".wish--mine .wish-seal", { scale: 1.6, rotation: -24, autoAlpha: 0, duration: 0.55, ease: "back.out(1.6)" }));
  }

  return (
    <section ref={ref} id="wishes" className="wishes section paper" aria-labelledby="wishes-title">
      <header className="container center wishes-head">
        <p className="eyebrow" data-reveal="fade">Leave a blessing</p>
        <h2 id="wishes-title" className="script" data-reveal="up">Wishing Wall</h2>
      </header>

      <div className="container wishes-grid">
        <div className="wish-form-wrap">
          {state === "sent" ? (
            <div className="card wish-thanks" role="status">
              <p className="script script--m">Thank you</p>
              <p>Your wish will appear once {wedding.couple.bride.name} &amp; {wedding.couple.groom.name} have seen it.</p>
            </div>
          ) : (
            <form className="card wish-form" onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="wish-name">Your name *</label>
                <input id="wish-name" className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!errors.name} />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
              <div className="field">
                <label htmlFor="wish-rel">You are… <span className="hint">(optional)</span></label>
                <select id="wish-rel" className="input" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
                  <option value="">Choose one</option>
                  {RELATIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="wish-msg">Your wish *</label>
                <textarea id="wish-msg" className="input" maxLength={300} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-invalid={!!errors.message} aria-describedby="wish-count" />
                <p id="wish-count" className="hint">{300 - form.message.length} characters left</p>
                {errors.message && <p className="field-error">{errors.message}</p>}
              </div>
              <label className="wish-consent">
                <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
                <span>Show my wish publicly on this page</span>
              </label>
              {errors.consent && <p className="field-error">{errors.consent}</p>}
              <div className="hp" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label></div>
              {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
              <button className="btn btn--gold" type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my wish"}</button>
            </form>
          )}
        </div>

        <div className="wish-wall">
          {mine && (
            <article className="wish wish--mine" data-variant={0}>
              <span className="wish-seal" aria-label="Pending approval">Pending</span>
              <p className="wish-msg">“{mine.message}”</p>
              <p className="wish-by"><strong>{mine.name}</strong>{mine.relation && <span> · {mine.relation}</span>}</p>
            </article>
          )}
          {wishes.map((w) => {
            const c = corner(w.id);
            return (
              <article key={w.id} className="wish" data-variant={c.variant} style={{ "--tilt": `${c.tilt}deg` } as React.CSSProperties}>
                <p className="wish-msg">“{w.message}”</p>
                <p className="wish-by"><strong>{w.name}</strong>{w.relation && <span> · {w.relation}</span>}</p>
              </article>
            );
          })}
          {!wishes.length && !mine && <p className="wish-empty center">Be the first to leave a wish.</p>}
          {more && <button className="btn btn--ghost wish-more" type="button" onClick={() => load(page + 1)}>Read more wishes</button>}
        </div>
      </div>
    </section>
  );
}
