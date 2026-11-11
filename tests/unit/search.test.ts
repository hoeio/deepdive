import { describe, expect, it } from "vitest";
import { buildIndex, search, type SearchDoc } from "@/content/search";

const docs: SearchDoc[] = [
  { kind: "pages", id: "a", title: "Radio Circle history", text: "The club met in the basement.", keywords: [] },
  { kind: "pages", id: "b", title: "Events", text: "Radio repair drop-in on Thursday. Bring radios.", keywords: [] },
  { kind: "pages", id: "c", title: "Hidden roster", text: "Radio circle members list.", keywords: ["roster"] },
  { kind: "mails", id: "m", title: "Hello", text: "A note about the library cornerstone.", keywords: [] },
];
const index = buildIndex(docs);
const all = () => true;

describe("search", () => {
  it("ranks title matches above body matches", () => {
    const ids = search(index, "radio", all).map((h) => h.id);
    expect(ids[0]).toBe("a");
    expect(ids).toEqual(expect.arrayContaining(["a", "b", "c"]));
  });
  it("prefers documents matching more query terms", () => {
    const hits = search(index, "radio circle members", all);
    expect(hits[0].id).toBe("c");
  });
  it("matches plurals and prefixes, ignores case and stop words", () => {
    expect(search(index, "RADIOS", all).length).toBe(3);
    expect(search(index, "corner", all).map((h) => h.id)).toEqual(["m"]);
    expect(search(index, "the of and", all)).toEqual([]);
  });
  it("only returns documents the caller allows", () => {
    const hits = search(index, "radio", (d) => d.id !== "c");
    expect(hits.map((h) => h.id)).not.toContain("c");
  });
  it("returns a snippet around the match", () => {
    expect(search(index, "cornerstone", all)[0].snippet).toContain("cornerstone");
  });
});
