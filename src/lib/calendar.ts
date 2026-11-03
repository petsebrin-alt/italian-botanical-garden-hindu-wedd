import { publishedEvents, wedding, type WeddingEvent } from "@/content/wedding";
import { eventEnd, eventStart } from "@/lib/dates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
const couple = `${wedding.couple.bride.name} & ${wedding.couple.groom.name}`;

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function location(e?: WeddingEvent) {
  const v = wedding.venue;
  const place = v.name ? `${v.name}${v.address ? ", " + v.address : ""}` : wedding.destination.label;
  return e?.area && !e.area.startsWith("[") ? `${e.area}, ${place}` : place;
}

export function summary(e: WeddingEvent) {
  return `${couple} · ${e.name}`;
}

function vevent(e: WeddingEvent) {
  return [
    "BEGIN:VEVENT",
    `UID:${e.id}-${wedding.date}@janvi-rohit`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(eventStart(e))}`,
    `DTEND:${stamp(eventEnd(e))}`,
    `SUMMARY:${esc(summary(e))}`,
    `LOCATION:${esc(location(e))}`,
    `DESCRIPTION:${esc((e.description ?? "") + "\n" + SITE)}`,
    `URL:${SITE}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(summary(e))} is tomorrow`,
    "END:VALARM",
    "END:VEVENT",
  ];
}

/** RFC 5545 calendar for one event, or every published event when id = "all". */
export function ics(id: string): string | null {
  const list = id === "all" ? publishedEvents() : publishedEvents().filter((e) => e.id === id);
  if (!list.length) return null;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Janvi & Rohit//Wedding//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    ...list.flatMap(vevent), "END:VCALENDAR"];
  // fold long lines at 75 octets as the RFC asks
  return lines.map((l) => (l.length > 74 ? l.match(/.{1,73}/g)!.join("\r\n ") : l)).join("\r\n") + "\r\n";
}

export function googleLink(e: WeddingEvent) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: summary(e),
    dates: `${stamp(eventStart(e))}/${stamp(eventEnd(e))}`,
    details: `${e.description ?? ""}\n${SITE}`,
    location: location(e),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export function outlookLink(e: WeddingEvent, office = false) {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: summary(e),
    startdt: eventStart(e).toISOString(),
    enddt: eventEnd(e).toISOString(),
    body: `${e.description ?? ""} ${SITE}`,
    location: location(e),
  });
  return `https://${office ? "outlook.office.com" : "outlook.live.com"}/calendar/0/action/compose?${p}`;
}
