# Decisions and trade-offs

Every assumption made while building the MVP, and why. Newest decisions go at the bottom of each section.

## Stack

- **Next.js 16.4 (App Router), React 19, Tailwind 4, TypeScript.** This is what `create-next-app@latest` installs today.
  The brief's defaults are kept.
- **Cache Components turned off.** Next 16 scaffolds with `cacheComponents: true`. It is opt-in, and the previous
  model is simpler for file-based content. The root layout is `force-dynamic`: content is read at request time,
  so fixture works (enabled by an environment variable) and status changes apply without a rebuild. The cost is
  no static pages, which doesn't matter at MVP traffic.
- **Prisma 6, not 7.** Prisma 7 requires driver adapters and a new config file. 6.x is stable and enough for one
  table. The schema avoids SQLite-only types, so switching `provider` to `postgresql` is the whole migration.
- **`@types/node` 24** to satisfy Vitest 5's peer range.
- **System fonts only.** `next/font/google` downloads fonts at build time. We avoid any font fetch.
- **Icons are Unicode glyphs** with text labels, so there is no icon font and no extra dependency.
- **Lighthouse script is plain `.mjs`.** tsx/esbuild injects a `__name` helper into functions, and Lighthouse
  serializes those functions into the browser, which breaks them.

## No open web (constraint 1)

- **CSP via `next.config.ts` headers**: `default-src 'self'`, no external origins for anything, `object-src 'none'`,
  `frame-ancestors 'self'`.
- **`script-src 'unsafe-inline'`** is kept because Next.js needs inline hydration scripts. The alternative is
  per-request nonces via `proxy.ts`, which forces dynamic rendering (we already are dynamic, so this is the
  upgrade path). External scripts are blocked either way. `'unsafe-eval'` is added in dev only.
- **`frame-src 'self'`** so the browser's built-in PDF viewer can show work PDFs in an iframe. Nothing external
  can be framed.
- **SVG assets** are served with their own `CSP: default-src 'none'; sandbox`, and the validator rejects SVGs
  that reference anything outside themselves. XML namespace URIs (`xmlns="http://www.w3.org/2000/svg"`) are
  ignored by the scanner because they are identifiers, never fetched.
- **Markdown links**: only full fake URLs of pages in the same work, `doc:<id>` and `asset:<path>` survive the
  sanitizer. Anything else is turned into plain text.

## Fictional data (constraint 2)

- **Reserved domains**: `*.example`, `*.invalid`, `*.test`, and `example.com/net/org` (RFC 2606/6761). We did not
  create a platform-owned fake TLD; the reserved ones are guaranteed never to resolve.
- **`seek.example` is reserved** for the built-in search engine; works can't put pages there.
- **Phones**: only the US fictional range `555-0100` to `555-0199` passes.
- The validator uses **heuristics**: it can miss an oddly formatted number, and it can flag a year sequence that
  looks like a phone number. A bare domain with a real TLD (`foo.com`) is only a warning, because prose can
  contain things like file names. Human review (REVIEW_CHECKLIST.md) covers what regexes can't, such as real
  people and organizations.

## Content format

- **One YAML file per work** (`work.yaml`) plus `assets/`. YAML suits long Markdown bodies better than JSON.
  The schema is zod (`src/content/schema.ts`); we did not generate a JSON Schema yet. Add `z.toJSONSchema()`
  when the editor needs one.
- **Node ids are unique across pages, mails, documents, puzzles and gates**, so gates can refer to any node by
  id without saying its kind.
- **Gate semantics**: a gate opens when *all* of its `when.solved` puzzles are solved. A node locked by several
  gates opens when *any* of them opens. Conditions are "puzzles solved" only. Visiting a page or reading a mail as
  a trigger is a possible extension; time delays are out of scope.
- **Ending** = a list of required puzzles. When they are all solved, the ending modal appears.
- **Mail replies are skipped.** Every mechanic a reply could carry (keyword or fixed choice) is already covered
  by the Answers app, and replies would add a second answer-checking path to the schema. Revisit with the editor.
- **Hints are exactly three named tiers** (`direction`, `where`, `answer`) per puzzle. They are required, so every
  puzzle has a way out.
- **Fixture works** live in `content/fixtures/` and load only when `DEEPDIVE_FIXTURES=1` (E2E, CI, a11y). The
  validator always checks them.
- **Work status lives in `work.yaml`**, changed with `npm run work-status`, which refuses `in_review` and
  `published` while the validator reports errors. In production the catalog is cached per process, so a
  restart is needed. A DB-backed status is the upgrade path once there is an admin UI.
- **Required warnings**: a `draft` can omit them (validator warning). Any other status fails validation, so a
  work cannot be published without all four.
- **Scene flags must agree with warnings**: `scene.jumpScare` requires `jump_scares` above none, and likewise for
  `flashing`.

## Answers and progress (constraint 5 and accounts)

- **All game content stays on the server.** The client calls one endpoint (`POST /api/play/<slug>`) and receives
  only what is unlocked. Locked pages return the same "not found" as missing ones.
- **Proofs instead of server sessions.** A correct answer returns `HMAC(PROOF_SECRET, slug:puzzleId)`. The client
  stores proofs in localStorage and sends them with each call. The server verifies them and computes what is
  unlocked. This keeps the server stateless without accounts.
  - Proofs are the same for every player, so a player could copy someone else's. That only spoils their own game.
  - Rotating `PROOF_SECRET` resets everyone's saved progress.
  - Production refuses to start the play API without `PROOF_SECRET`.
- **Answer hashes**: `sha256(slug:puzzleId:normalized)`. Hashes never leave the server either. Short answers
  (like a 4-digit code) could be brute-forced if someone obtained the hashes; that is acceptable because the
  repo also contains the Tier 3 hint, which states the answer. The real protection is that neither reaches the client.
- **Normalization**: NFKD, strip accents, lowercase, keep only letters and digits. Authors list several hashes
  for alternative answers.
- **PlayerStore interface** (`src/lib/player-store.ts`) with async methods. `LocalPlayerStore` uses localStorage,
  falls back to memory when storage is blocked, and resets corrupted entries. Server accounts can implement the
  same interface later.
- **Assets of locked documents** can be fetched by anyone who guesses the file path. Gating assets by proofs is
  possible; we skipped it because the risk is only a self-spoiler.

## Search

- **Own small engine** (`src/content/search.ts`): tokenize, plural stemming, prefix match, field weights
  (title 3, keywords 2, body 1), IDF, and results that match more query terms rank first. No dependency.
  IDF counts locked nodes too; that reveals nothing readable.
- Search results for mail and documents open the Mail or Files app.

## Player experience

- **Consent is remembered per work** and then skips the consent screen. **Broadcast Mode always shows it**, so the
  warning summary appears on stream.
- **Reduced Mode is one global setting.** The consent screen offers to turn it on. Effects also respect
  `prefers-reduced-motion`.
- **Broadcast Mode**: there are no accounts, so the only personal data is the player's notes, which are hidden
  until revealed. Hints are hidden by default, and a confirmation appears before the ending.
- **The hints page opens in the same tab.** Two tabs writing the same localStorage key would overwrite each
  other's progress.
- **The progress indicator shows "x of N steps"**, where N is the puzzle count. It reveals the game's length, not
  its content.
- **The "hide works with" setting hides a work if the category is present at any intensity.** There is no
  per-category threshold yet.
- **Play-time filter buckets overlap**: a 20–30 minute work counts as both "up to 30" and "30–60".
- **Share links** copy `/works/<slug>` only. Progress is never in a URL.
- **Spoiler tag**: `||text||` in the report details field, the only community-style text field in the MVP.

## Safety pipeline

- **Reports** are stored in SQLite and validated with zod. There is no rate limiting and no admin UI for reading
  them; use `npx prisma studio`. Add both before public launch.
- **Creator pages are plain text with no links.** `TODO(creator-links)` in `src/app/creators/[id]/page.tsx`. Allowing
  links needs a policy (only to other DeepDive pages? reviewed external links?) and a review step.
- **There is no admin web view.** The `work-status` CLI is the admin tool.

## Testing

- **Lighthouse** checks the platform pages. The play shell needs consent in localStorage, so it is covered by
  keyboard-only Playwright tests instead.
- **E2E runs against `next start`** (a production build) with fixtures enabled.

## Seed content

- **Tutorial assets were generated**: hand-written SVG images, a minimal hand-built PDF and a synthesized WAV
  crackle. There is no video in the tutorial, but the Files viewer supports video.
- **The jump-scare fixture** is a short radio crackle plus a screen shake on the basement page. It is announced in
  the warnings and in-fiction ("the old radios down there make noise"), and it is skippable.
