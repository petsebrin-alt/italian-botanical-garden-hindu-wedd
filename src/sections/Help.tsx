"use client";

import { wedding } from "@/content/wedding";
import { useScene } from "@/lib/scene";
import "./help.css";

type Contact = (typeof wedding.help.contacts)[number];

/** "+91 98765 43210" → "+919876543210" (for tel: and wa.me links). */
const digits = (p: string) => p.replace(/[^\d+]/g, "");
/** The small tilts and heights the three cards are pinned at, like notes on a board. */
const TILT = [-2.2, 1.6, -1.2];
const RISE = [0, 14, -6];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 6.9 6.9l1.3-2 4 1.6V19a1.8 1.8 0 0 1-1.9 1.8A16 16 0 0 1 3.2 5.9 1.8 1.8 0 0 1 5 4Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5Z" />
      <path d="M9 8.6c0 3.4 2.9 6.4 6.3 6.4l.9-1.5-1.8-.9-.8.8a4.6 4.6 0 0 1-2.7-2.7l.8-.8-.9-1.8L9 8.6Z" strokeWidth="1.2" />
    </svg>
  );
}

/** One contact card. */
function Card({ c, k }: { c: Contact; k: number }) {
  const name = c.name.replace(/^\[|\]$/g, "");
  const initial = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, "").charAt(0).toUpperCase();
  const tel = digits(c.phone);
  // (WhatsApp goes to its own number when one is given, otherwise to the phone number)
  const wa = digits(c.whatsapp || c.phone).replace(/^\+/, "");
  const ready = tel.replace(/\D/g, "").length >= 6;
  const style = { "--tilt": `${TILT[k % TILT.length]}deg`, "--rise": `${RISE[k % RISE.length]}px` } as React.CSSProperties;
  return (
    <li className="help-card" style={style} data-item>
      <div className="help-card-who">
        <span className="help-mono" aria-hidden="true">{initial}</span>
        <span className="help-card-names">
          <span className="help-card-side">{c.side}</span>
          <span className="help-card-name">{name}</span>
          <span className="help-card-role">{c.role}</span>
        </span>
      </div>
      <span className="help-card-rule" aria-hidden="true" />
      <p className={`help-card-phone${ready ? "" : " is-soon"}`}>{ready ? c.phone : "Number coming soon"}</p>
      <div className="help-card-actions">
        {ready ? (
          <>
            <a className="help-btn help-btn--call" href={`tel:${tel}`} aria-label={`Call ${name}`}><PhoneIcon />Call</a>
            <a className="help-btn help-btn--wa" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${name}`}><ChatIcon />WhatsApp</a>
          </>
        ) : (
          <>
            <span className="help-btn help-btn--call is-off"><PhoneIcon />Call</span>
            <span className="help-btn help-btn--wa is-off"><ChatIcon />WhatsApp</span>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Need help? Three cards (the groom's family, the bride's family, the event coordinator), each
 * with a number to call or message on WhatsApp. All three stand together in a row (one under
 * another on phones), pinned at small tilts like notes on a board, and rise in one after another
 * as the section comes into view; a card the pointer (or a tap, or the keyboard) is on
 * straightens, lifts and turns forest green.
 */
export default function Help() {
  const { contacts } = wedding.help;
  const ref = useScene<HTMLElement>();

  return (
    <section ref={ref} id="help" className="help section paper" aria-labelledby="help-title" data-stage>
      <header className="container center help-head">
        <p className="eyebrow" data-reveal="fade">We&rsquo;re here for you</p>
        <h2 id="help-title" className="script" data-reveal="up">Need Help?</h2>
        <p className="body-s help-sub" data-reveal="fade">Questions about travel, the celebrations or anything at all? Call or message the families, or our event coordinator.</p>
      </header>

      <ul className="help-cards" role="list" data-reveal="stagger">
        {contacts.map((c, i) => <Card key={i} c={c} k={i} />)}
      </ul>
    </section>
  );
}
