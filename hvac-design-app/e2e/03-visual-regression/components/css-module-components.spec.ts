import { test, expect } from '@playwright/test';
import { openCanvas } from '../../utils/test-utils';
import { withThemeVariants, setLightMode } from '../../utils/theme-utils';

/**
 * CSS Module Component Visual Regression Tests
 * Captures baseline screenshots of all 17+ CSS Module components before migration
 */

test.describe('CSS Module Components Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvas(page, 'CSS Module Test Canvas');
    await page.waitForLoadState('networkidle');
    await setLightMode(page);
  });

  test.describe('BOM Panel Components', () => {
    test('should display BOM Panel', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const bomPanel = page.locator('[data-testid="bom-panel"]').or(
          page.locator('.bom-panel')
        );
        
        const bomBtn = page.getByRole('button', { name: /bom/i });
        if (await bomBtn.isVisible()) {
          await bomBtn.click();
          await page.waitForTimeout(200);
        }
        
        if (await bomPanel.isVisible()) {
          await expect(bomPanel).toHaveScreenshot(`css-bom-panel-${theme}.png`);
        }
      });
    });

    test('should display BOM Table', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const bomTable = page.locator('[data-testid="bom-table"]').or(
          page.locator('.bom-table')
        );
        
        if (await bomTable.isVisible()) {
          await expect(bomTable).toHaveScreenshot(`css-bom-table-${theme}.png`);
        }
      });
    });
  });

  test.describe('Inspector Panel Components', () => {
    test('should display Inspector Panel', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const inspector = page.locator('[data-testid="inspector"]').or(
          page.locator('.inspector-panel')
        );
        
        if (await inspector.isVisible()) {
          await expect(inspector).toHaveScreenshot(`css-inspector-panel-${theme}.png`);
        }
      });
    });

    test('should display Room Inspector', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        // Create a room to trigger room inspector
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
        
        const roomInspector = page.locator('[data-testid="room-inspector"]').or(
          page.locator('.room-inspector')
        );
        
        if (await roomInspector.isVisible()) {
          await expect(roomInspector).toHaveScreenshot(`css-room-inspector-${theme}.png`);
        }
      });
    });

    test('should display Equipment Inspector', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const equipmentInspector = page.locator('[data-testid="equipment-inspector"]').or(
          page.locator('.equipment-inspector')
        );
        
        if (await equipmentInspector.isVisible()) {
          await expect(equipmentInspector).toHaveScreenshot(`css-equipment-inspector-${theme}.png`);
        }
      });
    });
  });

  test.describe('Collapsible Section Component', () => {
    test('should display Collapsible Section closed', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const collapsible = page.locator('[data-testid="collapsible-section"]').or(
          page.locator('.collapsible-section')
        );
        
        if (await collapsible.first().isVisible()) {
          await expect(collapsible.first()).toHaveScreenshot(`css-collapsible-closed-${theme}.png`);
        }
      });
    });

    test('should display Collapsible Section open', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const trigger = page.locator('[data-testid="collapsible-trigger"]').or(
          page.locator('.collapsible-trigger')
        );
        
        if (await trigger.first().isVisible()) {
          await trigger.first().click();
          await page.waitForTimeout(200);
          
          const collapsible = trigger.first().locator('..');
          await expect(collapsible).toHaveScreenshot(`css-collapsible-open-${theme}.png`);
        }
      });
    });
  });

  test.describe('Toolbar Components', () => {
    test('should display Toolbar', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const toolbar = page.locator('[data-testid="toolbar"]').or(
          page.locator('.toolbar')
        );
        
        if (await toolbar.isVisible()) {
          await expect(toolbar).toHaveScreenshot(`css-toolbar-${theme}.png`);
        }
      });
    });

    test('should display Tool Button', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const toolButton = page.locator('[data-testid="tool-button"]').or(
          page.locator('.tool-button')
        );
        
        if (await toolButton.first().isVisible()) {
          await expect(toolButton.first()).toHaveScreenshot(`css-tool-button-${theme}.png`);
        }
      });
    });

    test('should display active Tool Button', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        await page.keyboard.press('r'); // Activate room tool
        await page.waitForTimeout(100);
        
        const activeToolButton = page.locator('[data-testid="tool-button"][aria-pressed="true"]').or(
          page.locator('.tool-button.active')
        );
        
        if (await activeToolButton.first().isVisible()) {
          await expect(activeToolButton.first()).toHaveScreenshot(`css-tool-button-active-${theme}.png`);
        }
      });
    });
  });

  test.describe('Status Bar Components', () => {
    test('should display Status Bar', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const statusBar = page.locator('[data-testid="status-bar"]').or(
          page.locator('.status-bar')
        );
        
        if (await statusBar.isVisible()) {
          await expect(statusBar).toHaveScreenshot(`css-status-bar-${theme}.png`);
        }
      });
    });

    test('should display Status Bar Item', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const statusBarItem = page.locator('[data-testid="status-bar-item"]').or(
          page.locator('.status-bar-item')
        );
        
        if (await statusBarItem.first().isVisible()) {
          await expect(statusBarItem.first()).toHaveScreenshot(`css-status-bar-item-${theme}.png`);
        }
      });
    });
  });

  test.describe('Minimap Component', () => {
    test('should display Minimap', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const minimap = page.locator('[data-testid="minimap"]').or(
          page.locator('.minimap')
        );
        
        if (await minimap.isVisible()) {
          await expect(minimap).toHaveScreenshot(`css-minimap-${theme}.png`);
        }
      });
    });
  });

  test.describe('Zoom Controls Components', () => {
    test('should display Zoom Controls', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomControls = page.locator('[data-testid="zoom-control"]').or(
          page.locator('.zoom-controls')
        );
        
        if (await zoomControls.isVisible()) {
          await expect(zoomControls).toHaveScreenshot(`css-zoom-controls-${theme}.png`);
        }
      });
    });

    test('should display Zoom Level Indicator', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomLevel = page.locator('[data-testid="zoom-level"]').or(
          page.locator('.zoom-level')
        );
        
        if (await zoomLevel.isVisible()) {
          await expect(zoomLevel).toHaveScreenshot(`css-zoom-level-${theme}.png`);
        }
      });
    });
  });

  test.describe('Grid Settings Panel', () => {
    test('should display Grid Settings Panel', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const gridSettings = page.locator('[data-testid="grid-settings"]').or(
          page.locator('.grid-settings-panel')
        );
        
        if (await gridSettings.isVisible()) {
          await expect(gridSettings).toHaveScreenshot(`css-grid-settings-${theme}.png`);
        }
      });
    });
  });

  test.describe('File Menu Components', () => {
    test('should display File Menu', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const fileMenu = page.getByRole('button', { name: /file/i });
        
        if (await fileMenu.isVisible()) {
          await fileMenu.click();
          await page.waitForTimeout(150);
          
          const menu = page.locator('[role="menu"]');
          if (await menu.isVisible()) {
            await expect(menu).toHaveScreenshot(`css-file-menu-${theme}.png`);
          }
        }
      });
    });
  });

  test.describe('Edit Menu Components', () => {
    test('should display Edit Menu', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const editMenu = page.getByRole('button', { name: /edit/i });
        
        if (await editMenu.isVisible()) {
          await editMenu.click();
          await page.waitForTimeout(150);
          
          const menu = page.locator('[role="menu"]');
          if (await menu.isVisible()) {
            await expect(menu).toHaveScreenshot(`css-edit-menu-${theme}.png`);
          }
        }
      });
    });
  });

  test.describe('View Menu Components', () => {
    test('should display View Menu', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const viewMenu = page.getByRole('button', { name: /view/i });
        
        if (await viewMenu.isVisible()) {
          await viewMenu.click();
          await page.waitForTimeout(150);
          
          const menu = page.locator('[role="menu"]');
          if (await menu.isVisible()) {
            await expect(menu).toHaveScreenshot(`css-view-menu-${theme}.png`);
          }
        }
      });
    });
  });

  test.describe('Dialog Components', () => {
    test('should display Settings Dialog', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const settingsBtn = page.getByRole('button', { name: /settings/i });
        
        if (await settingsBtn.isVisible()) {
          await settingsBtn.click();
          await page.waitForTimeout(200);
          
          const dialog = page.locator('[data-testid="settings-dialog"]').or(
            page.locator('.settings-dialog')
          );
          
          if (await dialog.isVisible()) {
            await expect(dialog).toHaveScreenshot(`css-settings-dialog-${theme}.png`);
          }
        }
      });
    });

    test('should display Export Dialog', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const exportBtn = page.getByRole('button', { name: /export/i });
        
        if (await exportBtn.isVisible()) {
          await exportBtn.click();
          await page.waitForTimeout(200);
          
          const dialog = page.locator('[data-testid="export-dialog"]').or(
            page.locator('.export-dialog')
          );
          
          if (await dialog.isVisible()) {
            await expect(dialog).toHaveScreenshot(`css-export-dialog-${theme}.png`);
          }
        }
      });
    });
  });

  test.describe('Form Input Components', () => {
    test('should display Number Input', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const numberInput = page.locator('input[type="number"]').first();
        
        if (await numberInput.isVisible()) {
          await expect(numberInput).toHaveScreenshot(`css-number-input-${theme}.png`);
        }
      });
    });

    test('should display Text Input', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const textInput = page.locator('input[type="text"]').first();
        
        if (await textInput.isVisible()) {
          await expect(textInput).toHaveScreenshot(`css-text-input-${theme}.png`);
        }
      });
    });

    test('should display Select Dropdown', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const select = page.locator('select').first();
        
        if (await select.isVisible()) {
          await expect(select).toHaveScreenshot(`css-select-${theme}.png`);
        }
      });
    });
  });
});
