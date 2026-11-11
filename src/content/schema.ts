import { z } from "zod";

// Content package schema, version 1. Documented in docs/CONTENT_SCHEMA.md.
// Declarative only: no code, no raw HTML. Bodies are Markdown, sanitized at render time.
export const SCHEMA_VERSION = 1;

export const REQUIRED_WARNINGS = ["sexual_content", "graphic_violence", "horror", "jump_scares"] as const;
export const OPTIONAL_WARNINGS = [
  "self_harm",
  "minors_harm",
  "harassment_hate",
  "flashing",
  "real_events",
] as const;
export const WARNING_CATEGORIES = [...REQUIRED_WARNINGS, ...OPTIONAL_WARNINGS] as const;
export type WarningCategory = (typeof WARNING_CATEGORIES)[number];

export const INTENSITIES = ["none", "mild", "moderate", "strong"] as const;
export type Intensity = (typeof INTENSITIES)[number];

export const STATUSES = ["draft", "in_review", "published", "unpublished"] as const;
export const BROADCAST = ["allowed", "allowed_with_spoiler_restrictions", "not_allowed"] as const;
export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const GENRES = ["tutorial", "mystery", "puzzle", "horror", "sci_fi", "drama", "comedy"] as const;
export const SEARCH_VISIBILITY = ["visible", "hidden", "hidden_until_unlocked"] as const;

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "ids use lowercase letters, digits and dashes");
const text = z.string().min(1);

const warning = z.object({
  intensity: z.enum(INTENSITIES),
  note: z.string().max(200).optional(),
});

// Scene-level flags so the runtime can show a pre-notice in Reduced Mode.
const scene = z
  .object({
    jumpScare: z.boolean().optional(),
    flashing: z.boolean().optional(),
    skippable: z.boolean().optional(),
    skipText: z.string().optional(), // shown instead of the node when the player skips it
  })
  .optional();

// A sound played when a node opens. `sudden: true` marks it loud/sudden: muted in Reduced Mode.
const sound = z.object({ asset: text, sudden: z.boolean().optional() }).optional();

const nodeBase = {
  id,
  search: z.enum(SEARCH_VISIBILITY).default("visible"),
  keywords: z.array(z.string()).default([]),
  scene,
  sound,
};

export const pageSchema = z.object({
  ...nodeBase,
  url: z.string().regex(/^https?:\/\//, "page url must start with http:// or https://"),
  title: text,
  body: text,
});

const address = z.object({ name: text, address: text });

export const mailSchema = z.object({
  ...nodeBase,
  from: address,
  subject: text,
  date: z.string().optional(), // display only, in-fiction
  body: text,
});

export const documentSchema = z.object({
  ...nodeBase,
  title: text,
  kind: z.enum(["text", "image", "pdf", "audio", "video"]),
  asset: z.string().optional(), // required for non-text kinds (checked by validator)
  body: z.string().optional(), // text kind: content. other kinds: caption / transcript
  alt: z.string().optional(), // image alt text
});

export const puzzleSchema = z.object({
  id,
  title: text, // spoiler-free label, e.g. "Find the founder"
  prompt: text,
  answerHashes: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).min(1),
  hints: z.object({ direction: text, where: text, answer: text }),
});

const unlocks = z
  .object({
    pages: z.array(id).default([]),
    mails: z.array(id).default([]),
    documents: z.array(id).default([]),
    puzzles: z.array(id).default([]),
    search: z.array(id).default([]), // nodes with search: hidden_until_unlocked
  })
  .default({ pages: [], mails: [], documents: [], puzzles: [], search: [] });

export const gateSchema = z.object({
  id,
  when: z.object({ solved: z.array(id).min(1) }),
  unlocks,
});

export const workSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  slug: id,
  title: text,
  status: z.enum(STATUSES),
  creator: id,
  blurb: z.string().min(1).max(200),
  description: text,
  genres: z.array(z.enum(GENRES)).min(1),
  playTimeMinutes: z.object({ min: z.number().int().positive(), max: z.number().int().positive() }),
  difficulty: z.enum(DIFFICULTIES),
  // Partial here; the validator enforces the required four for any non-draft work.
  warnings: z.partialRecord(z.enum(WARNING_CATEGORIES), warning),
  broadcast: z.object({ permission: z.enum(BROADCAST), note: z.string().optional() }),
  startUrl: text,
  pages: z.array(pageSchema).min(1),
  mails: z.array(mailSchema).default([]),
  documents: z.array(documentSchema).default([]),
  puzzles: z.array(puzzleSchema).min(1),
  gates: z.array(gateSchema).default([]),
  ending: z.object({ requires: z.array(id).min(1), title: text, body: text }),
});

export const creatorSchema = z.object({
  id,
  name: text,
  bio: text,
  warningPolicy: text,
  broadcastPolicy: text,
});

export type Work = z.infer<typeof workSchema>;
export type Page = z.infer<typeof pageSchema>;
export type Mail = z.infer<typeof mailSchema>;
export type Doc = z.infer<typeof documentSchema>;
export type Puzzle = z.infer<typeof puzzleSchema>;
export type Gate = z.infer<typeof gateSchema>;
export type Creator = z.infer<typeof creatorSchema>;
export type NodeKind = "pages" | "mails" | "documents";
