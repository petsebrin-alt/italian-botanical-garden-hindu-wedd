import "server-only";
import { cookies } from "next/headers";
import { hash } from "@/lib/store";

export const COOKIE = "jr_studio";

/** The studio is enabled only when STUDIO_TOKEN is set (e.g. in .env.local). */
export const studioEnabled = () => Boolean(process.env.STUDIO_TOKEN && process.env.STUDIO_TOKEN.length >= 12);

export async function isStudio() {
  if (!studioEnabled()) return false;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === hash(`studio:${process.env.STUDIO_TOKEN}`);
}
