import { defineConfig, devices } from "@playwright/test";

// The ADW test phase runs the suite as `PORT=<run port> yarn test:e2e` against
// the server /prepare_app already started on that port; 3000 is only the local
// default.
const PORT = process.env.PORT ?? "3000";
const BASE_URL = `http://localhost:${PORT}`;

// The review viewport, the same as playwright-mcp-config.json. Specs that need
// 375 or 390 call page.setViewportSize themselves.
const VIEWPORT = { width: 1920, height: 1080 };

export default defineConfig({
  testDir: "./e2e",
  // e2e/*.md are agent-driven journeys the test phase runs through the MCP;
  // they must never be collected.
  testMatch: "**/*.spec.ts",
  forbidOnly: !!process.env.CI,
  // A flaky spec should fail, not be retried into green, locally and in CI.
  retries: 0,
  use: {
    baseURL: BASE_URL,
    viewport: VIEWPORT,
  },
  // The suite is Chromium. WebKit runs only the minimap spec, which once broke
  // only in Safari's engine; Firefox is out of scope. The device presets bring
  // their own 1280x720 viewport, so the review one is repeated after them.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: VIEWPORT } },
    {
      name: "webkit",
      testMatch: /post_minimap\.spec\.ts$/,
      use: { ...devices["Desktop Safari"], viewport: VIEWPORT },
    },
  ],
  webServer: {
    // CI has just run `yarn build`; locally the ADW run's server is usually
    // already up and adopted.
    command: process.env.CI ? "yarn start" : "yarn dev",
    url: BASE_URL,
    // This is how the /prepare_app server on the run's port is adopted; never
    // set CI=1 in an ADW run.
    reuseExistingServer: !process.env.CI,
    // The first `next dev` compile of / plus the database read can be slow.
    timeout: 120_000,
    // Let next close its sockets before any fallback SIGKILL.
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    // Pins the spawned server to the port baseURL points at; `next dev` and
    // `next start` both read PORT, so nothing passes --port.
    env: { PORT },
  },
});
