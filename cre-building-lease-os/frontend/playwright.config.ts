import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 920 },
  },
  webServer: [
    {
      command: 'cd ../backend && SPRING_PROFILES_ACTIVE=fallback mvn spring-boot:run',
      url: 'http://127.0.0.1:8080/api/buildings',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080/api npm run dev -- --hostname 127.0.0.1 --port 3000',
      url: 'http://127.0.0.1:3000/buildings',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
