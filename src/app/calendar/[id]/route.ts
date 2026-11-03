import { ics } from "@/lib/calendar";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = ics(id.replace(/\.ics$/, ""));
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id.replace(/\.ics$/, "")}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
