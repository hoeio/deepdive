import { describe, expect, it } from "vitest";
import { markdownToText, renderMarkdown } from "@/content/markdown";

describe("renderMarkdown sanitizer", () => {
  it("strips scripts, event handlers and iframes", () => {
    const html = renderMarkdown(`<script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://x.com"></iframe>hi`, "w");
    expect(html).not.toMatch(/script|onerror|iframe/i);
    expect(html).toContain("hi");
  });
  it("turns fictional links into in-game links and removes real ones", () => {
    const html = renderMarkdown("[a](https://lib.example/x) [b](https://real.com) [c](javascript:alert(1)) [d](doc:letter)", "w");
    expect(html).toContain('data-ddv-href="https://lib.example/x"');
    expect(html).toContain('data-ddv-doc="letter"');
    expect(html).not.toMatch(/real\.com|javascript/);
  });
  it("rewrites asset images to the work's asset route only", () => {
    const html = renderMarkdown("![ok](asset:images/a.png) ![bad](https://cdn.com/a.png) ![up](asset:../x.png)", "w");
    expect(html).toContain('src="/api/assets/w/images/a.png"');
    expect(html).not.toMatch(/cdn\.com|\.\.\//);
  });
  it("extracts plain text", () => {
    expect(markdownToText("# Title\n\nSome **bold** & text")).toBe("Title Some bold & text");
  });
});
