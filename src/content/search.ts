// In-game search engine. Indexes ONLY one work's nodes; the caller filters by what the player may see.
export type SearchDoc = {
  kind: "pages" | "mails" | "documents";
  id: string;
  title: string;
  text: string;
  keywords: string[];
  url?: string;
};

export type SearchHit = { kind: SearchDoc["kind"]; id: string; title: string; url?: string; snippet: string; score: number };

const STOP = new Set("a an and are as at be by for from has have i in is it its of on or that the this to was were will with you your".split(" "));

export function tokenize(s: string): string[] {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

// ponytail: plural-stripping only. Upgrade path: a real stemmer (Porter) if players miss obvious matches.
function stem(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

type Entry = { doc: SearchDoc; fields: { title: string[]; keywords: string[]; body: string[] } };
const WEIGHTS = { title: 3, keywords: 2, body: 1 } as const;

export function buildIndex(docs: SearchDoc[]) {
  const entries: Entry[] = docs.map((doc) => ({
    doc,
    fields: {
      title: tokenize(doc.title),
      keywords: tokenize(doc.keywords.join(" ") + " " + (doc.url ?? "")),
      body: tokenize(doc.text),
    },
  }));
  const df = new Map<string, number>();
  for (const e of entries) {
    for (const tok of new Set([...e.fields.title, ...e.fields.keywords, ...e.fields.body])) df.set(tok, (df.get(tok) ?? 0) + 1);
  }
  return { entries, df, n: entries.length };
}

export type SearchIndex = ReturnType<typeof buildIndex>;

export function search(index: SearchIndex, query: string, allowed: (d: SearchDoc) => boolean, limit = 20): SearchHit[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];
  const hits: (SearchHit & { matched: number })[] = [];
  for (const e of index.entries) {
    if (!allowed(e.doc)) continue;
    let score = 0;
    let matched = 0;
    for (const term of terms) {
      let termScore = 0;
      for (const f of ["title", "keywords", "body"] as const) {
        for (const tok of e.fields[f]) {
          if (tok === term) termScore += WEIGHTS[f];
          else if (term.length >= 3 && tok.startsWith(term)) termScore += WEIGHTS[f] / 2; // prefix match
        }
      }
      if (termScore > 0) {
        matched++;
        score += termScore * Math.log(1 + index.n / (index.df.get(term) ?? 1));
      }
    }
    if (matched > 0) hits.push({ ...pick(e.doc), snippet: snippet(e.doc.text, terms), score, matched });
  }
  // More query terms matched beats a higher score from one repeated term.
  hits.sort((a, b) => b.matched - a.matched || b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, limit).map((h) => ({ kind: h.kind, id: h.id, title: h.title, url: h.url, snippet: h.snippet, score: h.score }));
}

function pick(d: SearchDoc) {
  return { kind: d.kind, id: d.id, title: d.title, url: d.url };
}

function snippet(text: string, terms: string[], radius = 80): string {
  const lower = text.toLowerCase();
  const at = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}
