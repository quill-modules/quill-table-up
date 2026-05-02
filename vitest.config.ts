import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  test: {
    clearMocks: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './vitest.setup.ts')],
    include: ['**/__tests__/unit/*.{test,spec}.ts'],
    exclude: ['**/dits/**', '**/node_modules/**'],
    coverage: {
      reportsDirectory: resolve(__dirname, 'coverage'),
      reporter: ['html'],
      enabled: true,
    },
    typecheck: {
      include: ['**/__tests__/unit/*.{test,spec}-d.ts'],
      enabled: true,
    },
  },
});
