// playwright.config.ts
// End-to-end test configuration (85%+ High First Class requirement)

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,    // Run sequentially – tests share DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL:       'http://localhost:5173',
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Start both servers before running tests
  webServer: [
    {
      command:   'cd backend && npm run dev',
      port:      4000,
      reuseExistingServer: !process.env.CI,
      timeout:   30_000,
    },
    {
      command:   'cd frontend && npm run dev',
      port:      5173,
      reuseExistingServer: !process.env.CI,
      timeout:   30_000,
    },
  ],
});
