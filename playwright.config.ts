import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3111",
    locale: "fr-FR",
    // Utilise le Chromium système s'il est fourni (variable optionnelle),
    // sinon le navigateur téléchargé par `npx playwright install chromium`.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: "npx next start -p 3111",
    url: "http://localhost:3111",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
