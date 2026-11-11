import type { PlayerHint, PlayerPage, PlayerState } from "@/content/play";
import type { SearchHit } from "@/content/search";

async function call<T>(slug: string, body: object): Promise<T> {
  const res = await fetch(`/api/play/${encodeURIComponent(slug)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`play api ${res.status}`);
  return res.json();
}

type P = Record<string, string>;
export const playApi = {
  state: (slug: string, proofs: P) => call<PlayerState>(slug, { action: "state", proofs }),
  page: (slug: string, proofs: P, url: string) => call<{ page: PlayerPage | null }>(slug, { action: "page", proofs, url }),
  search: (slug: string, proofs: P, q: string) => call<{ hits: Omit<SearchHit, "score">[] }>(slug, { action: "search", proofs, q }),
  answer: (slug: string, proofs: P, puzzleId: string, answer: string) =>
    call<{ correct: boolean; proof?: string }>(slug, { action: "answer", proofs, puzzleId, answer }),
  hints: (slug: string, proofs: P, revealed: Record<string, number>) => call<{ hints: PlayerHint[] }>(slug, { action: "hints", proofs, revealed }),
};
export type { PlayerState, PlayerPage, PlayerHint };
