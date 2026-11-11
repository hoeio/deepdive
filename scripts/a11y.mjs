// Plain JS on purpose: tsx/esbuild injects helpers into functions Lighthouse runs in the browser.
// Lighthouse accessibility check on the main pages. Needs a production build (npm run build).
// Usage: npm run a11y            (starts `next start` on port 3200 with fixtures)
//        A11Y_BASE_URL=http://localhost:3000 npm run a11y   (use a running server)
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const MIN_SCORE = 0.95;
const PAGES = ["/", "/works", "/works/quiet-frequency", "/works/quiet-frequency/start", "/works/quiet-frequency/hints", "/creators/deepdive-team", "/settings"];

async function waitFor(url, ms = 60_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fetch(url).then((r) => r.ok, () => false)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server at ${url} did not start`);
}

async function main() {
  let server = null;
  let base = process.env.A11Y_BASE_URL;
  if (!base) {
    base = "http://localhost:3200";
    server = spawn("npx", ["next", "start", "-p", "3200"], { env: { ...process.env, DEEPDIVE_FIXTURES: "1" }, stdio: "ignore" });
    await waitFor(base);
  }
  const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
  let failed = 0;
  try {
    for (const path of PAGES) {
      const r = await lighthouse(`${base}${path}`, { port: chrome.port, onlyCategories: ["accessibility"], output: "json", logLevel: "error" });
      const lhr = r.lhr;
      const score = lhr.categories.accessibility.score ?? 0;
      const ok = score >= MIN_SCORE;
      if (!ok) failed++;
      console.log(`${ok ? "✓" : "✗"} ${Math.round(score * 100)}  ${path}`);
      for (const a of Object.values(lhr.audits)) {
        if (a.score !== null && a.score < 1 && a.scoreDisplayMode === "binary") console.log(`     - ${a.id}: ${a.title}`);
      }
    }
  } finally {
    chrome.kill();
    server?.kill();
  }
  process.exit(failed ? 1 : 0);
}

void main();
