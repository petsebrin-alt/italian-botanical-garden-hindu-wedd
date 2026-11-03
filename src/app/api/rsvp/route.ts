import { publishedEvents, wedding } from "@/content/wedding";
import { clean, clientIp, getStore, hash, newId, newToken, storeError, type Rsvp } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (fields: Record<string, string>) => Response.json({ ok: false, fields }, { status: 422 });

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  // honeypot: real guests never see this field
  if (clean(body.website, 200)) return Response.json({ ok: true, summary: null });

  if (wedding.rsvp.deadline && new Date() > new Date(`${wedding.rsvp.deadline}T23:59:59Z`)) {
    return Response.json({ ok: false, error: "RSVPs are now closed." }, { status: 410 });
  }

  const name = clean(body.name, 80);
  const attending = body.attending === "yes" ? true : body.attending === "no" ? false : null;
  const guests = Number(body.guests);
  const valid = new Set(publishedEvents().map((e) => e.id));
  const events = Array.isArray(body.events) ? body.events.map(String).filter((e) => valid.has(e)) : [];
  const contact = clean(body.contact, 120);
  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Please enter your full name.";
  if (attending === null) fields.attending = "Please let us know if you can join us.";
  if (attending && (!Number.isInteger(guests) || guests < 1 || guests > wedding.rsvp.maxGuests)) fields.guests = `Choose between 1 and ${wedding.rsvp.maxGuests} guests.`;
  if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^\+?[\d\s()-]{7,20}$/.test(contact)) fields.contact = "Enter an email address or a phone number.";
  if (Object.keys(fields).length) return bad(fields);

  const record = {
    name, attending: attending!, guests: attending ? guests : 0, events: attending ? events : [],
    diet: attending ? clean(body.diet, 40) || undefined : undefined,
    contact: contact || undefined, message: clean(body.message, 500) || undefined,
  };
  const now = new Date().toISOString();
  const editToken = clean(body.editToken, 64);

  try {
    const store = await getStore();
    const ipHash = hash(clientIp(req));
    if (!(await store.hit(`rsvp:${ipHash}`, 8, 60 * 60 * 1000))) {
      return Response.json({ ok: false, error: "Too many responses from this connection. Please try again later." }, { status: 429 });
    }
    // the same guest updating: by their private edit token, or by name + contact
    const existing = (editToken && (await store.findRsvpByToken(hash(editToken)))) || (contact && (await store.findRsvpByIdentity(name, contact))) || null;
    if (existing) {
      await store.updateRsvp(existing.id, record, now);
      return Response.json({ ok: true, updated: true, editToken: editToken || null, summary: record });
    }
    const token = newToken();
    const row: Rsvp = { id: newId(), ...record, editTokenHash: hash(token), ipHash, createdAt: now, updatedAt: now };
    await store.insertRsvp(row);
    return Response.json({ ok: true, updated: false, editToken: token, summary: record });
  } catch (e) {
    return storeError(e);
  }
}

/** Lets a guest reload their own response with the private token kept on their device. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return Response.json({ ok: false }, { status: 400 });
  try {
    const row = await (await getStore()).findRsvpByToken(hash(token));
    if (!row) return Response.json({ ok: false }, { status: 404 });
    const { name, attending, guests, events, diet, contact, message } = row;
    return Response.json({ ok: true, rsvp: { name, attending, guests, events, diet, contact, message } });
  } catch (e) {
    return storeError(e);
  }
}
