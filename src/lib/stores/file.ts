import { promises as fs } from "fs";
import path from "path";
import type { Rsvp, Store, Wish } from "./types";

/**
 * Local development storage: one JSON file per collection, written atomically
 * (temp file + rename) through a single queue. Not for hosting: serverless disks
 * are read-only or wiped, which is why production uses the Postgres store.
 */
export function createFileStore(dir: string): Store {
  type Collections = { rsvps: Rsvp; wishes: Wish };
  const file = (c: keyof Collections) => path.join(dir, `${c}.json`);
  let queue: Promise<unknown> = Promise.resolve();

  async function readAll<C extends keyof Collections>(c: C): Promise<Collections[C][]> {
    try {
      return JSON.parse(await fs.readFile(file(c), "utf8"));
    } catch {
      return [];
    }
  }

  function mutate<C extends keyof Collections>(c: C, fn: (rows: Collections[C][]) => void): Promise<void> {
    const run = queue.then(async () => {
      await fs.mkdir(dir, { recursive: true });
      const rows = await readAll(c);
      fn(rows);
      const tmp = `${file(c)}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(rows, null, 2));
      await fs.rename(tmp, file(c));
    });
    queue = run.catch(() => undefined);
    return run;
  }

  const order = (a: Wish, b: Wish) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt);
  const hits = new Map<string, number[]>();

  return {
    kind: "file",
    findRsvpByToken: async (h) => (await readAll("rsvps")).find((r) => r.editTokenHash === h) ?? null,
    findRsvpByIdentity: async (name, contact) =>
      (await readAll("rsvps")).find((r) => r.name.toLowerCase() === name.toLowerCase() && r.contact === contact) ?? null,
    insertRsvp: (row) => mutate("rsvps", (rows) => { rows.push(row); }),
    updateRsvp: (id, fields, updatedAt) => mutate("rsvps", (rows) => {
      const r = rows.find((x) => x.id === id);
      if (r) Object.assign(r, fields, { updatedAt });
    }),
    listRsvps: () => readAll("rsvps"),
    insertWish: (row) => mutate("wishes", (rows) => { rows.push(row); }),
    async listWishes({ approvedOnly, offset = 0, limit }) {
      const all = (await readAll("wishes")).filter((w) => !approvedOnly || w.status === "approved").sort(order);
      const end = limit === undefined ? all.length : offset + limit;
      return { wishes: all.slice(offset, end), more: all.length > end, total: all.length };
    },
    updateWish: (id, patch) => mutate("wishes", (rows) => {
      const w = rows.find((x) => x.id === id);
      if (w) Object.assign(w, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)));
    }),
    deleteWish: (id) => mutate("wishes", (rows) => {
      const i = rows.findIndex((x) => x.id === id);
      if (i >= 0) rows.splice(i, 1);
    }),
    // per-process sliding window: enough for one dev server
    async hit(key, limit, windowMs) {
      const now = Date.now();
      const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
      if (list.length >= limit) return false;
      list.push(now);
      hits.set(key, list);
      return true;
    },
  };
}
