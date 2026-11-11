import { expect, test, type Page } from "@playwright/test";

async function enterWork(page: Page, slug: string, opts: { reduced?: boolean } = {}) {
  await page.goto(`/works/${slug}`);
  await page.getByRole("link", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: /Before you start/ })).toBeVisible();
  const enter = page.getByRole("button", { name: "Enter the game" });
  await expect(enter).toBeDisabled();
  if (opts.reduced) await page.getByLabel(/Turn on Reduced Mode/).check();
  await page.getByLabel("I understand the content warnings").check();
  await enter.click();
  await expect(page.getByRole("tablist", { name: "Apps" })).toBeVisible();
}

const tab = (page: Page, name: string) => page.getByRole("tab", { name: new RegExp(`^${name}`) });

test("browse and filter works by warning, broadcast and genre", async ({ page }) => {
  await page.goto("/works");
  const cards = page.getByTestId("work-card");
  await expect(cards).toHaveCount(3);
  await expect(page.getByText("Fixture: Unfinished Draft")).toHaveCount(0); // drafts never appear

  await page.getByRole("checkbox", { name: "Horror" }).check();
  await expect(cards).toHaveCount(2);
  await expect(page.getByText("Fixture: Night Shift")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Horror" }).uncheck();

  await page.getByLabel("Broadcast").selectOption("not_allowed");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("No streaming");
  await page.getByRole("button", { name: "Clear filters" }).click();

  await page.getByLabel("Genre").selectOption("tutorial");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("The Quiet Frequency");
});

test("work detail shows collapsed warnings and broadcast permission; report can be sent", async ({ page }) => {
  await page.goto("/works/quiet-frequency");
  const jump = page.getByTestId("warning-list").locator("details", { hasText: "Jump scares" });
  await expect(jump.getByText("One sudden radio crackle")).toBeHidden();
  await jump.locator("summary").click();
  await expect(jump.getByText("One sudden radio crackle")).toBeVisible();
  await expect(page.getByTestId("broadcast-badge").first()).toContainText("Streaming allowed");

  await page.getByText("Report this work").click();
  await page.getByLabel("Reason").selectOption("broken");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByText(/Your report was sent/)).toBeVisible();
});

test("play the tutorial to the end, using search, mail, files, answers and hints", async ({ page }) => {
  await enterWork(page, "quiet-frequency");
  await expect(page.getByRole("heading", { name: "Halden Public Library" })).toBeVisible();
  await expect(page.getByTestId("progress")).toHaveText("Progress: 0 of 3 steps");

  // Mail: the guide's welcome message.
  await tab(page, "Mail").click();
  await page.getByRole("button", { name: /Welcome! Can you help me/ }).click();
  await expect(page.getByText("I'm Iris, the archivist")).toBeVisible();

  // Unknown URL shows the in-fiction not-found page.
  await tab(page, "Browser").click();
  await page.getByLabel("Address").fill("halden-library.example/nope");
  await page.getByRole("button", { name: "Go" }).click();
  await expect(page.getByTestId("page-not-found")).toBeVisible();

  // Search finds the unlinked archive page.
  await page.getByRole("button", { name: "Seek", exact: true }).click();
  await page.getByRole("searchbox").fill("radio circle");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByTestId("seek-results").getByRole("button", { name: /Local history: the Halden Radio Circle/ }).click();
  await expect(page.getByText("Wren Talbot", { exact: false }).first()).toBeVisible();

  // Answer check: wrong, then right.
  await tab(page, "Answers").click();
  const founder = page.getByTestId("puzzle-founder");
  await founder.getByLabel("Your answer").fill("nobody");
  await founder.getByRole("button", { name: "Check" }).click();
  await expect(founder.getByText("That's not it")).toBeVisible();
  await founder.getByLabel("Your answer").fill("wren TALBOT");
  await founder.getByRole("button", { name: "Check" }).click();
  await expect(page.getByTestId("announce")).toHaveText("You have 1 new message");
  await expect(page.getByTestId("progress")).toHaveText("Progress: 1 of 3 steps");

  // Hints: tied to progress, one tier at a time.
  await page.getByRole("link", { name: "Hints" }).click();
  const hint = page.getByTestId("hint-code-word");
  await expect(hint).toBeVisible();
  await expect(page.getByTestId("hint-capsule-code")).toHaveCount(0); // not reached yet
  await hint.getByRole("button", { name: "Reveal tier 1" }).click();
  await expect(hint).toContainText("plain sight");
  await expect(hint.getByRole("button", { name: "Reveal tier 2" })).toBeVisible();
  await expect(hint).not.toContainText("LANTERN");
  await page.getByRole("link", { name: "Back to the game" }).click();

  // Files: the unlocked newsletter.
  await tab(page, "Files").click();
  await page.getByRole("button", { name: /Radio Circle newsletter/ }).click();
  await expect(page.getByRole("img", { name: /The Circle Times/ })).toBeVisible();
  await tab(page, "Answers").click();
  await page.getByTestId("puzzle-code-word").getByLabel("Your answer").fill("Lantern");
  await page.getByTestId("puzzle-code-word").getByRole("button", { name: "Check" }).click();
  await expect(page.getByTestId("progress")).toHaveText("Progress: 2 of 3 steps");

  // Mail link opens the newly unlocked basement page (jump-scare node, effects on without Reduced Mode).
  await tab(page, "Mail").click();
  await page.getByRole("button", { name: /The basement door opened/ }).click();
  await page.getByRole("link", { name: "see the basement" }).click();
  await expect(page.getByTestId("scene-content")).toHaveClass(/fx-jumpscare/);
  await expect(page.getByRole("heading", { name: "The basement" })).toBeVisible();

  await tab(page, "Answers").click();
  await page.getByTestId("puzzle-capsule-code").getByLabel("Your answer").fill("1923");
  await page.getByTestId("puzzle-capsule-code").getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("dialog", { name: "Keep listening" })).toBeVisible();
  await page.getByRole("button", { name: "Back to the game" }).click();
  await expect(page.getByTestId("progress")).toHaveText("Progress: 3 of 3 steps");

  // Progress survives a reload (autosave + resume).
  await page.reload();
  await expect(page.getByTestId("progress")).toHaveText("Progress: 3 of 3 steps");
});

test("Reduced Mode shows a pre-notice before tagged scenes and allows skipping", async ({ page }) => {
  await enterWork(page, "fixture-night-shift", { reduced: true });
  await page.getByRole("link", { name: "Go to the stairwell" }).click();
  const notice = page.getByTestId("scene-notice");
  await expect(notice).toContainText("flashing or strobing");
  await expect(page.getByText("The lights strobe wildly")).toHaveCount(0);
  await notice.getByRole("button", { name: "Skip this" }).click();
  await expect(page.getByTestId("scene-skipped")).toContainText("A sign reads TEST");

  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("link", { name: "Go to the stairwell" }).click();
  await page.getByTestId("scene-notice").getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("The lights strobe wildly")).toBeVisible();
  await expect(page.getByTestId("scene-content")).not.toHaveClass(/fx-flashing/); // effects stay off
});

test("Broadcast Mode repeats the warning summary, hides hints and warns before the ending", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Broadcast Mode").check();
  await expect(page.getByText("Broadcast Mode on")).toBeVisible();

  await enterWork(page, "fixture-orbit");
  await page.goto("/works/fixture-orbit/start"); // remembered consent still shows the summary on stream
  await expect(page.getByTestId("stream-summary")).toBeVisible();
  await page.goto("/works/fixture-orbit/hints");
  await expect(page.getByText(/Hints are hidden in Broadcast Mode/)).toBeVisible();

  await page.goto("/works/fixture-orbit/play");
  await tab(page, "Answers").click();
  await page.getByTestId("puzzle-log").getByLabel("Your answer").fill("orbit");
  await page.getByTestId("puzzle-log").getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("dialog", { name: "The ending is next" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Show the ending" }).click();
  await expect(page.getByRole("dialog", { name: "Docked" })).toBeVisible();
});

test("keyboard-only: tab through the shell and switch apps with arrow keys", async ({ page }) => {
  await enterWork(page, "fixture-orbit");
  await tab(page, "Browser").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Mail")).toBeFocused();
  await expect(tab(page, "Mail")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Answers")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Your answer")).toBeFocused();
  await page.keyboard.type("orbit");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Docked" })).toBeVisible();
});
