# DeepDive MVP — Implementation Plan

## Tech choices
- Next.js (App Router) + TypeScript + Tailwind CSS, system fonts only (no font downloads).
- Prisma + SQLite in dev (Postgres-compatible schema). Only `Report` is stored in the DB.
- Content: `content/works/<slug>/work.yaml` + `assets/`, creators in `content/creators/<id>.yaml`.
  Validated with zod (`src/content/schema.ts`), loaded once per server process.
- Test-only fixture works in `content/fixtures/`, loaded only when `DEEPDIVE_FIXTURES=1`.
- Markdown for text bodies → `marked` → `sanitize-html` (server-side) → rendered HTML.
- Vitest for unit tests, Playwright for E2E, Lighthouse for a11y, GitHub Actions CI.

## Architecture (key idea)
All game content stays on the server. The client never receives locked nodes, answers or hashes.
- `POST /api/play/<slug>`: one endpoint with actions `state | page | search | answer | hints`.
- A correct answer returns a **proof** (HMAC of slug+puzzle id). The client keeps its proofs in
  localStorage and sends them with each request. The server checks them, works out the solved set,
  opens gates and returns only what is unlocked. This keeps the server stateless (no accounts)
  without leaking content.
- The progress layer sits behind a `ProgressStore` interface (localStorage now, server accounts later).

## Data model
- Work: metadata, status, creator, genres, play time, difficulty, warnings{category→{intensity,note}},
  broadcast{permission,note}, startUrl, pages[], mails[], documents[], puzzles[], gates[], ending.
- Node scene flags: `scene: {jumpScare?, flashing?, skippable?, skipText?}`.
- Puzzle: id, title, prompt, answerHashes[], hints{direction,where,answer}.
- Gate: id, `when.solved[]`, `unlocks{pages,mails,documents,puzzles,search}`.
- DB: `Report {id, workSlug, reason, details, createdAt}`.
- Client: `Progress {proofs, visited, readMails, notes, revealedHints, lastUrl}`,
  `Settings {reducedMode, broadcastMode, hiddenWarnings[]}`, `Consent per work`.

## Milestones (one commit each)
1. Scaffold: Next.js/Tailwind/Prisma, CSP headers, i18n strings module, CI workflow.
2. Content: schema, loader, answer hashing, gates, search index, validator CLI, status CLI,
   tutorial + fixture works, unit tests, CONTENT_SCHEMA.md.
3. Discovery: home, works list + filters, work detail, creator page, settings, report button.
4. Player runtime: consent screen, shell (browser, search, mail, files, notes, answers),
   progress/autosave/reset, Reduced Mode, Broadcast Mode, ending.
5. Hints page, spoiler tag, E2E + Lighthouse, README, DECISIONS, REVIEW_CHECKLIST.
