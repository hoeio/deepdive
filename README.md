# DeepDive

A website for discovering and playing Alternate Reality Games (ARGs). Every game runs inside a simulated
"virtual internet": fake websites, an in-game search engine, mail, documents and puzzles. Nothing connects
to the real web. Free to play, no accounts, no ads.

This is the player-side MVP. Games are content files in this repo; there is no creator editor yet.

## Setup

Requires Node.js 20.9+.

```sh
npm install                 # also generates the Prisma client
cp .env.example .env        # DATABASE_URL and PROOF_SECRET
npx prisma db push          # creates the SQLite database (prisma/dev.db)
npm run dev                 # http://localhost:3000
```

To see the test fixture works as well: `DEEPDIVE_FIXTURES=1 npm run dev`.

Production: `npm run build && npm start`. Set a long random `PROOF_SECRET`; the play API refuses to run
without one.

## Test

```sh
npm run validate            # content validator (works and fixtures)
npm run lint
npm run typecheck
npm test                    # unit tests (Vitest)
npx playwright install chromium   # once
npm run build && npm run e2e      # E2E smoke tests against a production build, with fixtures
npm run a11y                # Lighthouse accessibility, main pages (needs a build)
```

CI (`.github/workflows/ci.yml`) runs all of these on every push.

## Add a work

1. Create `content/works/<slug>/work.yaml` and an `assets/` folder. Copy
   `content/works/quiet-frequency/` as a starting point. The format is documented in
   [docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md).
2. Use only fictional domains (`*.example`, `*.invalid`, `*.test`) and `555-01XX` phone numbers.
3. Hash each answer and paste the result into the puzzle's `answerHashes`:
   ```sh
   npm run hash-answer -- <slug> <puzzle-id> "the answer"
   ```
4. Start with `status: draft`, then validate until there are no errors:
   ```sh
   npm run validate -- <slug>
   ```
5. Review the work against [docs/REVIEW_CHECKLIST.md](docs/REVIEW_CHECKLIST.md), then publish:
   ```sh
   npm run work-status -- <slug> in_review
   npm run work-status -- <slug> published
   ```
   Restart the server in production to apply status changes.

## Validator

`npm run validate [-- <slug> ...]` checks every work in `content/works` and `content/fixtures`. It exits with
code 1 on any error: external URLs or resources, real-looking emails or phone numbers, raw HTML, missing
required content warnings, missing assets, broken internal links, unreachable puzzles or ending, duplicate
ids, and more. The full list is in [docs/CONTENT_SCHEMA.md](docs/CONTENT_SCHEMA.md#validator-checks).
The production build runs it first (`npm run build`).

## Reports

The "Report this work" form stores reports in the `Report` table. Read them with `npx prisma studio`.

## Layout

```
content/              creators, works and test fixtures (YAML + assets)
src/content/          schema, loader, validator, gate engine, search, answers, proofs, player API logic
src/app/              pages and API routes (/api/play, /api/assets, /api/reports)
src/components/       UI; src/components/play/ is the in-game shell
src/lib/strings.ts    every UI string (i18n-ready)
src/lib/player-store.ts  progress, settings and consent persistence (localStorage behind an interface)
scripts/              validate, hash-answer, work-status, a11y
tests/unit, tests/e2e
docs/                 PLAN, CONTENT_SCHEMA, DECISIONS, REVIEW_CHECKLIST
```

Design decisions and trade-offs: [docs/DECISIONS.md](docs/DECISIONS.md).
