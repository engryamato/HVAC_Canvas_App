import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Canvas Page
 * Verifies toolbar, canvas area, panels, and all interactive elements
 */

test.describe('Canvas Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Create a project and navigate to canvas
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.removeItem('sws.projectIndex');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Create a new project
    await page.getByRole('button', { name: /new project/i }).click();
    await page.waitForTimeout(300);
    await page.getByLabel(/project name/i).fill('Visual Test Canvas');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(500);

    // Navigate to canvas (click on project or auto-navigate)
    const projectCard = page.getByText('Visual Test Canvas');
    if (await projectCard.isVisible()) {
      await projectCard.click();
    }
    await page.waitForURL(/canvas/);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test.describe('Full Canvas Layout', () => {
    test('should display complete canvas page layout', async ({ page }) => {
      await expect(page).toHaveScreenshot('canvas-full-layout.png', {
        fullPage: true,
      });
    });

    test('should display canvas with all panels visible', async ({ page }) => {
      // Ensure main panels are visible
      await page.waitForSelector('canvas', { timeout: 5000 });
      await expect(page).toHaveScreenshot('canvas-with-panels.png');
    });
  });

  test.describe('Toolbar', () => {
    test('should display toolbar with all tools', async ({ page }) => {
      const toolbar = page.locator('[data-testid="toolbar"]').or(
        page.locator('.toolbar')
      ).or(
        page.locator('[role="toolbar"]')
      );

      if (await toolbar.isVisible()) {
        await expect(toolbar).toHaveScreenshot('toolbar-default.png');
      } else {
        // Try to find toolbar buttons grouped together
        const toolButtons = page.locator('button').filter({ hasText: /room|duct|select/i }).first();
        if (await toolButtons.isVisible()) {
          await expect(toolButtons.locator('..').locator('..')).toHaveScreenshot('toolbar-default.png');
        }
      }
    });

    test('should display select tool active state', async ({ page }) => {
      // Press V for select tool
      await page.keyboard.press('v');
      await page.waitForTimeout(100);

      const selectBtn = page.getByRole('button', { name: /select/i });
      if (await selectBtn.isVisible()) {
        await expect(selectBtn).toHaveScreenshot('tool-select-active.png');
      }
    });

    test('should display room tool active state', async ({ page }) => {
      await page.keyboard.press('r');
      await page.waitForTimeout(100);

      const roomBtn = page.getByRole('button', { name: /room/i });
      if (await roomBtn.isVisible()) {
        await expect(roomBtn).toHaveScreenshot('tool-room-active.png');
      }
    });

    test('should display duct tool active state', async ({ page }) => {
      await page.keyboard.press('d');
      await page.waitForTimeout(100);

      const ductBtn = page.getByRole('button', { name: /duct/i });
      if (await ductBtn.isVisible()) {
        await expect(ductBtn).toHaveScreenshot('tool-duct-active.png');
      }
    });

    test('should display equipment tool active state', async ({ page }) => {
      await page.keyboard.press('e');
      await page.waitForTimeout(100);

      const equipBtn = page.getByRole('button', { name: /equipment/i });
      if (await equipBtn.isVisible()) {
        await expect(equipBtn).toHaveScreenshot('tool-equipment-active.png');
      }
    });

    test('should display fitting tool active state', async ({ page }) => {
      await page.keyboard.press('f');
      await page.waitForTimeout(100);

      const fittingBtn = page.getByRole('button', { name: /fitting/i });
      if (await fittingBtn.isVisible()) {
        await expect(fittingBtn).toHaveScreenshot('tool-fitting-active.png');
      }
    });

    test('should display toolbar hover states', async ({ page }) => {
      const toolButtons = page.locator('[data-testid="toolbar"] button').or(
        page.locator('.toolbar button')
      );

      const count = await toolButtons.count();
      if (count > 0) {
        await toolButtons.first().hover();
        await page.waitForTimeout(150);
        await expect(toolButtons.first()).toHaveScreenshot('toolbar-button-hover.png');
      }
    });
  });

  test.describe('Canvas Area', () => {
    test('should display empty canvas with grid', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();
      await expect(canvas).toHaveScreenshot('canvas-empty-with-grid.png');
    });

    test('should display canvas without grid when toggled off', async ({ page }) => {
      // Toggle grid off using keyboard shortcut
      await page.keyboard.press('g');
      await page.waitForTimeout(200);

      const canvas = page.locator('canvas').first();
      await expect(canvas).toHaveScreenshot('canvas-without-grid.png');
    });

    test('should display canvas with room entity', async ({ page }) => {
      // Activate room tool
      await page.keyboard.press('r');
      await page.waitForTimeout(100);

      // Draw a room
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(300);

        await expect(canvas).toHaveScreenshot('canvas-with-room.png');
      }
    });

    test('should display canvas with duct entity', async ({ page }) => {
      // Activate duct tool
      await page.keyboard.press('d');
      await page.waitForTimeout(100);

      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 150);
        await page.mouse.down();
        await page.mouse.move(box.x + 400, box.y + 150);
        await page.mouse.up();
        await page.waitForTimeout(300);

        await expect(canvas).toHaveScreenshot('canvas-with-duct.png');
      }
    });

    test('should display selected entity with selection handles', async ({ page }) => {
      // Create a room
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(300);

        // The room should be selected after creation
        await expect(canvas).toHaveScreenshot('canvas-entity-selected.png');
      }
    });

    test('should display marquee selection', async ({ page }) => {
      // Switch to select tool
      await page.keyboard.press('v');
      await page.waitForTimeout(100);

      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        // Start marquee selection
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 250, box.y + 200);

        // Take screenshot while dragging (marquee visible)
        await expect(canvas).toHaveScreenshot('canvas-marquee-selection.png');

        await page.mouse.up();
      }
    });
  });

  test.describe('Zoom Controls', () => {
    test('should display zoom controls panel', async ({ page }) => {
      const zoomControls = page.locator('[data-testid="zoom-controls"]').or(
        page.locator('.zoom-controls')
      );

      if (await zoomControls.isVisible()) {
        await expect(zoomControls).toHaveScreenshot('zoom-controls.png');
      }
    });

    test('should display zoom percentage', async ({ page }) => {
      const zoomIndicator = page.getByText(/100%|zoom/i);
      if (await zoomIndicator.isVisible()) {
        await expect(zoomIndicator).toHaveScreenshot('zoom-indicator.png');
      }
    });

    test('should display zoomed in canvas (200%)', async ({ page }) => {
      // Zoom in multiple times
      await page.keyboard.press('=');
      await page.waitForTimeout(100);
      await page.keyboard.press('=');
      await page.waitForTimeout(100);
      await page.keyboard.press('=');
      await page.waitForTimeout(200);

      const canvas = page.locator('canvas').first();
      await expect(canvas).toHaveScreenshot('canvas-zoomed-in.png');
    });

    test('should display zoomed out canvas (50%)', async ({ page }) => {
      // Zoom out multiple times
      await page.keyboard.press('-');
      await page.waitForTimeout(100);
      await page.keyboard.press('-');
      await page.waitForTimeout(100);
      await page.keyboard.press('-');
      await page.waitForTimeout(200);

      const canvas = page.locator('canvas').first();
      await expect(canvas).toHaveScreenshot('canvas-zoomed-out.png');
    });
  });

  test.describe('Inspector Panel', () => {
    test('should display empty inspector when nothing selected', async ({ page }) => {
      const inspector = page.locator('[data-testid="inspector"]').or(
        page.locator('.inspector-panel')
      ).or(
        page.locator('[data-testid="properties-panel"]')
      );

      if (await inspector.isVisible()) {
        await expect(inspector).toHaveScreenshot('inspector-empty.png');
      }
    });

    test('should display room inspector when room is selected', async ({ page }) => {
      // Create and select a room
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(500);

        const inspector = page.locator('[data-testid="inspector"]').or(
          page.locator('.inspector-panel')
        );

        if (await inspector.isVisible()) {
          await expect(inspector).toHaveScreenshot('inspector-room.png');
        }
      }
    });

    test('should display inspector with collapsible sections', async ({ page }) => {
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

        // Look for collapsible sections
        const collapsible = page.locator('[data-testid="collapsible-section"]').or(
          page.locator('.collapsible-section')
        );

        if (await collapsible.first().isVisible()) {
          await expect(collapsible.first()).toHaveScreenshot('inspector-collapsible-section.png');
        }
      }
    });

    test('should display inspector input fields', async ({ page }) => {
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(500);

        // Screenshot form fields in inspector
        const nameInput = page.getByLabel(/name/i).first();
        if (await nameInput.isVisible()) {
          await expect(nameInput).toHaveScreenshot('inspector-name-input.png');
        }
      }
    });
  });

  test.describe('Status Bar', () => {
    test('should display status bar correctly', async ({ page }) => {
      const statusBar = page.locator('[data-testid="status-bar"]').or(
        page.locator('.status-bar')
      );

      if (await statusBar.isVisible()) {
        await expect(statusBar).toHaveScreenshot('status-bar.png');
      }
    });

    test('should display cursor position in status bar', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        // Move mouse to trigger position update
        await page.mouse.move(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        const statusBar = page.locator('[data-testid="status-bar"]').or(
          page.locator('.status-bar')
        );

        if (await statusBar.isVisible()) {
          await expect(statusBar).toHaveScreenshot('status-bar-with-position.png');
        }
      }
    });
  });

  test.describe('Grid Settings Panel', () => {
    test('should display grid settings when opened', async ({ page }) => {
      // Look for grid settings button
      const gridSettingsBtn = page.getByRole('button', { name: /grid settings|grid/i }).or(
        page.locator('[data-testid="grid-settings-btn"]')
      );

      if (await gridSettingsBtn.isVisible()) {
        await gridSettingsBtn.click();
        await page.waitForTimeout(200);

        const gridPanel = page.locator('[data-testid="grid-settings"]').or(
          page.locator('.grid-settings-panel')
        );

        if (await gridPanel.isVisible()) {
          await expect(gridPanel).toHaveScreenshot('grid-settings-panel.png');
        }
      }
    });
  });

  test.describe('BOM Panel', () => {
    test('should display BOM panel when opened', async ({ page }) => {
      const bomBtn = page.getByRole('button', { name: /bom|bill of materials/i }).or(
        page.locator('[data-testid="bom-btn"]')
      );

      if (await bomBtn.isVisible()) {
        await bomBtn.click();
        await page.waitForTimeout(200);

        const bomPanel = page.locator('[data-testid="bom-panel"]').or(
          page.locator('.bom-panel')
        );

        if (await bomPanel.isVisible()) {
          await expect(bomPanel).toHaveScreenshot('bom-panel.png');
        }
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should display undo state (Ctrl+Z)', async ({ page }) => {
      // Create something first
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(300);

        // Undo
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(300);

        await expect(canvas).toHaveScreenshot('canvas-after-undo.png');
      }
    });

    test('should display redo state (Ctrl+Shift+Z)', async ({ page }) => {
      // Create, undo, then redo
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(300);

        await page.keyboard.press('Control+z');
        await page.waitForTimeout(200);

        await page.keyboard.press('Control+Shift+z');
        await page.waitForTimeout(300);

        await expect(canvas).toHaveScreenshot('canvas-after-redo.png');
      }
    });
  });

  test.describe('Complete Design Workflow', () => {
    test('should display canvas with multiple entity types', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (!box) return;

      // Create a room
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 400, box.y + 300);
      await page.mouse.up();
      await page.waitForTimeout(200);

      // Create a duct
      await page.keyboard.press('d');
      await page.mouse.move(box.x + 200, box.y + 350);
      await page.mouse.down();
      await page.mouse.move(box.x + 500, box.y + 350);
      await page.mouse.up();
      await page.waitForTimeout(200);

      // Create equipment
      await page.keyboard.press('e');
      await page.mouse.click(box.x + 450, box.y + 200);
      await page.waitForTimeout(200);

      // Clear selection for clean screenshot
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      await expect(canvas).toHaveScreenshot('canvas-complete-design.png');
    });

    test('should display full page with complete design', async ({ page }) => {
      const canvas = page.locator('canvas').first();
      const box = await canvas.boundingBox();
      if (!box) return;

      // Create multiple entities
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 350, box.y + 250);
      await page.mouse.up();
      await page.waitForTimeout(150);

      await page.keyboard.press('d');
      await page.mouse.move(box.x + 175, box.y + 280);
      await page.mouse.down();
      await page.mouse.move(box.x + 175, box.y + 400);
      await page.mouse.up();
      await page.waitForTimeout(150);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      await expect(page).toHaveScreenshot('canvas-page-complete-design.png', {
        fullPage: true,
      });
    });
  });
});
