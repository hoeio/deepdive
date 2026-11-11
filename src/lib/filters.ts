import type { WarningCategory } from "@/content/schema";
import type { WorkCard } from "./cards";

export type Filters = { genre: string; time: string; difficulty: string; broadcast: string };
export const noFilters: Filters = { genre: "", time: "", difficulty: "", broadcast: "" };

export function matches(w: WorkCard, f: Filters, hidden: WarningCategory[]): boolean {
  const { min, max } = w.playTimeMinutes;
  if (f.genre && !w.genres.includes(f.genre as WorkCard["genres"][number])) return false;
  if (f.difficulty && w.difficulty !== f.difficulty) return false;
  if (f.broadcast && w.broadcast.permission !== f.broadcast) return false;
  if (f.time === "short" && min > 30) return false;
  if (f.time === "medium" && (max < 30 || min > 60)) return false;
  if (f.time === "long" && max <= 60) return false;
  return !hidden.some((c) => (w.warnings[c]?.intensity ?? "none") !== "none");
}
