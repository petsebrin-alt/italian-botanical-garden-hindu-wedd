import "server-only";
import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

/**
 * Minimal durable store: one JSON file per collection under DATA_DIR (default ./data).
 * Writes are serialised and atomic (temp file + rename). Swap this module for a
 * Supabase/Postgres adapter in production; the API routes only use these functions.
 */
const DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export interface Rsvp {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  events: string[];
  diet?: string;
  contact?: string;
  message?: string;
  editTokenHash: string;
  ipHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wish {
  id: string;
  name: string;
  relation?: string;
  message: string;
  status: "pending" | "approved" | "hidden";
  pinned?: boolean;
  ipHash: string;
  createdAt: string;
}

type Collections = { rsvps: Rsvp; wishes: Wish };

const file = (c: keyof Collections) => path.join(DIR, `${c}.json`);
let queue: Promise<unknown> = Promise.resolve();

export async function readAll<C extends keyof Collections>(c: C): Promise<Collections[C][]> {
  try {
    return JSON.parse(await fs.readFile(file(c), "utf8"));
  } catch {
    return [];
  }
}

export function mutate<C extends keyof Collections, R>(c: C, fn: (rows: Collections[C][]) => R): Promise<R> {
  const run = queue.then(async () => {
    await fs.mkdir(DIR, { recursive: true });
    const rows = await readAll(c);
    const result = fn(rows);
    const tmp = `${file(c)}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
    await fs.rename(tmp, file(c));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

const SALT = process.env.HASH_SALT || "janvi-rohit-2027";
export const hash = (v: string) => createHash("sha256").update(SALT + v).digest("hex");
export const newId = () => randomBytes(9).toString("base64url");
export const newToken = () => randomBytes(24).toString("base64url");

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

const hits = new Map<string, number[]>();
/** Sliding-window limiter, per process. Returns false when the caller is over the limit. */
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) return false;
  list.push(now);
  hits.set(key, list);
  return true;
}

export const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "";
