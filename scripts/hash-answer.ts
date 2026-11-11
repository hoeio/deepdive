// Prints the answer hash to paste into a puzzle's answerHashes.
// Usage: npm run hash-answer -- <work-slug> <puzzle-id> "<answer>"
import { hashAnswer, normalizeAnswer } from "../src/content/answers";

const [slug, puzzleId, ...rest] = process.argv.slice(2);
const answer = rest.join(" ");
if (!slug || !puzzleId || !answer) {
  console.error('Usage: npm run hash-answer -- <work-slug> <puzzle-id> "<answer>"');
  process.exit(1);
}
console.error(`normalized: "${normalizeAnswer(answer)}"`);
console.log(hashAnswer(slug, puzzleId, answer));
