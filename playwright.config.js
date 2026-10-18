import { defineConfig, devices } from "@playwright/test";

// Runs against the production build served by `astro preview`.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: "http://localhost:4321/verbos/" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npx astro preview --port 4321", url: "http://localhost:4321/verbos/", reuseExistingServer: !process.env.CI, stdout: "pipe", stderr: "pipe" },
});
