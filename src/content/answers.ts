import { createHash } from "node:crypto";

// "Wrén  Talbot!" -> "wrentalbot". Case, accents, spaces and punctuation never matter.
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

// Salted with work slug + puzzle id so equal answers in different puzzles hash differently.
export function hashAnswer(slug: string, puzzleId: string, raw: string): string {
  const digest = createHash("sha256").update(`${slug}:${puzzleId}:${normalizeAnswer(raw)}`).digest("hex");
  return `sha256:${digest}`;
}

export function checkAnswer(slug: string, puzzleId: string, raw: string, hashes: string[]): boolean {
  if (!normalizeAnswer(raw)) return false;
  return hashes.includes(hashAnswer(slug, puzzleId, raw));
}
