import { checkAnswer } from "./answers";
import { access } from "./engine";
import { PLATFORM_SEARCH_HOST, urlKey } from "./fictional";
import type { LoadedWork } from "./loader";
import { assetUrl, renderMarkdown } from "./markdown";
import { makeProof, verifyProofs } from "./proof";
import type { Doc, Mail, Page } from "./schema";
import { search } from "./search";

// Player-facing views of a work. Everything here is computed from the player's verified proofs,
// so locked nodes, answer hashes and unreached hints never leave the server.

export type Proofs = Record<string, string>;

const sceneOf = (n: Page | Mail | Doc, slug: string) => ({
  scene: n.scene ?? null,
  sound: n.sound ? { url: assetUrl(slug, n.sound.asset), sudden: !!n.sound.sudden } : null,
});

function ctx(l: LoadedWork, proofs: Proofs) {
  const solved = verifyProofs(l.work.slug, proofs, l.work.puzzles.map((p) => p.id));
  return { w: l.work, solved, a: access(l.work, solved) };
}

export function playerState(l: LoadedWork, proofs: Proofs) {
  const { w, solved, a } = ctx(l, proofs);
  const md = (s: string) => renderMarkdown(s, w.slug);
  return {
    slug: w.slug,
    title: w.title,
    startUrl: w.startUrl,
    searchHost: PLATFORM_SEARCH_HOST,
    solved: [...solved],
    progress: { solved: solved.size, total: w.puzzles.length },
    mails: w.mails
      .filter((m) => a.isUnlocked("mails", m.id))
      .map((m) => ({ id: m.id, from: m.from, subject: m.subject, date: m.date ?? null, html: md(m.body), ...sceneOf(m, w.slug) })),
    documents: w.documents
      .filter((d) => a.isUnlocked("documents", d.id))
      .map((d) => ({
        id: d.id,
        title: d.title,
        kind: d.kind,
        assetUrl: d.asset ? assetUrl(w.slug, d.asset) : null,
        alt: d.alt ?? "",
        html: d.body ? md(d.body) : "",
        ...sceneOf(d, w.slug),
      })),
    puzzles: w.puzzles
      .filter((p) => a.isUnlocked("puzzles", p.id))
      .map((p) => ({ id: p.id, title: p.title, html: md(p.prompt), solved: solved.has(p.id) })),
    ending: a.ended ? { title: w.ending.title, html: md(w.ending.body) } : null,
  };
}
export type PlayerState = ReturnType<typeof playerState>;

export function playerPage(l: LoadedWork, proofs: Proofs, url: string) {
  const { w, a } = ctx(l, proofs);
  const key = urlKey(url);
  const p = w.pages.find((x) => urlKey(x.url) === key);
  if (!p || !a.isUnlocked("pages", p.id)) return null; // locked pages look exactly like missing ones
  return { id: p.id, url: p.url, title: p.title, html: renderMarkdown(p.body, w.slug), ...sceneOf(p, w.slug) };
}
export type PlayerPage = NonNullable<ReturnType<typeof playerPage>>;

export function playerSearch(l: LoadedWork, proofs: Proofs, q: string) {
  const { w, a } = ctx(l, proofs);
  const nodes = { pages: w.pages, mails: w.mails, documents: w.documents };
  return search(l.index, q, (d) => {
    const n = nodes[d.kind].find((x) => x.id === d.id);
    return !!n && a.isSearchable(d.kind, n);
  }).map((h) => ({ kind: h.kind, id: h.id, title: h.title, url: h.url, snippet: h.snippet }));
}

export function playerAnswer(l: LoadedWork, proofs: Proofs, puzzleId: string, answer: string) {
  const { w, a } = ctx(l, proofs);
  const p = w.puzzles.find((x) => x.id === puzzleId);
  if (!p || !a.isUnlocked("puzzles", p.id)) return { correct: false as const };
  if (!checkAnswer(w.slug, p.id, answer, p.answerHashes)) return { correct: false as const };
  return { correct: true as const, proof: makeProof(w.slug, p.id) };
}

// Hints only for puzzles the player has reached, and only up to the tier they chose to reveal.
export function playerHints(l: LoadedWork, proofs: Proofs, revealed: Record<string, number>) {
  const { w, solved, a } = ctx(l, proofs);
  return w.puzzles
    .filter((p) => a.isUnlocked("puzzles", p.id))
    .map((p) => {
      const n = Math.max(0, Math.min(3, Math.floor(revealed[p.id] ?? 0)));
      return { id: p.id, title: p.title, solved: solved.has(p.id), tiers: [p.hints.direction, p.hints.where, p.hints.answer].slice(0, n) };
    });
}
export type PlayerHint = ReturnType<typeof playerHints>[number];
