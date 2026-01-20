import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = {
  mobile: {
    iphone14: { width: 390, height: 844 },
    pixel5: { width: 393, height: 851 },
    galaxyS21: { width: 360, height: 800 },
  },
  tablet: {
    ipadMini: { width: 768, height: 1024 },
    ipadAir: { width: 820, height: 1180 },
    galaxyTab: { width: 800, height: 1280 },
  },
  desktop: {
    laptop: { width: 1280, height: 720 },
    standard: { width: 1920, height: 1080 },
    wide: { width: 2560, height: 1440 },
  },
};

async function setViewport(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function enableTauriMock(page: Page) {
  await page.addInitScript(() => {
    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async () => null,
    };
  });
}

async function markHasLaunched(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({
      state: { hasLaunched: true },
      version: 0,
    }));
  });
}

test.describe('UJ-GS-002: Device Compatibility (Tauri Offline)', () => {
  test.beforeEach(async ({ page }) => {
    await enableTauriMock(page);
  });

  test('Mobile blocking: iPhone 14', async ({ page }) => {
    const startTime = Date.now();

    await page.setViewportSize(VIEWPORTS.mobile.iphone14);
    await page.goto('/');

    const deviceWarning = page.getByTestId('device-warning');
    await expect(deviceWarning).toBeVisible({ timeout: 10000 });
    const detectionTime = Date.now() - startTime;
    expect(detectionTime).toBeLessThan(1000);
    await expect(page.getByText('Device Incompatible')).toBeVisible();
    await expect(page.getByText(/requires a larger screen/i)).toBeVisible();
    await expect(page.getByTestId('exit-application')).toBeVisible();
  });

  test('Mobile blocking: Pixel 5', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile.pixel5);
    await page.goto('/');

    await expect(page.getByTestId('device-warning')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Device Incompatible')).toBeVisible();
  });

  test('Mobile blocking: Galaxy S21', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile.galaxyS21);
    await page.goto('/');

    await expect(page.getByTestId('device-warning')).toBeVisible({ timeout: 10000 });
  });

  test('Boundary: 639px blocked', async ({ page }) => {
    await page.setViewportSize({ width: 639, height: 800 });
    await page.goto('/');

    await expect(page.getByTestId('device-warning')).toBeVisible({ timeout: 10000 });
  });

  test('Exit button is keyboard focusable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile.iphone14);
    await page.goto('/');

    const exitButton = page.getByTestId('exit-application');
    await expect(exitButton).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(exitButton).toBeFocused();
  });

  test('Tablet layout: iPad Mini', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet.ipadMini);
    await page.goto('/');

    await expect(page.getByTestId('device-warning')).not.toBeVisible();
    await expect(page.getByTestId('app-logo')).toBeVisible();
  });

  test('Tablet layout: iPad Air drawer controls available', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet.ipadAir);
    await markHasLaunched(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('device-warning')).not.toBeVisible();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('Boundary: 640px not blocked', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/');

    await expect(page.getByTestId('device-warning')).not.toBeVisible();
    await expect(page.getByTestId('app-logo')).toBeVisible();
  });

  test('Desktop layout: standard viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop.standard);
    await markHasLaunched(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('device-warning')).not.toBeVisible();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('Resize from desktop to mobile triggers blocking', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByTestId('device-warning')).not.toBeVisible();

    await setViewport(page, 639, 900);
    await expect(page.getByTestId('device-warning')).toBeVisible();
  });

  test('Recovery: expand from 639px to 640px unblocks', async ({ page }) => {
    await page.setViewportSize({ width: 639, height: 800 });
    await page.goto('/');
    await expect(page.getByTestId('device-warning')).toBeVisible();

    await page.setViewportSize({ width: 640, height: 800 });
    await page.waitForTimeout(300);

    await expect(page.getByTestId('device-warning')).not.toBeVisible();
    await expect(page.getByTestId('app-logo')).toBeVisible();
  });

  test('Boundary sweep: 638/639 blocked, 640/641 allowed', async ({ page }) => {
    const testCases = [
      { width: 638, shouldBlock: true },
      { width: 639, shouldBlock: true },
      { width: 640, shouldBlock: false },
      { width: 641, shouldBlock: false },
    ];

    for (const { width, shouldBlock } of testCases) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');

      if (shouldBlock) {
        await expect(page.getByTestId('device-warning')).toBeVisible();
      } else {
        await expect(page.getByTestId('device-warning')).not.toBeVisible();
      }
    }
  });
});
