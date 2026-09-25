import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['test/**/*.test.ts'],
    // Browser tests run separately with `vitest.browser.config.ts`
    exclude: [...configDefaults.exclude, 'test/**/*.browser.test.ts'],
  },
});
