import { access as accessFor, reachability } from "./engine";
import { FICTIONAL_PHONE, PLATFORM_SEARCH_HOST, fictionalUrlHost, isFictionalHost, urlKey } from "./fictional";
import { markdownRefs } from "./markdown";
import { REQUIRED_WARNINGS, workSchema, type Work } from "./schema";

export type Issue = { level: "error" | "warning"; path: string; message: string };

export type ValidateContext = {
  dirName?: string;
  creators: Set<string>;
  assets: Map<string, string | null>; // relative path under assets/ -> text content (text-like files) or null
};

export const ALLOWED_ASSET_EXT = /\.(png|jpe?g|gif|webp|svg|txt|md|pdf|mp3|ogg|wav|m4a|mp4|webm)$/i;

const URL_RE = /\b(?:https?|ftp|wss?):\/\/[^\s<>"'`)\]]+/gi;
const PROTOCOL_RELATIVE_RE = /(?:^|[\s("'=])\/\/([a-z0-9-]+\.[a-z0-9.-]+)/gi;
const WWW_RE = /\bwww\.[a-z0-9-]+\.[a-z]{2,}/gi;
const BARE_DOMAIN_RE = /\b[a-z0-9-]+\.(?:com|net|org|io|co|gov|edu|info|biz|app|dev|uk|de|jp|kr|fr)\b/gi;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g;
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?|\d{2,4}[\s.-])\d{3,4}[\s.-]\d{3,4}|\+\d{8,15}/g;
const DANGEROUS_HTML_RE = /<\s*(script|iframe|object|embed|link|meta|style|form|base|foreignObject)\b|javascript:|<[^>]*\son[a-z]+\s*=/i;
const PERSONAL_DATA_RE = /\b(password|credit card|card number|social security|bank account|home address|phone number)\b/i;

function walkStrings(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) walkStrings(v, path ? `${path}.${k}` : k, out);
}

// Safety scan shared by content strings and text-like asset files.
export function scanText(path: string, input: string, issues: Issue[], opts: { svg?: boolean } = {}) {
  // XML namespace identifiers look like URLs but are never fetched.
  const s = opts.svg ? input.replace(/\sxmlns(?::\w+)?\s*=\s*["'][^"']*["']/g, "") : input;
  const err = (message: string) => issues.push({ level: "error", path, message });
  for (const m of s.matchAll(URL_RE)) {
    if (!fictionalUrlHost(m[0].replace(/[.,;:!?]+$/, ""))) err(`external URL not allowed: ${m[0]}`);
  }
  for (const m of s.matchAll(PROTOCOL_RELATIVE_RE)) if (!isFictionalHost(m[1])) err(`external resource not allowed: //${m[1]}`);
  for (const m of s.matchAll(WWW_RE)) if (!isFictionalHost(m[0])) err(`real-looking web address: ${m[0]}`);
  for (const m of s.matchAll(BARE_DOMAIN_RE)) {
    if (!isFictionalHost(m[0]) && !s.slice(Math.max(0, m.index - 1), m.index).match(/[@.]/))
      issues.push({ level: "warning", path, message: `possible real domain name: ${m[0]}` });
  }
  for (const m of s.matchAll(EMAIL_RE)) if (!isFictionalHost(m[1])) err(`email must use a reserved fictional domain: ${m[0]}`);
  for (const m of s.matchAll(PHONE_RE)) if (!FICTIONAL_PHONE.test(m[0])) err(`phone number must use the fictional 555-01XX range: ${m[0].trim()}`);
  if (DANGEROUS_HTML_RE.test(s)) err("raw HTML that can load or run code is not allowed");
  if (opts.svg) {
    for (const m of s.matchAll(/(?:href|src)\s*=\s*["']([^"']*)["']/gi)) if (!m[1].startsWith("#")) err(`SVG may only reference its own elements: ${m[1]}`);
    if (/url\(\s*['"]?(?!#)/i.test(s)) err("SVG url() may only reference its own elements");
  } else if (PERSONAL_DATA_RE.test(s)) {
    issues.push({ level: "warning", path, message: "mentions personal data: make sure the game never asks players for real data" });
  }
}

export function validateWork(raw: unknown, ctx: ValidateContext): Issue[] {
  const issues: Issue[] = [];
  const err = (path: string, message: string) => issues.push({ level: "error", path, message });
  const warn = (path: string, message: string) => issues.push({ level: "warning", path, message });

  // 1. Safety scan on every string, even if the schema fails, so nothing unsafe slips through.
  const strings: [string, string][] = [];
  walkStrings(raw, "", strings);
  for (const [p, s] of strings) scanText(p, s, issues);
  for (const [p, content] of ctx.assets) {
    if (!ALLOWED_ASSET_EXT.test(p)) err(`assets/${p}`, "file type not allowed");
    if (content !== null) scanText(`assets/${p}`, content, issues, { svg: /\.svg$/i.test(p) });
  }

  // 2. Schema.
  const parsed = workSchema.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) err(i.path.join(".") || "(root)", i.message);
    return issues;
  }
  const w: Work = parsed.data;

  w.pages.forEach((p, i) => {
    if (fictionalUrlHost(p.url) === PLATFORM_SEARCH_HOST) err(`pages[${i}].url`, `${PLATFORM_SEARCH_HOST} is reserved for the built-in search engine`);
  });
  if (ctx.dirName && ctx.dirName !== w.slug) err("slug", `slug "${w.slug}" must match folder name "${ctx.dirName}"`);
  if (!ctx.creators.has(w.creator)) err("creator", `unknown creator "${w.creator}"`);
  if (w.playTimeMinutes.min > w.playTimeMinutes.max) err("playTimeMinutes", "min must be <= max");

  // 3. Required content warnings must be explicitly declared (even as "none").
  for (const cat of REQUIRED_WARNINGS) {
    if (!w.warnings[cat]) {
      if (w.status === "draft") warn(`warnings.${cat}`, "required warning not declared (blocks review/publish)");
      else err(`warnings.${cat}`, "required warning must be declared (use intensity: none if absent)");
    }
  }

  // 4. Unique ids and URLs.
  const kinds = { pages: w.pages, mails: w.mails, documents: w.documents, puzzles: w.puzzles, gates: w.gates } as const;
  const seen = new Map<string, string>();
  for (const [kind, list] of Object.entries(kinds)) {
    list.forEach((n, i) => {
      if (seen.has(n.id)) err(`${kind}[${i}].id`, `duplicate id "${n.id}" (also in ${seen.get(n.id)})`);
      else seen.set(n.id, kind);
    });
  }
  const pageByUrl = new Map<string, string>();
  w.pages.forEach((p, i) => {
    if (!fictionalUrlHost(p.url)) err(`pages[${i}].url`, `page URL must use a reserved fictional domain: ${p.url}`);
    const key = urlKey(p.url);
    if (pageByUrl.has(key)) err(`pages[${i}].url`, `duplicate page URL ${p.url}`);
    pageByUrl.set(key, p.id);
  });
  const ids = (list: { id: string }[]) => new Set(list.map((n) => n.id));
  const idSets = { pages: ids(w.pages), mails: ids(w.mails), documents: ids(w.documents), puzzles: ids(w.puzzles) };

  // 5. Links, assets and scene flags inside nodes.
  const checkRefs = (path: string, md: string | undefined) => {
    for (const ref of markdownRefs(md ?? "")) {
      if (/^https?:\/\//i.test(ref)) {
        if (fictionalUrlHost(ref) && !pageByUrl.has(urlKey(ref))) err(path, `broken internal link: ${ref}`);
      } else if (ref.startsWith("doc:")) {
        if (!idSets.documents.has(ref.slice(4))) err(path, `link to unknown document: ${ref}`);
      } else if (ref.startsWith("asset:")) {
        if (!ctx.assets.has(ref.slice(6))) err(path, `missing asset: ${ref.slice(6)}`);
      } else {
        err(path, `unsupported link target "${ref}" (use a full fake URL, doc:<id> or asset:<path>)`);
      }
    }
  };
  const intensity = (cat: keyof Work["warnings"]) => w.warnings[cat]?.intensity ?? "none";
  type SceneNode = { scene?: { jumpScare?: boolean; flashing?: boolean; skippable?: boolean; skipText?: string }; sound?: { asset: string } };
  const checkNode = (path: string, n: SceneNode) => {
    if (n.sound && !ctx.assets.has(n.sound.asset)) err(`${path}.sound`, `missing asset: ${n.sound.asset}`);
    if (n.scene?.jumpScare && intensity("jump_scares") === "none") err(`${path}.scene`, "tagged jump scare but warnings.jump_scares is none");
    if (n.scene?.flashing && intensity("flashing") === "none") err(`${path}.scene`, "tagged flashing but warnings.flashing is none or missing");
    if (n.scene?.skippable && !n.scene.skipText) warn(`${path}.scene`, "skippable node has no skipText; skipping players may miss clues");
  };
  w.pages.forEach((p, i) => (checkRefs(`pages[${i}].body`, p.body), checkNode(`pages[${i}]`, p)));
  w.mails.forEach((m, i) => (checkRefs(`mails[${i}].body`, m.body), checkNode(`mails[${i}]`, m)));
  w.documents.forEach((d, i) => {
    checkRefs(`documents[${i}].body`, d.body);
    checkNode(`documents[${i}]`, d);
    if (d.kind === "text" && !d.body) err(`documents[${i}].body`, "text documents need a body");
    if (d.kind !== "text") {
      if (!d.asset) err(`documents[${i}].asset`, `${d.kind} documents need an asset`);
      else if (!ctx.assets.has(d.asset)) err(`documents[${i}].asset`, `missing asset: ${d.asset}`);
    }
    if (d.kind === "image" && !d.alt) err(`documents[${i}].alt`, "images need alt text");
    if ((d.kind === "audio" || d.kind === "video") && !d.body) warn(`documents[${i}].body`, "add a transcript in body for accessibility");
  });
  w.puzzles.forEach((p, i) => checkRefs(`puzzles[${i}].prompt`, p.prompt));
  checkRefs("ending.body", w.ending.body);

  // 6. Gate references.
  w.gates.forEach((g, i) => {
    g.when.solved.forEach((p) => idSets.puzzles.has(p) || err(`gates[${i}].when.solved`, `unknown puzzle "${p}"`));
    for (const kind of ["pages", "mails", "documents", "puzzles"] as const) {
      g.unlocks[kind].forEach((n) => idSets[kind].has(n) || err(`gates[${i}].unlocks.${kind}`, `unknown ${kind.slice(0, -1)} "${n}"`));
    }
    g.unlocks.search.forEach((n) => {
      const node = [...w.pages, ...w.mails, ...w.documents].find((x) => x.id === n);
      if (!node) err(`gates[${i}].unlocks.search`, `unknown node "${n}"`);
      else if (node.search !== "hidden_until_unlocked") warn(`gates[${i}].unlocks.search`, `"${n}" is not hidden_until_unlocked, so this has no effect`);
    });
  });
  w.ending.requires.forEach((p) => idSets.puzzles.has(p) || err("ending.requires", `unknown puzzle "${p}"`));
  for (const n of [...w.pages, ...w.mails, ...w.documents]) {
    if (n.search === "hidden_until_unlocked" && !w.gates.some((g) => g.unlocks.search.includes(n.id)))
      warn(`search`, `"${n.id}" is hidden_until_unlocked but no gate unlocks it for search`);
  }
  if (issues.some((i) => i.level === "error")) return issues; // reachability needs consistent references

  // 7. Reachability: no dead ends, every puzzle and node can be reached, the ending can be reached.
  const startId = pageByUrl.get(urlKey(w.startUrl));
  if (!startId) err("startUrl", `startUrl does not match any page: ${w.startUrl}`);
  else if (!accessFor(w, new Set()).isUnlocked("pages", startId)) err("startUrl", "start page must not be locked");
  const { solved, access } = reachability(w);
  w.puzzles.forEach((p, i) => solved.has(p.id) || err(`puzzles[${i}]`, `unreachable puzzle "${p.id}"`));
  for (const kind of ["pages", "mails", "documents"] as const) {
    w[kind].forEach((n, i) => access.isUnlocked(kind, n.id) || err(`${kind}[${i}]`, `"${n.id}" can never be unlocked`));
  }
  if (!access.ended) err("ending", "ending is unreachable");
  for (const [p] of ctx.assets) {
    const used = strings.some(([, s]) => s.includes(p));
    if (!used) warn(`assets/${p}`, "asset is never referenced");
  }
  return issues;
}
