import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  webServer: {
    command: "npx vite --port 5199",
    url: "http://localhost:5199",
    reuseExistingServer: true,
    timeout: 30000,
  },
  use: {
    baseURL: "http://localhost:5199",
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
