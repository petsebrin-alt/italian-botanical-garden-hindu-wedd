"use client";

import { wedding } from "@/content/wedding";
import { useScene } from "@/lib/scene";
import { Sprite } from "@/components/Pic";
import "./help.css";

const digits = (p: string) => p.replace(/[^\d+]/g, "");

/** Need help? The questions guests ask most, and the family to call. */
export default function Help() {
  const { faqs, contacts } = wedding.help;
  const reachable = contacts.filter((c) => c.phone.trim());
  const ref = useScene<HTMLElement>();

  return (
    <section ref={ref} id="help" className="help section paper" aria-labelledby="help-title" data-stage>
      <Sprite name="strand-1" className="hang hang--r sway" depth={-0.18} />
      <header className="container center help-head">
        <p className="eyebrow" data-reveal="fade">Questions &amp; answers</p>
        <h2 id="help-title" className="script" data-reveal="up">Need Help?</h2>
        <p className="body-s help-sub" data-reveal="fade">Everything guests usually ask. If your question isn&rsquo;t here, the family is happy to help.</p>
      </header>

      <div className="container help-grid">
        <div className="help-faqs" data-reveal="stagger">
          {faqs.map((f, i) => (
            <details key={f.q} className="help-faq" data-item open={i === 0}>
              <summary>
                <span className="help-q">{f.q}</span>
                <span className="help-toggle" aria-hidden="true" />
              </summary>
              <div className="help-a">
                <p className="body-s">{f.a}</p>
                {f.link && <a className="help-link" href={f.link.href}>{f.link.label} →</a>}
              </div>
            </details>
          ))}
        </div>

        <aside className="help-contact" data-reveal="up">
          <h3 className="help-contact-title names">Talk to the family</h3>
          {reachable.length ? (
            <ul className="help-people" role="list">
              {reachable.map((c) => (
                <li key={c.name} className="help-person">
                  <span className="help-person-name">{c.name.replace(/^\[|\]$/g, "")}</span>
                  <span className="body-s help-person-role">{c.role}</span>
                  <span className="help-person-actions">
                    <a className="btn btn--primary" href={`tel:${digits(c.phone)}`}>Call</a>
                    <a className="btn btn--ghost" href={`https://wa.me/${digits(c.phone).replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="body-s help-soon">The family&rsquo;s phone numbers will be added here soon. Until then, your RSVP message reaches Janvi and Rohit directly.</p>
          )}
          <a className="btn btn--gold help-rsvp" href="#rsvp">RSVP</a>
        </aside>
      </div>
    </section>
  );
}
