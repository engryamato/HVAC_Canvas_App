import { test, expect, type Locator, type Page } from '@playwright/test';
import { ensurePropertiesPanelVisible, openCanvas } from '../../utils/test-utils';
import { setLightMode } from '../../utils/theme-utils';

type InspectorPrefs = {
  isFloating: boolean;
  floatingPosition: { x: number; y: number } | null;
};

async function resetInspectorPrefs(page: Page, prefs?: Partial<InspectorPrefs>) {
  const initialPrefs: InspectorPrefs = {
    isFloating: false,
    floatingPosition: null,
    ...prefs,
  };

  await page.addInitScript((nextPrefs) => {
    localStorage.setItem(
      'sws.inspector-preferences',
      JSON.stringify({ state: nextPrefs, version: 0 })
    );
  }, initialPrefs);
}

async function getCanvasLocator(page: Page): Promise<Locator> {
  return page.locator('[data-testid="canvas-area"] canvas').first().or(page.locator('canvas').first());
}

async function floatInspector(page: Page) {
  const propertiesPanel = page.getByTestId('properties-panel');
  const floatButton = propertiesPanel.getByRole('button').first();

  await floatButton.click();
  await expect(page.getByTestId('floating-inspector')).toBeVisible({ timeout: 5000 });
}

async function dragFloatingInspector(page: Page, dx: number, dy: number) {
  const inspector = page.getByTestId('floating-inspector');
  const header = inspector.locator('div').first();
  const headerBox = await header.boundingBox();
  if (!headerBox) {
    throw new Error('Floating inspector header not found');
  }

  await page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    headerBox.x + headerBox.width / 2 + dx,
    headerBox.y + headerBox.height / 2 + dy,
    { steps: 10 }
  );
  await page.mouse.up();
}

async function createRoom(page: Page) {
  await page.keyboard.press('r');
  const canvas = await getCanvasLocator(page);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  await page.mouse.move(box.x + 200, box.y + 160);
  await page.mouse.down();
  await page.mouse.move(box.x + 420, box.y + 300);
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function createDuct(page: Page) {
  await page.keyboard.press('d');
  const canvas = await getCanvasLocator(page);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  await page.mouse.move(box.x + 260, box.y + 360);
  await page.mouse.down();
  await page.mouse.move(box.x + 520, box.y + 360);
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function createEquipment(page: Page) {
  await page.keyboard.press('e');
  const canvas = await getCanvasLocator(page);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  await page.mouse.click(box.x + 520, box.y + 220);
  await page.waitForTimeout(250);
}

test.describe('Inspector Panel Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await resetInspectorPrefs(page);
    await openCanvas(page, 'Inspector Visual Test Canvas');
    await page.waitForLoadState('networkidle');
    await setLightMode(page);
    await ensurePropertiesPanelVisible(page);
  });

  test('should render docked inspector with Float button', async ({ page }) => {
    const propertiesPanel = page.getByTestId('properties-panel');
    await expect(propertiesPanel).toBeVisible();
    await expect(propertiesPanel).toHaveScreenshot('inspector-docked.png');
  });

  test('should render floating inspector with shadow styling', async ({ page }) => {
    await floatInspector(page);
    const floatingInspector = page.getByTestId('floating-inspector');
    await expect(floatingInspector).toHaveScreenshot('floating-inspector-default.png');
  });

  test('should render floating inspector at different positions', async ({ page }) => {
    await floatInspector(page);
    const floatingInspector = page.getByTestId('floating-inspector');

    await dragFloatingInspector(page, 140, 60);
    await page.waitForTimeout(100);
    await expect(floatingInspector).toHaveScreenshot('floating-inspector-position-1.png');

    await dragFloatingInspector(page, -220, 140);
    await page.waitForTimeout(100);
    await expect(floatingInspector).toHaveScreenshot('floating-inspector-position-2.png');
  });

  test('should show Dock button in floating mode', async ({ page }) => {
    await floatInspector(page);
    const dockButton = page.getByTestId('floating-inspector').getByRole('button', { name: 'Dock' });
    await expect(dockButton).toBeVisible();
    await expect(page.getByTestId('floating-inspector')).toHaveScreenshot('floating-inspector-dock-button.png');
  });

  test('should support dragging floating inspector (before/after)', async ({ page }) => {
    await floatInspector(page);
    const floatingInspector = page.getByTestId('floating-inspector');

    await expect(floatingInspector).toHaveScreenshot('floating-inspector-before-drag.png');
    await dragFloatingInspector(page, 200, 120);
    await page.waitForTimeout(120);
    await expect(floatingInspector).toHaveScreenshot('floating-inspector-after-drag.png');
  });

  test('should render floating inspector with different entity types selected', async ({ page }) => {
    await floatInspector(page);

    await createRoom(page);
    await expect(page.getByTestId('floating-inspector')).toHaveScreenshot('floating-inspector-room.png');

    await createDuct(page);
    await expect(page.getByTestId('floating-inspector')).toHaveScreenshot('floating-inspector-duct.png');

    await createEquipment(page);
    await expect(page.getByTestId('floating-inspector')).toHaveScreenshot('floating-inspector-equipment.png');
  });

  test('should render floating inspector at minimum and maximum widths', async ({ page }) => {
    await floatInspector(page);
    const floatingInspector = page.getByTestId('floating-inspector');

    await page.evaluate(() => {
      const element = document.querySelector('[data-testid="floating-inspector"]') as HTMLElement | null;
      if (element) {
        element.style.width = '280px';
      }
    });
    await page.waitForTimeout(100);
    await expect(floatingInspector).toHaveScreenshot('floating-inspector-min-width.png');

    await page.evaluate(() => {
      const element = document.querySelector('[data-testid="floating-inspector"]') as HTMLElement | null;
      if (element) {
        element.style.width = '480px';
      }
    });
    await page.waitForTimeout(100);
    await expect(floatingInspector).toHaveScreenshot('floating-inspector-max-width.png');
  });
});

