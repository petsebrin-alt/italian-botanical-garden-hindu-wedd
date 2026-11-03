import { clean, clientIp, getStore, hash, newId, storeError } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 12;

/** Approved wishes only: pending ones are never readable from the public site. */
export async function GET(req: Request) {
  const page = Math.max(0, Number(new URL(req.url).searchParams.get("page") || 0) || 0);
  try {
    const { wishes, more } = await (await getStore()).listWishes({ approvedOnly: true, offset: page * PAGE, limit: PAGE });
    return Response.json({ ok: true, wishes: wishes.map(({ id, name, relation, message, pinned }) => ({ id, name, relation, message, pinned })), more });
  } catch (e) {
    return storeError(e);
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (clean(body.website, 200)) return Response.json({ ok: true });
  const name = clean(body.name, 60);
  const message = clean(body.message, 300);
  const fields: Record<string, string> = {};
  if (name.length < 2) fields.name = "Please add your name.";
  if (message.length < 10) fields.message = "Please write a few words (at least 10 characters).";
  if (body.consent !== true) fields.consent = "Please confirm your wish may be shown on this page.";
  if (Object.keys(fields).length) return Response.json({ ok: false, fields }, { status: 422 });

  try {
    const store = await getStore();
    const ipHash = hash(clientIp(req));
    if (!(await store.hit(`wish:${ipHash}`, 3, 60 * 60 * 1000))) {
      return Response.json({ ok: false, error: "You have shared several wishes already. Please try again later." }, { status: 429 });
    }
    await store.insertWish({ id: newId(), name, relation: clean(body.relation, 40) || undefined, message, status: "pending", ipHash, createdAt: new Date().toISOString() });
    return Response.json({ ok: true });
  } catch (e) {
    return storeError(e);
  }
}
