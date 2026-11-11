import { describe, expect, it } from "vitest";
import { checkAnswer, hashAnswer, normalizeAnswer } from "@/content/answers";

describe("normalizeAnswer", () => {
  it("ignores case, spaces, punctuation and accents", () => {
    expect(normalizeAnswer("  Wrén  Talbot! ")).toBe("wrentalbot");
    expect(normalizeAnswer("L-A-N-T-E-R-N")).toBe("lantern");
    expect(normalizeAnswer("ＬＡＮＴＥＲＮ")).toBe("lantern"); // full-width
  });
  it("keeps digits, including leading zeros", () => {
    expect(normalizeAnswer("007")).toBe("007");
    expect(normalizeAnswer("1,923")).toBe("1923");
  });
});

describe("hashAnswer / checkAnswer", () => {
  it("is stable and salted per work and puzzle", () => {
    const h = hashAnswer("w", "p", "Alpha");
    expect(h).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(hashAnswer("w", "p", " alpha ")).toBe(h);
    expect(hashAnswer("w", "q", "alpha")).not.toBe(h);
    expect(hashAnswer("x", "p", "alpha")).not.toBe(h);
  });
  it("accepts any listed hash and rejects empty input", () => {
    const hashes = [hashAnswer("w", "p", "one"), hashAnswer("w", "p", "1")];
    expect(checkAnswer("w", "p", "ONE", hashes)).toBe(true);
    expect(checkAnswer("w", "p", "1", hashes)).toBe(true);
    expect(checkAnswer("w", "p", "two", hashes)).toBe(false);
    expect(checkAnswer("w", "p", "!!!", hashes)).toBe(false);
  });
});
