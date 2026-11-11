import { getPublishedWork } from "@/content/loader";
import { db } from "@/lib/db";
import { reportInput } from "@/lib/report";

// ponytail: no rate limiting. Add per-IP limits before opening the platform to the public.
export async function POST(req: Request) {
  const parsed = reportInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid report" }, { status: 400 });
  if (!getPublishedWork(parsed.data.workSlug)) return Response.json({ error: "unknown work" }, { status: 404 });
  const r = await db.report.create({ data: parsed.data });
  return Response.json({ id: r.id }, { status: 201 });
}
