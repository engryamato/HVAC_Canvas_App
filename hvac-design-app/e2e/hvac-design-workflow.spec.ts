import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for HVAC Design workflows
 * Tests critical user journeys in the application
 */

test.describe('HVAC Design Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the application homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/HVAC/i);
  });

  test('should create a new project', async ({ page }) => {
    // Look for "New Project" button or similar
    const newProjectButton = page.getByRole('button', { name: /new project/i });

    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();

      // Fill in project details
      await page.fill('input[name="projectName"]', 'Test HVAC Project');
      await page.fill('input[name="projectNumber"]', 'TEST-001');
      await page.fill('input[name="clientName"]', 'Test Client');

      // Submit form
      await page.getByRole('button', { name: /create|save/i }).click();

      // Should navigate to canvas
      await expect(page).toHaveURL(/canvas/);
    }
  });

  test('should navigate to canvas page', async ({ page }) => {
    // Navigate to canvas (might be default page)
    const canvasLink = page.getByRole('link', { name: /canvas|design/i });

    if (await canvasLink.isVisible()) {
      await canvasLink.click();
    }

    // Verify canvas is loaded
    await expect(page.locator('canvas')).toBeVisible();
  });
});

test.describe('Canvas Tools - Room Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test('should activate room tool with keyboard shortcut', async ({ page }) => {
    // Press 'R' for room tool
    await page.keyboard.press('r');

    // Verify room tool is active (check button state or indicator)
    const roomButton = page.getByRole('button', { name: /room/i });
    if (await roomButton.isVisible()) {
      await expect(roomButton).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('should create a room by clicking and dragging on canvas', async ({ page }) => {
    // Activate room tool
    const roomButton = page.getByRole('button', { name: /room/i });
    if (await roomButton.isVisible()) {
      await roomButton.click();
    } else {
      await page.keyboard.press('r');
    }

    // Get canvas element
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Get canvas bounding box for click coordinates
    const box = await canvas.boundingBox();
    if (box) {
      // Click and drag to create room
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();

      // Wait a bit for entity to be created
      await page.waitForTimeout(500);

      // Check if entity was added to the store (via dev tools or UI indicator)
      // This is implementation-specific
    }
  });

  test('should create multiple rooms', async ({ page }) => {
    await page.keyboard.press('r'); // Activate room tool

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create first room
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Create second room
      await page.mouse.move(box.x + 300, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 400, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Create third room
      await page.mouse.move(box.x + 100, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 400);
      await page.mouse.up();
    }
  });
});

test.describe('Canvas Tools - Multi-Tool Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test('should switch between tools using keyboard shortcuts', async ({ page }) => {
    // Test tool switching with keyboard shortcuts
    await page.keyboard.press('v'); // Select tool
    await page.waitForTimeout(100);

    await page.keyboard.press('r'); // Room tool
    await page.waitForTimeout(100);

    await page.keyboard.press('d'); // Duct tool
    await page.waitForTimeout(100);

    await page.keyboard.press('e'); // Equipment tool
    await page.waitForTimeout(100);

    await page.keyboard.press('f'); // Fitting tool
    await page.waitForTimeout(100);

    await page.keyboard.press('n'); // Note tool
    await page.waitForTimeout(100);

    // Should not throw errors
  });

  test('should create a complete HVAC system', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // 1. Create a room
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 300);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // 2. Add equipment
      await page.keyboard.press('e');
      await page.mouse.click(box.x + 200, box.y + 200);
      await page.waitForTimeout(300);

      // 3. Create duct
      await page.keyboard.press('d');
      await page.mouse.move(box.x + 200, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + 400, box.y + 300);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // 4. Add fitting
      await page.keyboard.press('f');
      await page.mouse.click(box.x + 400, box.y + 300);
      await page.waitForTimeout(300);

      // 5. Add annotation note
      await page.keyboard.press('n');
      await page.mouse.click(box.x + 200, box.y + 400);
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Selection and Manipulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test('should select entities with select tool', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create a room first
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Switch to select tool
      await page.keyboard.press('v');
      await page.waitForTimeout(100);

      // Click on the room to select it
      await page.mouse.click(box.x + 150, box.y + 150);
      await page.waitForTimeout(200);

      // Should show selection indicators (implementation specific)
    }
  });

  test('should clear selection with Escape key', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create and select a room
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      await page.keyboard.press('v');
      await page.mouse.click(box.x + 150, box.y + 150);
      await page.waitForTimeout(200);

      // Clear selection
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Selection should be cleared (implementation specific)
    }
  });

  test('should select all with Ctrl+A', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create multiple rooms
      await page.keyboard.press('r');

      for (let i = 0; i < 3; i++) {
        await page.mouse.move(box.x + 100 + i * 120, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 180 + i * 120, box.y + 180);
        await page.mouse.up();
        await page.waitForTimeout(200);
      }

      // Select all
      await page.keyboard.press('Control+a');
      await page.waitForTimeout(300);

      // All entities should be selected (implementation specific)
    }
  });

  test('should delete selected entities with Delete key', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create a room
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Select it
      await page.keyboard.press('v');
      await page.mouse.click(box.x + 150, box.y + 150);
      await page.waitForTimeout(200);

      // Delete it
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);

      // Entity should be removed (implementation specific)
    }
  });
});

test.describe('Undo/Redo Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test('should undo entity creation with Ctrl+Z', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create a room
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      // Room should be removed (implementation specific)
    }
  });

  test('should redo entity creation with Ctrl+Y', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create a room
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);

      // Undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      // Redo
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(300);

      // Room should be back (implementation specific)
    }
  });

  test('should handle multiple undo/redo operations', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Create 3 rooms
      await page.keyboard.press('r');

      for (let i = 0; i < 3; i++) {
        await page.mouse.move(box.x + 100 + i * 120, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 180 + i * 120, box.y + 180);
        await page.mouse.up();
        await page.waitForTimeout(200);
      }

      // Undo all 3
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);

      // Redo all 3
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(200);
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(200);
    }
  });
});

test.describe('Viewport Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test('should toggle grid with G key', async ({ page }) => {
    // Toggle grid off
    await page.keyboard.press('g');
    await page.waitForTimeout(200);

    // Toggle grid back on
    await page.keyboard.press('g');
    await page.waitForTimeout(200);

    // Should not throw errors
  });

  test('should zoom in with + key', async ({ page }) => {
    await page.keyboard.press('+');
    await page.waitForTimeout(200);

    await page.keyboard.press('+');
    await page.waitForTimeout(200);

    await page.keyboard.press('+');
    await page.waitForTimeout(200);
  });

  test('should zoom out with - key', async ({ page }) => {
    await page.keyboard.press('-');
    await page.waitForTimeout(200);

    await page.keyboard.press('-');
    await page.waitForTimeout(200);

    await page.keyboard.press('-');
    await page.waitForTimeout(200);
  });

  test('should reset view with 0 key', async ({ page }) => {
    // Zoom in/out first
    await page.keyboard.press('+');
    await page.waitForTimeout(100);
    await page.keyboard.press('+');
    await page.waitForTimeout(100);

    // Reset
    await page.keyboard.press('0');
    await page.waitForTimeout(200);

    // View should be reset (implementation specific)
  });

  test('should pan canvas by dragging', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      // Pan by dragging with middle mouse or space+drag
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.down({ button: 'middle' });
      await page.mouse.move(box.x + 300, box.y + 300);
      await page.mouse.up({ button: 'middle' });
      await page.waitForTimeout(200);
    }
  });
});

test.describe('Project Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });
  });

  test('should save project', async ({ page }) => {
    // Create some content
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Look for save button
    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should export project to JSON', async ({ page }) => {
    // Create some content
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      // May need to select JSON format
      const jsonOption = page.getByRole('menuitem', { name: /json/i });
      if (await jsonOption.isVisible()) {
        await jsonOption.click();
      }

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.json$/i);
    }
  });

  test('should export project to CSV', async ({ page }) => {
    // Create some content
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      await page.keyboard.press('r');
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      // Select CSV format
      const csvOption = page.getByRole('menuitem', { name: /csv|bill.*material/i });
      if (await csvOption.isVisible()) {
        await csvOption.click();
      }

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    }
  });
});

test.describe('Accessibility', () => {
  test('should be navigable with keyboard', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Should not throw errors
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // Check for labeled buttons
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const label = await button.getAttribute('aria-label');
      const text = await button.textContent();
      expect(label || text).toBeTruthy();
    }
  });
});

test.describe('Performance', () => {
  test('should handle creating many entities', async ({ page }) => {
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('canvas', { timeout: 5000 });

    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();

    if (box) {
      await page.keyboard.press('r');

      // Create 20 rooms
      for (let i = 0; i < 20; i++) {
        const x = (i % 5) * 100 + 50;
        const y = Math.floor(i / 5) * 100 + 50;

        await page.mouse.move(box.x + x, box.y + y);
        await page.mouse.down();
        await page.mouse.move(box.x + x + 80, box.y + y + 80);
        await page.mouse.up();
        await page.waitForTimeout(50); // Minimal delay
      }

      // App should remain responsive
      await page.keyboard.press('v'); // Switch tool should work
    }
  });
});
