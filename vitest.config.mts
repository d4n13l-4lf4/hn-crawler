import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'dist/',
        'node_modules/',
        'src/presentation/main.ts',
        'src/**/*.d.ts',
        'src/**/ports/**/*.ts',
        'src/**/*.type.ts'
      ],
      thresholds: {
        perFile: true,
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    environment: 'node',
  },
});
