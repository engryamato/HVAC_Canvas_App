import baseConfig from './vitest.config';

/**
 * Bucket B (WS9) "pending" config.
 *
 * The default vitest.config.ts excludes `**​/*.pending.test.ts` so the blocking
 * gate stays green. This config flips that: it targets ONLY the pending suites
 * (unimplemented surface-area / weight goldens that are intentionally red) and
 * REPLACES include/exclude so they can be collected and run on demand via
 * `pnpm test:pending`. CLI `--exclude` merges with (does not replace) the config
 * exclude and vite's mergeConfig concatenates arrays, so we override explicitly.
 */
export default {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['src/**/*.pending.test.ts'],
    exclude: ['node_modules/', 'e2e/', 'src-tauri/'],
  },
};
