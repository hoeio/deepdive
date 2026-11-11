import { createHmac, timingSafeEqual } from "node:crypto";

// A proof says "this player solved puzzle X". Players keep proofs in localStorage and send them back,
// so the server stays stateless while locked content never reaches the client.
function secret(): string {
  const s = process.env.PROOF_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("PROOF_SECRET must be set in production");
  return "dev-only-proof-secret";
}

export function makeProof(slug: string, puzzleId: string): string {
  return createHmac("sha256", secret()).update(`${slug}:${puzzleId}`).digest("base64url");
}

export function verifyProofs(slug: string, proofs: Record<string, string>, puzzleIds: string[]): Set<string> {
  const solved = new Set<string>();
  for (const pid of puzzleIds) {
    const given = proofs[pid];
    if (typeof given !== "string") continue;
    const want = Buffer.from(makeProof(slug, pid));
    const got = Buffer.from(given);
    if (got.length === want.length && timingSafeEqual(got, want)) solved.add(pid);
  }
  return solved;
}
