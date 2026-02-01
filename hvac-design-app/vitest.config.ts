import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', 'e2e/', 'src-tauri/'],
    deps: {
      // Inline Tauri modules so mocks work with dynamic imports
      inline: [/@tauri-apps/],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/core/**/*.{ts,tsx}',
        'src/features/canvas/**/*.{ts,tsx}',
        'src/features/export/**/*.{ts,tsx}',
        'src/stores/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        '.next/',
        'src/__tests__/',
        'src/features/canvas/components/Inspector/**',
        'src/features/canvas/components/**',
        'src/features/dashboard/**',
        'src/features/export/components/**',
        'src/features/export/services/**',
        'src/features/export/download.ts',
        'src/features/canvas/hooks/useKeyboardShortcuts.ts',
        'src/features/canvas/clipboard/clipboardAdapter.ts',
        '**/*.config.{js,ts}',
        '**/types/**',
        'e2e/',
        '**/*.d.ts',
        '**/index.ts', // Barrel exports
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
      all: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      // Alias Tauri v1 API paths to the v2 mocks module for test compatibility
      '@tauri-apps/api/fs': path.resolve(__dirname, 'node_modules/@tauri-apps/api/mocks.js'),
      '@tauri-apps/api/path': path.resolve(__dirname, 'node_modules/@tauri-apps/api/path.js'),
      '@tauri-apps/api/dialog': path.resolve(__dirname, 'node_modules/@tauri-apps/api/mocks.js'),
      '@tauri-apps/api/tauri': path.resolve(__dirname, 'node_modules/@tauri-apps/api/core.js'),
    },
  },
});

