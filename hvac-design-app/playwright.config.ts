import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 * Includes visual regression testing support
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [['html', { open: 'never' }], ['list']],

  /* Expect configuration for visual testing */
  expect: {
    /* Visual comparison threshold - allow 0.2% pixel difference */
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      threshold: 0.2,
      animations: 'disabled',
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.002,
    },
  },

  /* Snapshot output directory */
  snapshotDir: './e2e/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

  /* Shared settings for all the projects below */
   use: {
     /* Base URL for all tests. On CI/Docker, use the service name. */
     baseURL: process.env.CI ? 'http://hvac-app:3000' : 'http://localhost:3001',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on first retry */
    video: 'on-first-retry',

    /* Viewport size for consistent visual testing */
    viewport: { width: 1280, height: 720 },

    /* Disable animations for consistent screenshots */
    // reducedMotion: 'reduce',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run local dev server before starting the tests */
  /* Only run webServer if NOT in CI/Docker (host mode) */
   /* Run local dev server before starting tests - temporarily disabled to fix connection issues */
   /*
   webServer: process.env.CI ? undefined : {
     command: 'npm run dev',
     url: 'http://localhost:3000',
     reuseExistingServer: !process.env.CI,
     timeout: 120 * 1000,
     port: 3000,
   },
   */
});

