import type { WeddingEvent } from "@/content/wedding";
import { googleLink, outlookLink } from "@/lib/calendar";

/** A <details> menu: keyboard-accessible without scripts, closes on Escape via the browser. */
export default function AddToCalendar({ event, label = "Add to calendar", variant = "gold", align = "center" }: {
  event: WeddingEvent; label?: string; variant?: "gold" | "ghost" | "primary"; align?: "center" | "start";
}) {
  return (
    <details className={`atc atc--${align}`}>
      <summary className={`btn btn--${variant}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" /><path d="M1.5 6.5h13M5 1v3M11 1v3" />
        </svg>
        {label}
      </summary>
      <ul className="atc-menu card" role="list">
        <li><a href={`/calendar/${event.id}`} download={`${event.id}.ics`}>Apple / iCal (.ics)</a></li>
        <li><a href={googleLink(event)} target="_blank" rel="noopener noreferrer">Google Calendar</a></li>
        <li><a href={outlookLink(event)} target="_blank" rel="noopener noreferrer">Outlook.com</a></li>
        <li><a href={outlookLink(event, true)} target="_blank" rel="noopener noreferrer">Office 365</a></li>
        <li><a href="/calendar/all" download="janvi-rohit-wedding.ics">All celebrations (.ics)</a></li>
      </ul>
    </details>
  );
}
