// Storage contract: the same checks run against the local file store and the
// Postgres store (on PGlite, a real Postgres engine in-process).  npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { createPostgresStore } from "../src/lib/stores/postgres.ts";
import { createFileStore } from "../src/lib/stores/file.ts";

const t0 = Date.parse("2026-11-03T10:00:00Z");
const at = (min) => new Date(t0 + min * 60_000).toISOString();
const rsvp = (id, extra = {}) => ({
  id, name: "Simran Kaur", attending: true, guests: 2, events: ["mehendi", "ceremony"], diet: "Vegetarian",
  contact: "simran@example.com", message: "So happy!", editTokenHash: `tok-${id}`, ipHash: "ip", createdAt: at(0), updatedAt: at(0), ...extra,
});
const wish = (id, min, extra = {}) => ({ id, name: `Guest ${id}`, message: "Wishing you a lifetime of love", status: "pending", ipHash: "ip", createdAt: at(min), ...extra });

async function contract(store) {
  // RSVPs
  await store.insertRsvp(rsvp("a"));
  await store.insertRsvp(rsvp("b", { name: "Luca", contact: undefined, diet: undefined, message: undefined, editTokenHash: "tok-b", createdAt: at(5), updatedAt: at(5) }));
  assert.equal((await store.findRsvpByToken("tok-a")).name, "Simran Kaur");
  assert.equal(await store.findRsvpByToken("nope"), null);
  assert.equal((await store.findRsvpByIdentity("simran KAUR", "simran@example.com")).id, "a", "identity match ignores case");
  assert.equal(await store.findRsvpByIdentity("Simran Kaur", "other@example.com"), null);

  const b = await store.findRsvpByToken("tok-b");
  assert.equal(b.contact, undefined, "missing optional fields come back undefined");
  assert.equal(b.diet, undefined);

  await store.updateRsvp("a", { name: "Simran Kaur", attending: false, guests: 0, events: [], contact: "simran@example.com" }, at(9));
  const a = await store.findRsvpByToken("tok-a");
  assert.equal(a.attending, false);
  assert.deepEqual(a.events, []);
  assert.equal(a.updatedAt, at(9));
  assert.equal(a.createdAt, at(0), "update keeps the original submission time");
  assert.deepEqual((await store.listRsvps()).map((r) => r.id), ["a", "b"], "oldest first");

  // wishes
  for (let i = 1; i <= 14; i++) await store.insertWish(wish(`w${i}`, i));
  assert.equal((await store.listWishes({ approvedOnly: true })).wishes.length, 0, "pending wishes are never public");
  for (let i = 1; i <= 13; i++) await store.updateWish(`w${i}`, { status: "approved" });
  await store.updateWish("w2", { pinned: true });
  const w2 = (await store.listWishes({ approvedOnly: false })).wishes.find((w) => w.id === "w2");
  assert.equal(w2.status, "approved", "pinning keeps the status");

  const page0 = await store.listWishes({ approvedOnly: true, offset: 0, limit: 12 });
  assert.equal(page0.wishes.length, 12);
  assert.equal(page0.more, true);
  assert.equal(page0.wishes[0].id, "w2", "pinned first");
  assert.equal(page0.wishes[1].id, "w13", "then newest first");
  const page1 = await store.listWishes({ approvedOnly: true, offset: 12, limit: 12 });
  assert.deepEqual(page1.wishes.map((w) => w.id), ["w1"]);
  assert.equal(page1.more, false);

  await store.updateWish("w13", { status: "hidden" });
  await store.deleteWish("w12");
  const visible = (await store.listWishes({ approvedOnly: true })).wishes.map((w) => w.id);
  assert.ok(!visible.includes("w13") && !visible.includes("w12"));
  assert.equal((await store.listWishes({ approvedOnly: false })).wishes.length, 13, "hidden wishes stay in the studio");

  // rate limiting
  for (let i = 0; i < 3; i++) assert.equal(await store.hit("wish:x", 3, 3_600_000), true);
  assert.equal(await store.hit("wish:x", 3, 3_600_000), false, "fourth request in the window is refused");
  assert.equal(await store.hit("wish:y", 3, 3_600_000), true, "keys are independent");
}

test("file store", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jr-store-"));
  try {
    await contract(createFileStore(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("postgres store (PGlite)", async () => {
  const pg = await PGlite.create();
  const db = { query: (text, params) => pg.query(text, params), exec: (sql) => pg.exec(sql) };
  await contract(createPostgresStore(db));
  // the schema is safe to apply again (every cold start does)
  await createPostgresStore(db).listRsvps();
  const tables = (await pg.query("select table_name from information_schema.tables where table_schema = 'public' order by 1")).rows.map((r) => r.table_name);
  assert.deepEqual(tables, ["rate_limits", "rsvps", "wishes"]);
  await pg.close();
});
