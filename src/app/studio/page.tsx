import type { Metadata } from "next";
import { publishedEvents, wedding } from "@/content/wedding";
import { isStudio, studioEnabled } from "@/lib/studio";
import { readAll } from "@/lib/store";
import "./studio.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Studio", robots: { index: false, follow: false } };

const ERR: Record<string, string> = { token: "That studio token is not correct.", limit: "Too many attempts. Try again in 15 minutes.", auth: "Please sign in again." };

/** The couple's studio: responses, headcounts per celebration, CSV export and wish moderation. */
export default async function Studio({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  if (!studioEnabled()) {
    return (
      <main className="studio container">
        <h1 className="h2">Studio</h1>
        <p>The studio is switched off. Add <code>STUDIO_TOKEN=&lt;a long secret&gt;</code> (12+ characters) to <code>.env.local</code> and restart the server.</p>
      </main>
    );
  }
  if (!(await isStudio())) {
    return (
      <main className="studio container">
        <h1 className="h2">Studio</h1>
        <form className="card studio-login" method="post" action="/api/studio">
          <input type="hidden" name="action" value="login" />
          <div className="field">
            <label htmlFor="token">Studio token</label>
            <input id="token" name="token" type="password" className="input" autoComplete="current-password" required />
          </div>
          {e && <p className="field-error">{ERR[e] ?? "Please try again."}</p>}
          <button className="btn btn--primary" type="submit">Sign in</button>
        </form>
      </main>
    );
  }

  const [rsvps, wishes] = await Promise.all([readAll("rsvps"), readAll("wishes")]);
  const events = publishedEvents();
  const yes = rsvps.filter((r) => r.attending);
  const guests = yes.reduce((n, r) => n + r.guests, 0);
  const pending = wishes.filter((w) => w.status === "pending");

  return (
    <main className="studio container">
      <header className="studio-head">
        <div>
          <p className="eyebrow">{wedding.couple.bride.name} &amp; {wedding.couple.groom.name}</p>
          <h1 className="h2">Studio</h1>
        </div>
        <form method="post" action="/api/studio"><input type="hidden" name="action" value="logout" /><button className="btn btn--ghost" type="submit">Sign out</button></form>
      </header>

      <section className="studio-stats" aria-label="Totals">
        <div className="card"><strong>{rsvps.length}</strong><span>responses</span></div>
        <div className="card"><strong>{guests}</strong><span>guests attending</span></div>
        <div className="card"><strong>{rsvps.length - yes.length}</strong><span>declined</span></div>
        {events.map((ev) => (
          <div key={ev.id} className="card"><strong>{yes.filter((r) => r.events.includes(ev.id)).reduce((n, r) => n + r.guests, 0)}</strong><span>{ev.name}</span></div>
        ))}
      </section>

      <section aria-labelledby="rsvp-h">
        <div className="studio-row"><h2 id="rsvp-h" className="h3">Responses</h2><a className="btn btn--primary" href="/api/studio">Export CSV</a></div>
        <div className="studio-table-wrap">
          <table className="studio-table">
            <thead><tr><th>Name</th><th>Attending</th><th>Guests</th><th>Celebrations</th><th>Diet</th><th>Contact</th><th>Message</th><th>Updated</th></tr></thead>
            <tbody>
              {rsvps.length === 0 && <tr><td colSpan={8}>No responses yet.</td></tr>}
              {[...rsvps].reverse().map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td><td>{r.attending ? "Yes" : "No"}</td><td>{r.guests}</td>
                  <td>{events.filter((e) => r.events.includes(e.id)).map((e) => e.name).join(", ")}</td>
                  <td>{r.diet}</td><td>{r.contact}</td><td>{r.message}</td>
                  <td>{new Date(r.updatedAt).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="wishes" aria-labelledby="wish-h">
        <h2 id="wish-h" className="h3">Wishes <span className="hint">({pending.length} waiting)</span></h2>
        <ul className="studio-wishes" role="list">
          {wishes.length === 0 && <li>No wishes yet.</li>}
          {[...wishes].reverse().map((w) => (
            <li key={w.id} className={`card studio-wish studio-wish--${w.status}`}>
              <p>“{w.message}”</p>
              <p className="hint">{w.name}{w.relation ? ` · ${w.relation}` : ""} · {w.status}{w.pinned ? " · pinned" : ""}</p>
              <form method="post" action="/api/studio" className="studio-actions">
                <input type="hidden" name="id" value={w.id} />
                {w.status !== "approved" && <button className="btn btn--primary" name="action" value="approve">Approve</button>}
                {w.status !== "hidden" && <button className="btn btn--ghost" name="action" value="hide">Hide</button>}
                <button className="btn btn--ghost" name="action" value={w.pinned ? "unpin" : "pin"}>{w.pinned ? "Unpin" : "Pin"}</button>
                <button className="btn btn--ghost" name="action" value="delete">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
