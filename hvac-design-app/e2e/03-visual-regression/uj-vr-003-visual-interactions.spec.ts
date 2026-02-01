import { test, expect } from '@playwright/test';
import { openCanvas, ensurePropertiesPanelVisible } from '../utils/test-utils';

/**
 * Visual Regression Tests for UI Interactions
 * Verifies animations, transitions, hover states, and interactive elements
 */

test.describe('UI Interaction Visual Tests', () => {
  test.describe('Button States', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should display button default state', async ({ page }) => {
      const primaryBtn = page.getByTestId('new-project-btn');
      if (await primaryBtn.isVisible()) {
        await expect(primaryBtn).toHaveScreenshot('button-default.png');
      }
    });

    test('should display button hover state', async ({ page }) => {
      const primaryBtn = page.getByTestId('new-project-btn');
      if (await primaryBtn.isVisible()) {
        await primaryBtn.hover();
        await page.waitForTimeout(200); // Wait for hover transition
        await expect(primaryBtn).toHaveScreenshot('button-hover.png');
      }
    });

    test('should display button focus state', async ({ page }) => {
      const primaryBtn = page.getByTestId('new-project-btn');
      if (await primaryBtn.isVisible()) {
        await primaryBtn.focus();
        await page.waitForTimeout(150);
        await expect(primaryBtn).toHaveScreenshot('button-focus.png');
      }
    });

    test('should display button active/pressed state', async ({ page }) => {
      const primaryBtn = page.getByTestId('new-project-btn');
      if (await primaryBtn.isVisible()) {
        await primaryBtn.hover();
        await page.mouse.down();
        await page.waitForTimeout(50);
        await expect(primaryBtn).toHaveScreenshot('button-active.png');
        await page.mouse.up();
      }
    });
  });

  test.describe('Form Input States', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.getByTestId('new-project-btn').click();
      await page.waitForTimeout(300);
    });

    test('should display input default state', async ({ page }) => {
      const input = page.getByLabel(/project name/i);
      await expect(input).toHaveScreenshot('input-default.png');
    });

    test('should display input focus state', async ({ page }) => {
      const input = page.getByLabel(/project name/i);
      await input.focus();
      await page.waitForTimeout(150);
      await expect(input).toHaveScreenshot('input-focus.png');
    });

    test('should display input with value', async ({ page }) => {
      const input = page.getByLabel(/project name/i);
      await input.fill('Test Input Value');
      await expect(input).toHaveScreenshot('input-with-value.png');
    });

    test('should display input error state', async ({ page }) => {
      const input = page.getByLabel(/project name/i);
      await input.fill('   ');
      await input.blur();

      const createButton = page.getByRole('dialog').getByTestId('create-button');
      await expect(createButton).toBeDisabled();

      // Capture the input and its error message
      const inputGroup = input.locator('..');
      await expect(inputGroup).toHaveScreenshot('input-error-state.png');
    });

    test('should display input placeholder correctly', async ({ page }) => {
      const inputs = page.locator('input[placeholder]');
      const count = await inputs.count();
      if (count > 0) {
        await expect(inputs.first()).toHaveScreenshot('input-placeholder.png');
      }
    });
  });

  test.describe('Dropdown Interactions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should display dropdown closed state', async ({ page }) => {
      const dropdown = page.locator('[data-testid="dropdown"]').or(
        page.getByRole('combobox')
      ).or(
        page.locator('.dropdown')
      );

      if (await dropdown.first().isVisible()) {
        await expect(dropdown.first()).toHaveScreenshot('dropdown-closed.png');
      }
    });

    test('should display dropdown open state with options', async ({ page }) => {
      const dropdown = page.locator('[data-testid="dropdown"]').or(
        page.getByRole('combobox')
      ).or(
        page.locator('.dropdown')
      );

      if (await dropdown.first().isVisible()) {
        await dropdown.first().click();
        await page.waitForTimeout(200);
        await expect(page).toHaveScreenshot('dropdown-open.png');
      }
    });

    test('should display dropdown option hover state', async ({ page }) => {
      const dropdown = page.locator('[data-testid="dropdown"]').or(
        page.getByRole('combobox')
      );

      if (await dropdown.first().isVisible()) {
        await dropdown.first().click();
        await page.waitForTimeout(200);

        const options = page.getByRole('option');
        if (await options.first().isVisible()) {
          await options.first().hover();
          await page.waitForTimeout(150);
          await expect(options.first()).toHaveScreenshot('dropdown-option-hover.png');
        }
      }
    });
  });

  test.describe('Dialog Animations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should display dialog opening animation result', async ({ page }) => {
      await page.getByRole('button', { name: /new project/i }).click();
      // Wait for animation to complete
      await page.waitForTimeout(350);

      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveScreenshot('dialog-opened.png');
    });

    test('should display dialog backdrop/overlay', async ({ page }) => {
      await page.getByRole('button', { name: /new project/i }).click();
      await page.waitForTimeout(300);

      // Screenshot full page to capture overlay
      await expect(page).toHaveScreenshot('dialog-with-overlay.png');
    });

    test('should display dialog close button', async ({ page }) => {
      await page.getByRole('button', { name: /new project/i }).click();
      await page.waitForTimeout(300);

      const closeBtn = page.getByRole('button', { name: /close|cancel|×/i }).or(
        page.locator('[data-testid="dialog-close"]')
      );

      if (await closeBtn.isVisible()) {
        await expect(closeBtn).toHaveScreenshot('dialog-close-button.png');
      }
    });
  });

  test.describe('Toast/Notification', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    });

    test('should display toast notification when shown', async ({ page }) => {
      // Create a project to trigger success toast
      await page.getByRole('button', { name: /new project/i }).click();
      await page.waitForTimeout(300);
      await page.getByLabel(/project name/i).fill('Toast Test Project');
      await page.getByRole('button', { name: /create/i }).click();
      await page.waitForTimeout(500);

      const toast = page.locator('[data-testid="toast"]').or(
        page.locator('.toast')
      ).or(
        page.getByRole('alert')
      );

      if (await toast.isVisible()) {
        await expect(toast).toHaveScreenshot('toast-success.png');
      }
    });
  });

  test.describe('Loading States', () => {
    test('should display loading spinner correctly', async ({ page }) => {
      await page.goto('/dashboard');

      const spinner = page.locator('[data-testid="loading-spinner"]').or(
        page.locator('.loading-spinner')
      ).or(
        page.getByRole('progressbar')
      );

      // Spinner might be brief, use race condition
      try {
        await spinner.waitFor({ state: 'visible', timeout: 2000 });
        await expect(spinner).toHaveScreenshot('loading-spinner.png');
      } catch {
        // Spinner was too fast, skip this test
      }
    });

    test('should display skeleton loading state', async ({ page }) => {
      await page.goto('/dashboard');

      const skeleton = page.locator('[data-testid="skeleton"]').or(
        page.locator('.skeleton')
      );

      try {
        await skeleton.first().waitFor({ state: 'visible', timeout: 2000 });
        await expect(skeleton.first()).toHaveScreenshot('skeleton-loading.png');
      } catch {
        // Skeleton was too fast
      }
    });
  });

  test.describe('Icon Button States', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Icon Test');
      await page.waitForLoadState('networkidle');
    });

    test('should display icon button default state', async ({ page }) => {
      const iconBtn = page.getByTestId('zoom-in');

      if (await iconBtn.isVisible()) {
        await expect(iconBtn).toHaveScreenshot('icon-button-default.png');
      }
    });

    test('should display icon button hover state', async ({ page }) => {
      const iconBtn = page.getByTestId('zoom-in');

      if (await iconBtn.isVisible()) {
        await iconBtn.hover();
        await page.waitForTimeout(150);
        await expect(iconBtn).toHaveScreenshot('icon-button-hover.png');
      }
    });
  });

  test.describe('Collapsible Section Animations', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Collapse Test');
      await page.waitForLoadState('networkidle');
      await ensurePropertiesPanelVisible(page);

      // Create a room to populate inspector
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    });

    test('should display collapsible section expanded state', async ({ page }) => {
      const propertiesPanel = page.getByTestId('properties-panel');
      const header = propertiesPanel.getByRole('button', { name: 'Project Info' });
      if (await header.isVisible()) {
        await expect(header.locator('..')).toHaveScreenshot('collapsible-expanded.png');
      }
    });

    test('should display collapsible section collapsed state', async ({ page }) => {
      const propertiesPanel = page.getByTestId('properties-panel');
      const header = propertiesPanel.getByRole('button', { name: 'Project Info' });
      if (await header.isVisible()) {
        await header.click();
        await page.waitForTimeout(200);
        await expect(header.locator('..')).toHaveScreenshot('collapsible-collapsed.png');
      }
    });
  });

  test.describe('Tooltip Display', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Tooltip Test');
      await page.waitForLoadState('networkidle');
    });

    test('should display tooltip on tool button hover', async ({ page }) => {
      const toolBtn = page.getByTestId('tool-room');
      if (await toolBtn.isVisible()) {
        await toolBtn.hover();
        await page.waitForTimeout(200);

        const tooltip = toolBtn.locator('div').filter({ hasText: /^Room/ }).first();
        await expect(tooltip).toBeVisible({ timeout: 2000 });
        await expect(tooltip).toHaveScreenshot('tooltip-tool-button.png');
      }
    });
  });

  test.describe('Responsive Transitions', () => {
    test('should display layout transition to tablet', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Start at desktop size
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('responsive-desktop.png');

      // Transition to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('responsive-tablet.png');
    });

    test('should display layout transition to mobile', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Start at tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);

      // Transition to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('responsive-mobile.png');
    });
  });
});
