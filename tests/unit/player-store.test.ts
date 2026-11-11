import { describe, expect, it } from "vitest";
import { emptyProgress, LocalPlayerStore } from "@/lib/player-store";

function fakeKV() {
  const m = new Map<string, string>();
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe("LocalPlayerStore", () => {
  it("saves, resumes and resets progress per work", async () => {
    const kv = fakeKV();
    const s = new LocalPlayerStore(kv);
    const p = { ...emptyProgress(), proofs: { p1: "x" }, notes: "clue", lastUrl: "https://a.example/" };
    await s.saveProgress("w1", p);
    const resumed = await new LocalPlayerStore(kv).loadProgress("w1");
    expect(resumed.proofs).toEqual({ p1: "x" });
    expect(resumed.notes).toBe("clue");
    expect((await s.loadProgress("w2")).proofs).toEqual({});
    await s.resetProgress("w1");
    expect(await s.loadProgress("w1")).toEqual(emptyProgress());
  });

  it("recovers from corrupted storage", async () => {
    const kv = fakeKV();
    kv.m.set("ddv:progress:w", "{not json");
    kv.m.set("ddv:settings", "42");
    const s = new LocalPlayerStore(kv);
    expect(await s.loadProgress("w")).toEqual(emptyProgress());
    expect((await s.loadSettings()).reducedMode).toBe(false);
  });

  it("remembers settings and consent per work", async () => {
    const s = new LocalPlayerStore(fakeKV());
    await s.saveSettings({ reducedMode: true, broadcastMode: false, hiddenWarnings: ["horror"] });
    expect((await s.loadSettings()).hiddenWarnings).toEqual(["horror"]);
    expect(await s.getConsent("w")).toBeNull();
    await s.setConsent("w", { accepted: true, at: "now" });
    expect((await s.getConsent("w"))?.accepted).toBe(true);
    expect(await s.getConsent("other")).toBeNull();
  });
});
