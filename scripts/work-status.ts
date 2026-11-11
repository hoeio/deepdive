// Minimal admin CLI to change a work's status.
// Usage: npm run work-status -- <slug> <draft|in_review|published|unpublished>
// Moving to in_review or published requires a clean validation (no errors).
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { loadCreators, validateDir, workDirs } from "../src/content/loader";
import { STATUSES } from "../src/content/schema";

const [slug, status] = process.argv.slice(2);
if (!slug || !STATUSES.includes(status as (typeof STATUSES)[number])) {
  console.error(`Usage: npm run work-status -- <slug> <${STATUSES.join("|")}>`);
  process.exit(1);
}
const wd = workDirs({ fixtures: true }).find((d) => d.name === slug);
if (!wd) {
  console.error(`No work "${slug}".`);
  process.exit(1);
}
if (status === "in_review" || status === "published") {
  const errors = validateDir(wd, new Set(loadCreators().keys())).filter((i) => i.level === "error");
  if (errors.length) {
    console.error(`Cannot set ${status}: ${errors.length} validation error(s). Run npm run validate -- ${slug}`);
    process.exit(1);
  }
}
const file = path.join(wd.dir, "work.yaml");
const doc = YAML.parseDocument(fs.readFileSync(file, "utf8"));
const from = doc.get("status");
doc.set("status", status);
fs.writeFileSync(file, doc.toString());
console.log(`${slug}: ${from} -> ${status}. Restart the server to apply.`);
