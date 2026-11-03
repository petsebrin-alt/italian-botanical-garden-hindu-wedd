import "server-only";
import { createHash, randomBytes } from "crypto";
import path from "path";
import type { Store } from "./stores/types";

export type { Rsvp, Wish } from "./stores/types";

/**
 * Picks the storage for RSVPs, wishes and rate limits:
 *   DATABASE_URL (or POSTGRES_URL) set  → Postgres (Neon, Supabase, any host)
 *   otherwise, on Vercel                → refuse: its disk can't keep data
 *   otherwise                           → JSON files in DATA_DIR (default ./data), for local development
 */
let store: Store | null = null;

export class StoreUnavailable extends Error {}

export async function getStore(): Promise<Store> {
  if (store) return store;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const [{ Pool }, { createPostgresStore }] = await Promise.all([import("pg"), import("./stores/postgres")]);
    const pool = new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
    pool.on("error", (e) => console.error("[store] idle database connection failed:", e.message));
    store = createPostgresStore({
      query: async (text, params) => ({ rows: (await pool.query(text, params)).rows }),
      exec: (sql) => pool.query(sql),
    });
  } else if (process.env.VERCEL) {
    throw new StoreUnavailable("DATABASE_URL is not set. On Vercel, RSVPs and wishes need a hosted Postgres database.");
  } else {
    const { createFileStore } = await import("./stores/file");
    store = createFileStore(process.env.DATA_DIR || path.join(process.cwd(), "data"));
  }
  return store;
}

/** The answer guests see when storage is down or not configured; details go to the server log. */
export function storeError(e: unknown) {
  console.error("[store]", e instanceof Error ? e.message : e);
  return Response.json(
    { ok: false, error: "We couldn't save that just now. Please try again in a few minutes." },
    { status: 503 },
  );
}

const SALT = process.env.HASH_SALT || "janvi-rohit-2027";
export const hash = (v: string) => createHash("sha256").update(SALT + v).digest("hex");
export const newId = () => randomBytes(9).toString("base64url");
export const newToken = () => randomBytes(24).toString("base64url");

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

export const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "";
