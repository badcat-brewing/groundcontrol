import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['scanner/__tests__/**/*.test.ts'],
  },
});
