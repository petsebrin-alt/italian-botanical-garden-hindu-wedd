import type { Rsvp, RsvpFields, Store, Wish } from "./types";

/**
 * Postgres storage for RSVPs, wishes and rate limits. Works with any Postgres
 * (Neon, Supabase, RDS…). It takes anything with pg's `query(text, params)`, so
 * tests can run it on PGlite. Only type imports here, so the file runs as-is.
 */
export interface Db {
  query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  /** runs several statements at once (pg: simple query protocol; PGlite: exec) */
  exec(sql: string): Promise<unknown>;
}

/** Created automatically on the first request; safe to run again or by hand (e.g. Supabase SQL editor). */
export const SCHEMA = `
begin;
select pg_advisory_xact_lock(hashtext('jr_wedding_schema'));
create table if not exists rsvps (
  id text primary key,
  name text not null,
  attending boolean not null,
  guests integer not null default 0,
  events text[] not null default '{}',
  diet text,
  contact text,
  message text,
  edit_token_hash text not null unique,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rsvps_identity_idx on rsvps (lower(name), contact);
create table if not exists wishes (
  id text primary key,
  name text not null,
  relation text,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  pinned boolean not null default false,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists wishes_listing_idx on wishes (status, pinned desc, created_at desc);
create table if not exists rate_limits (
  key text not null,
  window_start bigint not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
commit;
`;

const iso = (v: unknown) => new Date(v as string).toISOString();
const opt = (v: unknown) => (v === null || v === undefined ? undefined : String(v));

function toRsvp(r: Record<string, unknown>): Rsvp {
  return {
    id: String(r.id), name: String(r.name), attending: Boolean(r.attending), guests: Number(r.guests),
    events: (r.events as string[]) ?? [], diet: opt(r.diet), contact: opt(r.contact), message: opt(r.message),
    editTokenHash: String(r.edit_token_hash), ipHash: String(r.ip_hash), createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
  };
}

function toWish(r: Record<string, unknown>): Wish {
  return {
    id: String(r.id), name: String(r.name), relation: opt(r.relation), message: String(r.message),
    status: r.status as Wish["status"], pinned: Boolean(r.pinned), ipHash: String(r.ip_hash), createdAt: iso(r.created_at),
  };
}

export function createPostgresStore(db: Db): Store {
  let ready: Promise<unknown> | null = null;
  const rows = async (text: string, params: unknown[] = []) => {
    // a failed migration (database briefly unreachable) is retried on the next request
    ready ??= db.exec(SCHEMA).catch((e) => { ready = null; throw e; });
    await ready;
    return (await db.query(text, params)).rows;
  };

  return {
    kind: "postgres",

    async findRsvpByToken(editTokenHash) {
      const [r] = await rows("select * from rsvps where edit_token_hash = $1 limit 1", [editTokenHash]);
      return r ? toRsvp(r) : null;
    },

    async findRsvpByIdentity(name, contact) {
      const [r] = await rows("select * from rsvps where lower(name) = lower($1) and contact = $2 order by created_at limit 1", [name, contact]);
      return r ? toRsvp(r) : null;
    },

    async insertRsvp(x) {
      await rows(
        `insert into rsvps (id, name, attending, guests, events, diet, contact, message, edit_token_hash, ip_hash, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [x.id, x.name, x.attending, x.guests, x.events, x.diet ?? null, x.contact ?? null, x.message ?? null, x.editTokenHash, x.ipHash, x.createdAt, x.updatedAt],
      );
    },

    async updateRsvp(id, f: RsvpFields, updatedAt) {
      await rows(
        `update rsvps set name = $2, attending = $3, guests = $4, events = $5, diet = $6, contact = $7, message = $8, updated_at = $9
         where id = $1`,
        [id, f.name, f.attending, f.guests, f.events, f.diet ?? null, f.contact ?? null, f.message ?? null, updatedAt],
      );
    },

    async listRsvps() {
      return (await rows("select * from rsvps order by created_at")).map(toRsvp);
    },

    async insertWish(w) {
      await rows(
        "insert into wishes (id, name, relation, message, status, pinned, ip_hash, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8)",
        [w.id, w.name, w.relation ?? null, w.message, w.status, Boolean(w.pinned), w.ipHash, w.createdAt],
      );
    },

    async listWishes({ approvedOnly, offset = 0, limit }) {
      // one extra row tells whether there is another page
      const found = await rows(
        `select * from wishes where ($1::boolean = false or status = 'approved')
         order by pinned desc, created_at desc offset $2 limit $3`,
        [approvedOnly, offset, limit === undefined ? null : limit + 1],
      );
      const more = limit !== undefined && found.length > limit;
      return { wishes: (more ? found.slice(0, limit) : found).map(toWish), more };
    },

    async updateWish(id, patch) {
      await rows("update wishes set status = coalesce($2, status), pinned = coalesce($3, pinned) where id = $1",
        [id, patch.status ?? null, patch.pinned ?? null]);
    },

    async deleteWish(id) {
      await rows("delete from wishes where id = $1", [id]);
    },

    async hit(key, limit, windowMs) {
      const start = Math.floor(Date.now() / windowMs) * windowMs;
      const [r] = await rows(
        `insert into rate_limits (key, window_start, hits) values ($1, $2, 1)
         on conflict (key, window_start) do update set hits = rate_limits.hits + 1
         returning hits`,
        [key, start],
      );
      if (Math.random() < 0.02) await rows("delete from rate_limits where window_start < $1", [Date.now() - 2 * 86_400_000]);
      return Number(r.hits) <= limit;
    },
  };
}
