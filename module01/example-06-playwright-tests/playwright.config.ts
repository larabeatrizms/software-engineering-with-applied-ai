import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://erickwendel.github.io/vanilla-js-web-app-example/',
    actionTimeout: 5_000,
    headless: !!process.env.CI,
    channel: process.env.CI ? undefined : 'chrome',
  },
  expect: {
    timeout: 5_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
