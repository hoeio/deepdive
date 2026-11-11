import { z } from "zod";
import { getPublishedWork } from "@/content/loader";
import { playerAnswer, playerHints, playerPage, playerSearch, playerState } from "@/content/play";

const proofs = z.record(z.string().max(64), z.string().max(128)).default({});
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("state"), proofs }),
  z.object({ action: z.literal("page"), proofs, url: z.string().max(500) }),
  z.object({ action: z.literal("search"), proofs, q: z.string().max(200) }),
  z.object({ action: z.literal("answer"), proofs, puzzleId: z.string().max(64), answer: z.string().max(200) }),
  z.object({ action: z.literal("hints"), proofs, revealed: z.record(z.string().max(64), z.number()).default({}) }),
]);

// Single stateless endpoint for the player runtime. The client sends its proofs with every call.
export async function POST(req: Request, ctx: RouteContext<"/api/play/[slug]">) {
  const l = getPublishedWork((await ctx.params).slug);
  if (!l) return Response.json({ error: "not found" }, { status: 404 });
  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const b = parsed.data;
  switch (b.action) {
    case "state":
      return Response.json(playerState(l, b.proofs));
    case "page":
      return Response.json({ page: playerPage(l, b.proofs, b.url) });
    case "search":
      return Response.json({ hits: playerSearch(l, b.proofs, b.q) });
    case "answer":
      return Response.json(playerAnswer(l, b.proofs, b.puzzleId, b.answer));
    case "hints":
      return Response.json({ hints: playerHints(l, b.proofs, b.revealed) });
  }
}
