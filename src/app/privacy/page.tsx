import type { Metadata } from "next";
import { wedding } from "@/content/wedding";

export const metadata: Metadata = { title: "Privacy", robots: { index: false, follow: false } };

export default function Privacy() {
  const { bride, groom } = wedding.couple;
  return (
    <main className="container section measure" style={{ display: "grid", gap: 18 }}>
      <p className="eyebrow">{bride.name} &amp; {groom.name}</p>
      <h1 className="h2">Privacy</h1>
      <p>This invitation collects only what you choose to send: your RSVP (name, attendance, number of guests, celebrations, dietary preference, optional contact details and message) and any wish you leave on the wishing wall.</p>
      <p>Your answers are used only by {bride.name}, {groom.name} and their families to plan the celebration. Wishes are shown publicly only after the couple approves them, and only if you ticked the consent box.</p>
      <p>We do not use tracking cookies or advertising. A hashed (non-reversible) form of your connection address is kept to limit spam. Maps load from Google only if you choose to open them.</p>
      <p>Responses and wishes are kept only for planning the wedding. To see, correct or remove yours, contact the family directly.</p>
      <p><a href="/">Back to the invitation</a></p>
    </main>
  );
}
