// Content validator CLI. Usage: npm run validate [-- <slug> ...]
// Validates content/works and content/fixtures. Exits 1 if any error is found.
import { loadCreators, validateDir, workDirs } from "../src/content/loader";

const only = process.argv.slice(2);
const creators = new Set(loadCreators().keys());
const dirs = workDirs({ fixtures: true }).filter((d) => only.length === 0 || only.includes(d.name));
if (dirs.length === 0) {
  console.error("No works found.");
  process.exit(1);
}

let errors = 0;
for (const wd of dirs) {
  const issues = validateDir(wd, creators);
  const e = issues.filter((i) => i.level === "error").length;
  errors += e;
  console.log(`${e ? "✗" : "✓"} ${wd.fixture ? "fixtures" : "works"}/${wd.name}${issues.length ? "" : "  (clean)"}`);
  for (const i of issues) console.log(`    ${i.level === "error" ? "ERROR" : "warn "} ${i.path}: ${i.message}`);
}
console.log(errors ? `\n${errors} error(s).` : "\nAll works valid.");
process.exit(errors ? 1 : 0);
