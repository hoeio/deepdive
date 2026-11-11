import { describe, expect, it } from "vitest";
import { access, reachability } from "@/content/engine";
import { makeProof, verifyProofs } from "@/content/proof";
import { workSchema } from "@/content/schema";
import { baseWork } from "./helpers";

const work = workSchema.parse(baseWork());

describe("gates", () => {
  it("locks gated nodes until their gate opens", () => {
    const a = access(work, new Set());
    expect(a.isUnlocked("puzzles", "p1")).toBe(true);
    expect(a.isUnlocked("puzzles", "p2")).toBe(false);
    expect(a.isUnlocked("pages", "secret")).toBe(false);
    expect(a.isUnlocked("pages", "home")).toBe(true);
    const b = access(work, new Set(["p1"]));
    expect(b.isUnlocked("puzzles", "p2")).toBe(true);
    expect(b.isUnlocked("pages", "secret")).toBe(true);
  });

  it("keeps hidden_until_unlocked nodes out of search until a gate unlocks search", () => {
    const secret = work.pages.find((p) => p.id === "secret")!;
    expect(access(work, new Set()).isSearchable("pages", secret)).toBe(false);
    expect(access(work, new Set(["p1"])).isSearchable("pages", secret)).toBe(true);
    expect(access(work, new Set()).isSearchable("pages", { id: "home", search: "hidden" })).toBe(false);
  });

  it("requires every puzzle of a gate", () => {
    const w = workSchema.parse({ ...baseWork(), gates: [{ id: "g", when: { solved: ["p1", "p2"] }, unlocks: { pages: ["secret"] } }] });
    expect(access(w, new Set(["p1"])).isUnlocked("pages", "secret")).toBe(false);
    expect(access(w, new Set(["p1", "p2"])).isUnlocked("pages", "secret")).toBe(true);
  });

  it("reports the ending once required puzzles are solved", () => {
    expect(access(work, new Set(["p1"])).ended).toBe(false);
    expect(access(work, new Set(["p1", "p2"])).ended).toBe(true);
    expect(reachability(work).access.ended).toBe(true);
  });
});

describe("proofs", () => {
  it("accepts only valid proofs for known puzzles", () => {
    const ok = makeProof("t", "p1");
    const solved = verifyProofs("t", { p1: ok, p2: "forged", zz: makeProof("t", "zz") }, ["p1", "p2"]);
    expect([...solved]).toEqual(["p1"]);
    expect(verifyProofs("other", { p1: ok }, ["p1"]).size).toBe(0);
  });
});
