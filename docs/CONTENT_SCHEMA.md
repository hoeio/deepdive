# Content package format (schema version 1)

A work is a folder: `content/works/<slug>/` with a `work.yaml` file and an optional `assets/` folder.
The source of truth is the zod schema in `src/content/schema.ts`. Safety and consistency rules that a
schema cannot express live in the validator, `src/content/validate.ts`. Run it with `npm run validate`.

The format is **declarative**: no code, no raw HTML, no external resources. A future creator editor
will produce exactly this structure.

```
content/
  creators/<creator-id>.yaml
  works/<slug>/work.yaml
  works/<slug>/assets/...       images, PDFs, audio, video, text
  fixtures/<slug>/...           test-only works, loaded only with DEEPDIVE_FIXTURES=1
```

## Annotated example

```yaml
schemaVersion: 1                 # always 1 for this version
slug: quiet-frequency            # must equal the folder name; lowercase, digits, dashes
title: The Quiet Frequency
status: published                # draft | in_review | published | unpublished (only published is public)
creator: deepdive-team           # id of a file in content/creators/
blurb: Short, spoiler-free card text (max 200 chars).
description: |                   # spoiler-free Markdown for the detail page
  Longer description...
genres: [tutorial, mystery]      # tutorial | mystery | puzzle | horror | sci_fi | drama | comedy
playTimeMinutes: { min: 20, max: 30 }
difficulty: beginner             # beginner | intermediate | advanced

warnings:                        # see "Content warnings" below
  sexual_content:   { intensity: none }
  graphic_violence: { intensity: none }
  horror:           { intensity: none }
  jump_scares:      { intensity: mild, note: One sudden radio crackle sound. }

broadcast:
  permission: allowed            # allowed | allowed_with_spoiler_restrictions | not_allowed
  note: Please keep answers out of thumbnails.

startUrl: https://halden-library.example/   # the page the browser opens first; must exist and be unlocked

pages:                           # fake websites
  - id: library-home             # unique across pages, mails, documents, puzzles and gates
    url: https://halden-library.example/    # must use a reserved fictional domain (see below)
    title: Halden Public Library
    search: visible              # visible (default) | hidden | hidden_until_unlocked
    keywords: [library, home]    # extra search terms (optional)
    scene:                       # optional scene flags, see Reduced Mode
      jumpScare: true
      flashing: false
      skippable: true
      skipText: What the player learns if they skip this node.
    sound: { asset: audio/crackle.wav, sudden: true }   # optional; sudden sounds are muted in Reduced Mode
    body: |                      # Markdown, sanitized at render time
      # Welcome
      [About us](https://halden-library.example/about)   # link to another page in this work
      [See the photo](doc:cornerstone-photo)             # open a document
      ![Logo](asset:images/logo.png)                     # inline image from assets/

mails:                           # arrive in the inbox once unlocked (immediately if no gate locks them)
  - id: mail-welcome
    from: { name: Iris Calloway, address: iris@halden-library.example }
    subject: Welcome!
    date: Monday, 09:12          # display only, in-fiction
    body: Markdown...

documents:                       # files in the Files app
  - id: cornerstone-photo
    title: Photo of the cornerstone
    kind: image                  # text | image | pdf | audio | video
    asset: images/cornerstone.svg        # required for every kind except text
    alt: Text alternative (required for images)
    body: Caption, transcript (audio/video) or the full text (kind text)

puzzles:
  - id: founder
    title: Who founded the club?         # spoiler-free label
    prompt: Enter their full name.       # Markdown
    answerHashes: [sha256:...]           # from: npm run hash-answer -- <slug> <puzzle-id> "<answer>"
    hints:                               # all three tiers are required
      direction: Tier 1, a nudge in the right direction.
      where: Tier 2, where to look.
      answer: Tier 3, the answer.

gates:                           # conditions and what they unlock
  - id: after-founder
    when: { solved: [founder] }  # opens when ALL listed puzzles are solved
    unlocks:
      pages: []                  # locked pages show "page not found" until unlocked
      mails: [mail-newsletter]
      documents: [newsletter]
      puzzles: [code-word]
      search: [radio-circle-members]   # nodes with search: hidden_until_unlocked become searchable

ending:
  requires: [capsule-code]       # solving these finishes the work
  title: Keep listening
  body: Markdown shown on the ending screen.
```

## Rules

**Locking.** A page, mail, document or puzzle listed in any gate's `unlocks` is locked until at least one
of those gates opens. Anything not listed in a gate is available from the start.

**Search.** The built-in search engine (Seek, at `https://seek.example`) indexes only this work's
unlocked pages, mails and documents, by title, keywords, URL and text. `hidden` nodes are never
searchable. `hidden_until_unlocked` nodes become searchable when a gate lists them in `unlocks.search`.
They can still be reached by URL or link before that.

**Answers.** Answers are normalized before hashing: Unicode NFKD, accents removed, lowercase, and every
character that is not a letter or digit removed. `"Wrén Talbot!"` and `"wrentalbot"` are the same.
The hash is `sha256("<slug>:<puzzle-id>:<normalized>")`. List several hashes to accept several answers.

**Fictional data.** Every URL, email and website must use a reserved domain: `*.example`, `*.invalid`,
`*.test`, or `example.com` / `example.net` / `example.org`. Phone numbers must use the fictional
`555-0100` to `555-0199` range. `seek.example` is reserved for the platform search engine.

**Links.** Markdown links may only point to a full fake URL of a page in the same work, to `doc:<id>`, or
to `asset:<path>`. Raw HTML is stripped by the sanitizer and rejected by the validator if it could load
or run anything.

**Assets.** Allowed types: png, jpg, gif, webp, svg, txt, md, pdf, mp3, ogg, wav, m4a, mp4, webm.
SVG files may not reference anything outside themselves.

## Content warnings

| Key | Category | Required |
|---|---|---|
| `sexual_content` | Sexual content | yes |
| `graphic_violence` | Graphic violence / gore | yes |
| `horror` | Horror | yes |
| `jump_scares` | Jump scares | yes |
| `self_harm` | Self-harm or suicide | no |
| `minors_harm` | Violence or abuse involving minors | no |
| `harassment_hate` | Harassment or hate speech | no |
| `flashing` | Flashing lights or strobing | no |
| `real_events` | Content resembling real events | no |

Each entry is `{ intensity: none | mild | moderate | strong, note?: string }`. The four required
categories must be declared, even as `none`, before a work can move to `in_review` or `published`.
Notes say **what** is present, never when or how. ("Several sudden scares.", not "The doll moves in
chapter 3.")

Scene flags must match the declared warnings: a node with `scene.jumpScare` needs `jump_scares` above
`none`, and a node with `scene.flashing` needs `flashing` above `none`.

## Validator checks

`npm run validate` fails on: schema errors; external URLs or resources; real-looking emails, web
addresses or phone numbers; raw HTML that can load or run code; missing required warnings (on any
non-draft work); missing assets; disallowed asset types; SVGs with outside references; broken internal
links; unknown ids in gates; unreachable puzzles, nodes or ending; a locked or missing start page;
duplicate ids or URLs; scene flags that contradict the warnings. It warns on possible real domain names,
mentions of personal data, unused assets, skippable nodes without `skipText`, and media without
transcripts.

## Versioning

`schemaVersion` changes only on a breaking change. Add new optional fields without bumping it. When it
does change, keep a migration script next to the schema so existing packages can be upgraded.
