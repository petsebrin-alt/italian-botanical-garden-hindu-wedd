import { timingSafeEqual } from "crypto";
import { publishedEvents } from "@/content/wedding";
import { COOKIE, isStudio, studioEnabled } from "@/lib/studio";
import { allow, clientIp, hash, mutate, readAll } from "@/lib/store";

export const runtime = "nodejs";

const back = (req: Request, q = "", cookie?: string) => {
  const headers = new Headers({ Location: new URL(`/studio${q}`, req.url).toString() });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
};

/** Login, logout and wish moderation, all as plain form posts from /studio. */
export async function POST(req: Request) {
  const form = await req.formData();
  const action = String(form.get("action") || "");

  if (action === "login") {
    if (!studioEnabled()) return back(req);
    if (!allow(`studio:${hash(clientIp(req))}`, 10, 15 * 60 * 1000)) return back(req, "?e=limit");
    const given = Buffer.from(String(form.get("token") || ""));
    const want = Buffer.from(process.env.STUDIO_TOKEN!);
    if (given.length !== want.length || !timingSafeEqual(given, want)) return back(req, "?e=token");
    const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
    return back(req, "", `${COOKIE}=${hash(`studio:${process.env.STUDIO_TOKEN}`)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${secure}`);
  }
  if (!(await isStudio())) return back(req, "?e=auth");

  if (action === "logout") return back(req, "", `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  const id = String(form.get("id") || "");
  if (["approve", "hide", "pin", "unpin", "delete"].includes(action)) {
    await mutate("wishes", (rows) => {
      const i = rows.findIndex((w) => w.id === id);
      if (i < 0) return;
      if (action === "delete") rows.splice(i, 1);
      else if (action === "approve") rows[i].status = "approved";
      else if (action === "hide") rows[i].status = "hidden";
      else rows[i].pinned = action === "pin";
    });
  }
  return back(req, "#wishes");
}

/** CSV export of every RSVP (UTF-8 with BOM so Excel keeps non-Latin names intact). */
export async function GET(req: Request) {
  if (!(await isStudio())) return back(req, "?e=auth");
  const events = publishedEvents();
  const rows = await readAll("rsvps");
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Name", "Attending", "Guests", ...events.map((e) => e.name), "Diet", "Contact", "Message", "Submitted", "Updated"];
  const lines = rows.map((r) => [r.name, r.attending ? "Yes" : "No", r.guests, ...events.map((e) => (r.events.includes(e.id) ? "Yes" : "")), r.diet, r.contact, r.message, r.createdAt, r.updatedAt].map(cell).join(","));
  return new Response("﻿" + [head.map(cell).join(","), ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="rsvps.csv"', "Cache-Control": "no-store" },
  });
}
