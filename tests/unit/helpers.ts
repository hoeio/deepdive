import { hashAnswer } from "@/content/answers";

// A minimal valid work. Tests clone it and break one thing at a time.
export function baseWork() {
  return {
    schemaVersion: 1,
    slug: "t",
    title: "T",
    status: "published",
    creator: "c",
    blurb: "b",
    description: "d",
    genres: ["mystery"],
    playTimeMinutes: { min: 5, max: 10 },
    difficulty: "beginner",
    warnings: {
      sexual_content: { intensity: "none" },
      graphic_violence: { intensity: "none" },
      horror: { intensity: "none" },
      jump_scares: { intensity: "none" },
    },
    broadcast: { permission: "allowed" },
    startUrl: "https://a.example/",
    pages: [
      { id: "home", url: "https://a.example/", title: "Home", body: "Go [next](https://a.example/next)" },
      { id: "next", url: "https://a.example/next", title: "Next page", body: "The answer is near." },
      { id: "secret", url: "https://a.example/secret", title: "Secret", body: "Locked page.", search: "hidden_until_unlocked" },
    ],
    mails: [{ id: "m1", from: { name: "Ann", address: "ann@a.example" }, subject: "Hello", body: "Hi" }],
    documents: [] as unknown[],
    puzzles: [
      { id: "p1", title: "One", prompt: "?", answerHashes: [hashAnswer("t", "p1", "alpha")], hints: { direction: "a", where: "b", answer: "c" } },
      { id: "p2", title: "Two", prompt: "?", answerHashes: [hashAnswer("t", "p2", "beta")], hints: { direction: "a", where: "b", answer: "c" } },
    ],
    gates: [
      { id: "g1", when: { solved: ["p1"] }, unlocks: { puzzles: ["p2"], pages: ["secret"], search: ["secret"] } },
    ],
    ending: { requires: ["p2"], title: "End", body: "Done" },
  };
}

export const ctx = (assets: Record<string, string | null> = {}) => ({
  dirName: "t",
  creators: new Set(["c"]),
  assets: new Map(Object.entries(assets)),
});
