# Review checklist

Use this before moving a work from `in_review` to `published`. The validator (`npm run validate`) must pass
first. These are the things it cannot check.

Reviewer: ______  Work: ______  Date: ______

## Real world

- [ ] No impersonation of real people, brands or organizations: names, logos, slogans or look-alike sites.
- [ ] No real contact info: phone numbers, emails, addresses, social handles. Only reserved fictional domains
      and the 555-01XX phone range.
- [ ] No real places presented as the site of in-game events, and no instructions to go anywhere in real life.
- [ ] No copyrighted text, images, music or characters that we have not licensed.

## Player safety

- [ ] The game never asks players for passwords, payment details or personal data, even in-fiction
      ("enter your real email to continue" is not allowed).
- [ ] The game never asks players to contact anyone, post anywhere or act outside DeepDive.
- [ ] Nothing asks for or rewards self-harm, dangerous challenges or harassment.

## Content warnings

- [ ] All four required categories are declared, with intensities matching the content.
- [ ] Sensitive topics carry warnings: self-harm or suicide, harm to minors, harassment or hate, flashing
      lights, and content resembling real events.
- [ ] Warning notes say **what** is present, never when or how (no spoilers).
- [ ] Every jump scare and flashing scene is tagged with `scene` flags, with `skippable` and `skipText` where
      the scene can be skipped without breaking the game.
- [ ] Sudden loud sounds are marked `sudden: true`.
- [ ] Broadcast permission and note match what the creator wants.

## Completability

- [ ] Played start to finish with no dead ends. Every answer can be found from in-game content.
- [ ] Each puzzle's three hint tiers actually lead to the answer, and Tier 3 gives it.
- [ ] Alternative correct spellings are accepted (extra answer hashes where needed).
- [ ] Hidden-from-search pages become findable when the story needs them.
- [ ] Played once with Reduced Mode on, and once with keyboard only.

## Sign-off

- [ ] `npm run validate -- <slug>` passes with no errors, and warnings were reviewed.
- [ ] `npm run work-status -- <slug> published`
