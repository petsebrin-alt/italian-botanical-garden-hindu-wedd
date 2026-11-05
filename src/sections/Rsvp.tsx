"use client";

import { useEffect, useRef, useState } from "react";
import { publishedEvents, wedding } from "@/content/wedding";
import { longDate } from "@/lib/dates";
import { gsap } from "@/lib/gsap";
import { useMotion } from "@/lib/motion";
import { useScene } from "@/lib/scene";
import AddToCalendar from "@/components/AddToCalendar";
import Pic, { Sprite } from "@/components/Pic";
import "./rsvp.css";

type Form = { name: string; attending: "" | "yes" | "no"; guests: number; events: string[]; diet: string; contact: string; message: string; website: string };
const DIETS = ["Vegetarian", "Jain", "Vegan", "Non-vegetarian", "Other"];
const TOKEN_KEY = "jr-rsvp-token";

/**
 * RSVP: an arched photograph of the couple beside a garden-card form, posting to /api/rsvp.
 * Replies appear in /studio; guests can return and edit theirs from the same device.
 */
export default function Rsvp() {
  const events = publishedEvents();
  const { tier } = useMotion();
  const empty: Form = { name: "", attending: "", guests: 1, events: events.map((e) => e.id), diet: "", contact: "", message: "", website: "" };
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const summary = useRef<HTMLHeadingElement>(null);
  const ref = useScene<HTMLElement>();
  const deadline = wedding.rsvp.deadline;
  const closed = Boolean(deadline) && new Date() > new Date(`${deadline}T23:59:59Z`);

  useEffect(() => {
    try { setHasToken(Boolean(localStorage.getItem(TOKEN_KEY))); } catch { /* storage unavailable */ }
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function editPrevious() {
    let token = "";
    try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch { /* ignore */ }
    if (!token) return;
    const res = await fetch(`/api/rsvp?token=${encodeURIComponent(token)}`);
    if (!res.ok) return;
    const { rsvp } = await res.json();
    setForm({ ...empty, ...rsvp, attending: rsvp.attending ? "yes" : "no", guests: rsvp.guests || 1, diet: rsvp.diet || "", contact: rsvp.contact || "", message: rsvp.message || "" });
    setStatus("idle");
  }

  function burst() {
    if (tier === "C" || !card.current) return;
    const host = card.current;
    const petals = Array.from({ length: 12 }, (_, i) => {
      const p = document.createElement("span");
      p.className = "rsvp-petal";
      p.style.background = i % 3 ? "#e8b9b4" : "#d9a5a0";
      host.appendChild(p);
      return p;
    });
    petals.forEach((p, i) => {
      const a = (i / petals.length) * Math.PI * 2;
      gsap.fromTo(p, { x: 0, y: 0, scale: 0.4, rotation: 0, autoAlpha: 1 }, {
        x: Math.cos(a) * (120 + Math.random() * 90), y: Math.sin(a) * 90 + 140, rotation: 200 + Math.random() * 200,
        scale: 1, autoAlpha: 0, duration: 1.4, ease: "power2.out", onComplete: () => p.remove(),
      });
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    setNotice("");
    let editToken = "";
    try { editToken = localStorage.getItem(TOKEN_KEY) || ""; } catch { /* ignore */ }
    try {
      const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, editToken }) });
      const data = await res.json();
      if (res.status === 422) {
        setErrors(data.fields || {});
        setStatus("idle");
        const first = Object.keys(data.fields || {})[0];
        requestAnimationFrame(() => (document.getElementById(`rsvp-${first}`) as HTMLElement | null)?.focus());
        setNotice(`${Object.keys(data.fields).length} field${Object.keys(data.fields).length > 1 ? "s need" : " needs"} attention.`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.editToken) {
        try { localStorage.setItem(TOKEN_KEY, data.editToken); setHasToken(true); } catch { /* ignore */ }
      }
      setStatus("done");
      requestAnimationFrame(() => { summary.current?.focus(); burst(); });
    } catch (err) {
      setStatus("error");
      setNotice(err instanceof Error ? err.message : "Something went wrong. Your answers are kept: please try again.");
    }
  }

  const first = form.name.trim().split(/\s+/)[0];
  const ceremony = events.find((e) => e.type === "ceremony") ?? events[0];
  const share = `https://wa.me/?text=${encodeURIComponent(`${wedding.couple.bride.name} & ${wedding.couple.groom.name} · ${longDate(wedding.date)} · ${wedding.destination.label}`)}`;

  return (
    <section ref={ref} id="rsvp" className="rsvp section paper" aria-labelledby="rsvp-title" data-stage>
      <Sprite name="canopy-l" className="rsvp-canopy rsvp-canopy--l" depth={-0.1} />
      <Sprite name="canopy-r" className="rsvp-canopy rsvp-canopy--r" depth={-0.1} />
      <Sprite name="bed-l" className="rsvp-bloom rsvp-bloom--l" depth={0.3} />
      <Sprite name="bed-r" className="rsvp-bloom rsvp-bloom--r" depth={0.3} />

      <div className="container rsvp-wrap">
        <figure className="rsvp-photo" aria-hidden="true">
          <div className="rsvp-arch arch" data-reveal="mask">
            <Pic src="/assets/img/memory-6" alt="" inner />
          </div>
          <figcaption className="rsvp-photo-cap">
            <span className="script">Be our guest</span>
            <span className="eyebrow">{longDate(wedding.date)} · {wedding.destination.label}</span>
          </figcaption>
        </figure>
        <div ref={card} className="rsvp-card" data-reveal="up">
          {status === "done" ? (
            <div className="rsvp-done" aria-live="polite">
              <h2 ref={summary} tabIndex={-1} className="script">Grazie{first ? `, ${first}` : ""}!</h2>
              <p className="rsvp-lead">
                {form.attending === "yes"
                  ? `We can't wait to celebrate with you${form.guests > 1 ? ` and your ${form.guests - 1 === 1 ? "guest" : `${form.guests - 1} guests`}` : ""}.`
                  : "We will miss you, and we are grateful for your blessings."}
              </p>
              {form.attending === "yes" && form.events.length > 0 && (
                <p className="body-s rsvp-events-summary">{events.filter((e) => form.events.includes(e.id)).map((e) => e.name).join(" · ")}</p>
              )}
              <div className="rsvp-done-actions">
                {ceremony && form.attending === "yes" && <AddToCalendar event={ceremony} variant="primary" />}
                <a className="btn btn--ghost" href={share} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
              </div>
              <button type="button" className="rsvp-link" onClick={editPrevious}>Edit my response</button>
            </div>
          ) : closed ? (
            <div className="rsvp-done">
              <h2 id="rsvp-title" className="script">RSVP</h2>
              <p className="rsvp-lead">RSVPs are now closed. Please contact the family directly.</p>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={submit} noValidate>
              <header className="rsvp-head">
                <h2 id="rsvp-title" className="script">RSVP</h2>
                <p className="rsvp-lead">We would be delighted to have you with us</p>
                {deadline && <p className="eyebrow">Kindly respond by {longDate(deadline)}</p>}
                {hasToken && <button type="button" className="rsvp-link" onClick={editPrevious}>Already replied? Load my response</button>}
              </header>

              <p className="sr-only" role="alert" aria-live="assertive">{notice}</p>

              <div className="field">
                <label htmlFor="rsvp-name">Full name *</label>
                <input id="rsvp-name" className="input" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)}
                  aria-invalid={!!errors.name} aria-describedby={errors.name ? "rsvp-name-err" : undefined} required />
                {errors.name && <p id="rsvp-name-err" className="field-error">{errors.name}</p>}
              </div>

              <fieldset className="field rsvp-choice" aria-describedby={errors.attending ? "rsvp-att-err" : undefined}>
                <legend>Will you join us? *</legend>
                <div className="rsvp-choices">
                  {(["yes", "no"] as const).map((v) => (
                    <label key={v} className={`rsvp-option${form.attending === v ? " is-on" : ""}`}>
                      <input id={v === "yes" ? "rsvp-attending" : undefined} type="radio" name="attending" value={v} checked={form.attending === v} onChange={() => set("attending", v)} />
                      <span className="rsvp-option-mark" aria-hidden="true">{form.attending === v ? "✓" : ""}</span>
                      <span>{v === "yes" ? "Joyfully accepts" : "Regretfully declines"}</span>
                    </label>
                  ))}
                </div>
                {errors.attending && <p id="rsvp-att-err" className="field-error">{errors.attending}</p>}
              </fieldset>

              {form.attending === "yes" && (
                <div className="rsvp-more">
                  <div className="field">
                    <label htmlFor="rsvp-guests">Number of guests, including you *</label>
                    <div className="stepper">
                      <button type="button" onClick={() => set("guests", Math.max(1, form.guests - 1))} aria-label="One fewer guest">−</button>
                      <input id="rsvp-guests" className="input" inputMode="numeric" value={form.guests} aria-invalid={!!errors.guests}
                        onChange={(e) => set("guests", Math.max(1, Math.min(wedding.rsvp.maxGuests, Number(e.target.value.replace(/\D/g, "")) || 1)))} />
                      <button type="button" onClick={() => set("guests", Math.min(wedding.rsvp.maxGuests, form.guests + 1))} aria-label="One more guest">+</button>
                    </div>
                    {errors.guests && <p className="field-error">{errors.guests}</p>}
                  </div>

                  {wedding.rsvp.askEvents && events.length > 1 && (
                    <fieldset className="field">
                      <legend>Which celebrations will you attend?</legend>
                      <div className="rsvp-chips">
                        {events.map((ev) => {
                          const on = form.events.includes(ev.id);
                          return (
                            <label key={ev.id} className={`chip rsvp-chip${on ? " is-on" : ""}`}>
                              <input type="checkbox" checked={on} onChange={() => set("events", on ? form.events.filter((x) => x !== ev.id) : [...form.events, ev.id])} />
                              {ev.name}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {wedding.rsvp.askDiet && (
                    <div className="field">
                      <label htmlFor="rsvp-diet">Dietary preference</label>
                      <select id="rsvp-diet" className="input" value={form.diet} onChange={(e) => set("diet", e.target.value)}>
                        <option value="">No preference</option>
                        {DIETS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="field">
                <label htmlFor="rsvp-contact">Email or phone <span className="hint">(optional, for updates)</span></label>
                <input id="rsvp-contact" className="input" autoComplete="email" value={form.contact} onChange={(e) => set("contact", e.target.value)}
                  aria-invalid={!!errors.contact} aria-describedby={errors.contact ? "rsvp-contact-err" : undefined} />
                {errors.contact && <p id="rsvp-contact-err" className="field-error">{errors.contact}</p>}
              </div>

              <div className="field">
                <label htmlFor="rsvp-message">A message for the couple <span className="hint">(optional)</span></label>
                <textarea id="rsvp-message" className="input" maxLength={500} value={form.message} onChange={(e) => set("message", e.target.value)} aria-describedby="rsvp-count" />
                <p id="rsvp-count" className="hint">{500 - form.message.length} characters left</p>
              </div>

              <div className="hp" aria-hidden="true">
                <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set("website", e.target.value)} /></label>
              </div>

              {status === "error" && <p className="field-error" role="alert">{notice}</p>}
              <button className="btn btn--primary rsvp-submit" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : "Send RSVP"}
              </button>
              <p className="hint rsvp-privacy">We only use your details to plan the celebration. <a href="/privacy">Privacy</a></p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
