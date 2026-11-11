import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { markdownToText } from "./markdown";
import { creatorSchema, workSchema, type Creator, type Work } from "./schema";
import { buildIndex, type SearchDoc, type SearchIndex } from "./search";
import { ALLOWED_ASSET_EXT, validateWork, type Issue } from "./validate";

export const CONTENT_ROOT = path.join(process.cwd(), "content");

export type WorkDir = { dir: string; name: string; fixture: boolean };

// Test-only fixture works are loaded only when DEEPDIVE_FIXTURES=1 (E2E, CI).
export function workDirs(opts: { fixtures?: boolean } = {}): WorkDir[] {
  const withFixtures = opts.fixtures ?? process.env.DEEPDIVE_FIXTURES === "1";
  const roots = [{ root: path.join(CONTENT_ROOT, "works"), fixture: false }];
  if (withFixtures) roots.push({ root: path.join(CONTENT_ROOT, "fixtures"), fixture: true });
  return roots.flatMap(({ root, fixture }) =>
    fs.existsSync(root)
      ? fs
          .readdirSync(root, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => ({ dir: path.join(root, d.name), name: d.name, fixture }))
      : [],
  );
}

export function readYaml(file: string): unknown {
  return YAML.parse(fs.readFileSync(file, "utf8"));
}

export function loadCreators(): Map<string, Creator> {
  const dir = path.join(CONTENT_ROOT, "creators");
  const out = new Map<string, Creator>();
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    const c = creatorSchema.parse(readYaml(path.join(dir, f)));
    out.set(c.id, c);
  }
  return out;
}

// Map of asset path (relative to assets/) -> text content for text-like files, null for binaries.
export function listAssets(workDir: string): Map<string, string | null> {
  const root = path.join(workDir, "assets");
  const out = new Map<string, string | null>();
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const rel = path.relative(root, full).split(path.sep).join("/");
        out.set(rel, /\.(svg|txt|md)$/i.test(e.name) ? fs.readFileSync(full, "utf8") : null);
      }
    }
  };
  walk(root);
  return out;
}

export function validateDir(wd: WorkDir, creators: Set<string>): Issue[] {
  const file = path.join(wd.dir, "work.yaml");
  if (!fs.existsSync(file)) return [{ level: "error", path: "work.yaml", message: "missing work.yaml" }];
  let raw: unknown;
  try {
    raw = readYaml(file);
  } catch (e) {
    return [{ level: "error", path: "work.yaml", message: `YAML parse error: ${(e as Error).message}` }];
  }
  return validateWork(raw, { dirName: wd.name, creators, assets: listAssets(wd.dir) });
}

export type LoadedWork = { work: Work; dir: string; fixture: boolean; index: SearchIndex };

function searchDocs(w: Work): SearchDoc[] {
  return [
    ...w.pages.map((p) => ({ kind: "pages" as const, id: p.id, title: p.title, text: markdownToText(p.body), keywords: p.keywords, url: p.url })),
    ...w.mails.map((m) => ({
      kind: "mails" as const,
      id: m.id,
      title: m.subject,
      text: `${m.from.name} ${markdownToText(m.body)}`,
      keywords: m.keywords,
    })),
    ...w.documents.map((d) => ({
      kind: "documents" as const,
      id: d.id,
      title: d.title,
      text: `${d.alt ?? ""} ${markdownToText(d.body ?? "")}`.trim(),
      keywords: d.keywords,
    })),
  ];
}

type Catalog = { works: Map<string, LoadedWork>; creators: Map<string, Creator> };
let cache: Catalog | null = null;

// Loaded once per server process in production; re-read on every call in dev so edits show up.
export function catalog(): Catalog {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const creators = loadCreators();
  const works = new Map<string, LoadedWork>();
  for (const wd of workDirs()) {
    const issues = validateDir(wd, new Set(creators.keys()));
    const errors = issues.filter((i) => i.level === "error");
    if (errors.length) {
      console.error(`[content] skipping ${wd.name}: ${errors.length} validation error(s). Run npm run validate.`);
      continue;
    }
    const work = workSchema.parse(readYaml(path.join(wd.dir, "work.yaml")));
    works.set(work.slug, { work, dir: wd.dir, fixture: wd.fixture, index: buildIndex(searchDocs(work)) });
  }
  cache = { works, creators };
  return cache;
}

export const isPublic = (w: Work) => w.status === "published";

export function publishedWorks(): Work[] {
  return [...catalog().works.values()].map((l) => l.work).filter(isPublic);
}

export function getPublishedWork(slug: string): LoadedWork | null {
  const l = catalog().works.get(slug);
  return l && isPublic(l.work) ? l : null;
}

export function getCreator(id: string): Creator | null {
  return catalog().creators.get(id) ?? null;
}

export function resolveAssetPath(l: LoadedWork, rel: string): string | null {
  const root = path.join(l.dir, "assets");
  const full = path.resolve(root, rel);
  if (!full.startsWith(root + path.sep) || !ALLOWED_ASSET_EXT.test(full) || !fs.existsSync(full)) return null;
  return full;
}
