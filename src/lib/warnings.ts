import { INTENSITIES, REQUIRED_WARNINGS, WARNING_CATEGORIES, type Intensity, type WarningCategory, type Work } from "@/content/schema";

export const rank = (i: Intensity) => INTENSITIES.indexOf(i);

// Categories present at mild or above, strongest first.
export function presentWarnings(warnings: Work["warnings"]): { category: WarningCategory; intensity: Intensity; note?: string }[] {
  return WARNING_CATEGORIES.flatMap((category) => {
    const w = warnings[category];
    return w && w.intensity !== "none" ? [{ category, intensity: w.intensity, note: w.note }] : [];
  }).sort((a, b) => rank(b.intensity) - rank(a.intensity));
}

export function highestIntensity(warnings: Work["warnings"]): Intensity {
  return presentWarnings(warnings)[0]?.intensity ?? "none";
}

// Every required category plus any declared optional one, for the detail and consent pages.
export function declaredWarnings(warnings: Work["warnings"]) {
  return WARNING_CATEGORIES.filter((c) => (REQUIRED_WARNINGS as readonly string[]).includes(c) || warnings[c]).map((category) => ({
    category,
    intensity: warnings[category]?.intensity,
    note: warnings[category]?.note,
  }));
}
