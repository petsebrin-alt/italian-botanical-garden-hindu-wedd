import { wedding, type WeddingEvent } from "@/content/wedding";

/** Converts a venue-local wall-clock time to a UTC instant (DST-safe). */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  let guess = Date.UTC(y, mo - 1, d, h, mi);
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(guess));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    guess += Date.UTC(y, mo - 1, d, h, mi) - asIfUtc;
  }
  return new Date(guess);
}

export const weddingInstant = () => zonedToUtc(wedding.date, wedding.time, wedding.timezone);

export function eventStart(e: WeddingEvent) {
  return zonedToUtc(e.date!, e.start!, wedding.timezone);
}

export function eventEnd(e: WeddingEvent) {
  if (e.end) {
    const end = zonedToUtc(e.date!, e.end, wedding.timezone);
    if (end > eventStart(e)) return end;
  }
  return new Date(eventStart(e).getTime() + (e.type === "ceremony" ? 3 : 4) * 3600_000);
}

const at = (date: string) => new Date(`${date}T12:00:00Z`);

export const longDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(at(date));

/** The long date in pieces, so its numbers can be set in their own face. */
export const longDateParts = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .formatToParts(at(date))
    .map((p) => ({ text: p.value, numeric: p.type === "day" || p.type === "year" }));

export const weekdayDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(at(date));

export const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" }).format(at(date)).toUpperCase();

export function clock(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" })
    .format(d)
    .replace(" am", " AM")
    .replace(" pm", " PM");
}

/** "1:30 PM in your time zone", or null when the visitor is already on venue time. */
export function localEquivalent(instant: Date): string | null {
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(instant);
  if (fmt(here) === fmt(wedding.timezone)) return null;
  const sameDay =
    new Intl.DateTimeFormat("en-CA", { timeZone: here }).format(instant) ===
    new Intl.DateTimeFormat("en-CA", { timeZone: wedding.timezone }).format(instant);
  const day = sameDay ? "" : ` (${new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: here }).format(instant)})`;
  return `${fmt(here).replace(" am", " AM").replace(" pm", " PM")}${day} in your time zone`;
}
