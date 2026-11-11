import { describe, expect, it } from "vitest";
import { loadCreators, validateDir, workDirs } from "@/content/loader";
import { validateWork } from "@/content/validate";
import { baseWork, ctx } from "./helpers";

const errors = (raw: unknown, c = ctx()) => validateWork(raw, c).filter((i) => i.level === "error").map((i) => i.message);

describe("content validator", () => {
  it("accepts the base work", () => {
    expect(errors(baseWork())).toEqual([]);
  });

  it("accepts every shipped work and fixture", () => {
    const creators = new Set(loadCreators().keys());
    for (const wd of workDirs({ fixtures: true })) {
      expect(validateDir(wd, creators).filter((i) => i.level === "error"), wd.name).toEqual([]);
    }
  });

  it("rejects external URLs and resources", () => {
    const w = baseWork();
    w.pages[0].body = "See https://real-site.com/page and ![x](https://cdn.real.com/a.png)";
    expect(errors(w).join("\n")).toMatch(/external URL not allowed: https:\/\/real-site\.com/);
    const w2 = baseWork();
    w2.pages[1].body = "Visit www.realbank.com today";
    expect(errors(w2).join("\n")).toMatch(/real-looking web address/);
  });

  it("rejects real-looking emails and phone numbers, allows fictional ones", () => {
    const w = baseWork();
    w.mails[0].body = "Write to boss@gmail.com or call (212) 555-1234.";
    const e = errors(w).join("\n");
    expect(e).toMatch(/email must use a reserved fictional domain: boss@gmail\.com/);
    expect(e).toMatch(/phone number/);
    const ok = baseWork();
    ok.mails[0].body = "Write to boss@corp.example or call 555-0123.";
    expect(errors(ok)).toEqual([]);
  });

  it("rejects raw HTML that can run or load code", () => {
    const w = baseWork();
    w.pages[1].body = "<iframe src='x'></iframe>";
    expect(errors(w).join("\n")).toMatch(/raw HTML/);
  });

  it("requires the four required warnings unless draft", () => {
    const w = baseWork() as Omit<ReturnType<typeof baseWork>, "warnings"> & { warnings: Record<string, unknown> };
    delete w.warnings.horror;
    expect(errors(w).join("\n")).toMatch(/warnings.*required warning must be declared|required warning must be declared/);
    w.status = "draft";
    expect(errors(w)).toEqual([]);
    expect(validateWork(w, ctx()).some((i) => i.level === "warning" && i.path === "warnings.horror")).toBe(true);
  });

  it("rejects missing assets and SVGs that reference outside resources", () => {
    const w = baseWork();
    w.documents = [{ id: "img", title: "Img", kind: "image", asset: "a.png", alt: "x" }];
    w.pages[1].body = "![pic](asset:b.png) [doc](doc:img)";
    expect(errors(w).join("\n")).toMatch(/missing asset: a\.png[\s\S]*missing asset: b\.png|missing asset: b\.png[\s\S]*missing asset: a\.png/);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.com/x.png"/></svg>`;
    expect(errors(w, ctx({ "a.png": null, "b.png": null, "x.svg": svg })).join("\n")).toMatch(/external URL|SVG may only/);
    expect(errors(w, ctx({ "a.png": null, "b.png": null, "x.svg": `<svg xmlns="http://www.w3.org/2000/svg"/>` }))).toEqual([]);
  });

  it("rejects broken internal links and unknown documents", () => {
    const w = baseWork();
    w.pages[0].body = "[gone](https://a.example/missing) [d](doc:nope) [rel](/about)";
    const e = errors(w).join("\n");
    expect(e).toMatch(/broken internal link/);
    expect(e).toMatch(/unknown document/);
    expect(e).toMatch(/unsupported link target/);
  });

  it("rejects unreachable puzzles and an unreachable ending", () => {
    const w = baseWork();
    w.gates.push({ id: "g2", when: { solved: ["p2"] }, unlocks: { puzzles: ["p1"], pages: [], search: [] } }); // p1 <-> p2 deadlock
    const e = errors(w).join("\n");
    expect(e).toMatch(/unreachable puzzle "p1"/);
    expect(e).toMatch(/ending is unreachable/);
  });

  it("rejects duplicate ids and duplicate URLs", () => {
    const w = baseWork();
    w.mails[0].id = "home";
    w.pages[2].url = "https://a.example/next/";
    const e = errors(w).join("\n");
    expect(e).toMatch(/duplicate id "home"/);
    expect(e).toMatch(/duplicate page URL/);
  });

  it("rejects scene flags that contradict the declared warnings", () => {
    const w = baseWork() as ReturnType<typeof baseWork> & { pages: { scene?: object }[] };
    w.pages[1].scene = { jumpScare: true };
    expect(errors(w).join("\n")).toMatch(/jump scare/);
  });

  it("rejects a locked start page and schema errors", () => {
    const w = baseWork();
    w.startUrl = "https://a.example/secret";
    expect(errors(w).join("\n")).toMatch(/start page must not be locked/);
    expect(errors({ ...baseWork(), difficulty: "impossible" }).length).toBeGreaterThan(0);
  });
});
