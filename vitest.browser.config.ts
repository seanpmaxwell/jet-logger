import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// CI runners ship Google Chrome but not Firefox or WebKit, and no browsers are
// downloaded there, so CI drives the system Chrome via Playwright's `chrome`
// channel. Locally, where `npx playwright install` has been run, all three
// engines are used.
const useSystemChrome = !!process.env.CI;

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['test/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(
        useSystemChrome ? { launchOptions: { channel: 'chrome' } } : {},
      ),
      instances: useSystemChrome
        ? [{ browser: 'chromium' }]
        : [
            { browser: 'chromium' },
            { browser: 'firefox' },
            { browser: 'webkit' },
          ],
    },
  },
});
