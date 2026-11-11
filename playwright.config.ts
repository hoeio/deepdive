import { defineConfig, devices } from "@playwright/test";

// Runs against a production build (npm run build) with fixture works enabled.
// Set E2E_BASE_URL to reuse a server you already started (e.g. a dev server with DEEPDIVE_FIXTURES=1).
const external = process.env.E2E_BASE_URL;
const port = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: external ?? `http://localhost:${port}`, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: external
    ? undefined
    : {
        command: `npx next start -p ${port}`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        env: { DEEPDIVE_FIXTURES: "1" },
      },
});
