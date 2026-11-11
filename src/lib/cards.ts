import type { Work } from "@/content/schema";

// The public, spoiler-free subset of a work. This is all the discovery pages ever send to the client.
export type WorkCard = Pick<Work, "slug" | "title" | "blurb" | "genres" | "playTimeMinutes" | "difficulty" | "warnings" | "broadcast" | "creator">;

export const toCard = (w: Work): WorkCard => ({
  slug: w.slug,
  title: w.title,
  blurb: w.blurb,
  genres: w.genres,
  playTimeMinutes: w.playTimeMinutes,
  difficulty: w.difficulty,
  warnings: w.warnings,
  broadcast: w.broadcast,
  creator: w.creator,
});
