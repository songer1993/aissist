import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    // E2E tests need longer timeouts for subprocess execution
    testTimeout: 60000, // 60s for E2E tests
    hookTimeout: 60000, // 60s for setup/teardown hooks
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.{test,spec}.ts',
        '**/types.ts',
        'src/__tests__/mocks/**',
        'src/__tests__/helpers/**',
      ],
    },
  },
});
