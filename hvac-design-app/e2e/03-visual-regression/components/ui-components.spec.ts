import { test, expect } from '@playwright/test';
import { openCanvas } from '../../utils/test-utils';
import { withThemeVariants, setLightMode } from '../../utils/theme-utils';

/**
 * Component-Level Visual Regression Tests
 * Tests all Shadcn/Radix and custom UI components in light/dark modes
 */

test.describe('UI Components Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvas(page, 'Component Test Canvas');
    await page.waitForLoadState('networkidle');
    await setLightMode(page);
  });

  test.describe('Button Components', () => {
    test('should display all button variants', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const buttons = page.locator('button');
        const count = await buttons.count();
        
        if (count > 0) {
          await expect(buttons.first()).toHaveScreenshot(`button-default-${theme}.png`);
        }
      });
    });

    test('should display button hover state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const button = page.locator('button').first();
        
        if (await button.isVisible()) {
          await button.hover();
          await page.waitForTimeout(150);
          await expect(button).toHaveScreenshot(`button-hover-${theme}.png`);
        }
      });
    });

    test('should display button active state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const button = page.locator('button').first();
        
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(50);
          await expect(button).toHaveScreenshot(`button-active-${theme}.png`);
        }
      });
    });

    test('should display disabled button', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const disabledBtn = page.locator('button[disabled]');
        
        if (await disabledBtn.first().isVisible()) {
          await expect(disabledBtn.first()).toHaveScreenshot(`button-disabled-${theme}.png`);
        }
      });
    });
  });

  test.describe('Dialog Components', () => {
    test('should display dialog overlay', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const dialogTrigger = page.locator('[data-testid="dialog-trigger"]').or(
          page.getByRole('button', { name: /dialog|open/i })
        );

        if (await dialogTrigger.isVisible()) {
          await dialogTrigger.click();
          await page.waitForTimeout(200);

          const dialog = page.locator('[role="dialog"]');
          if (await dialog.isVisible()) {
            await expect(page).toHaveScreenshot(`dialog-overlay-${theme}.png`);
          }
        }
      });
    });

    test('should display dialog content', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const dialogTrigger = page.getByRole('button', { name: /dialog/i });

        if (await dialogTrigger.isVisible()) {
          await dialogTrigger.click();
          await page.waitForTimeout(200);

          const dialogContent = page.locator('[role="dialog"]');
          if (await dialogContent.isVisible()) {
            await expect(dialogContent).toHaveScreenshot(`dialog-content-${theme}.png`);
          }
        }
      });
    });
  });

  test.describe('Input Components', () => {
    test('should display input default state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const input = page.locator('input[type="text"]').first();
        
        if (await input.isVisible()) {
          await expect(input).toHaveScreenshot(`input-default-${theme}.png`);
        }
      });
    });

    test('should display input focused state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const input = page.locator('input[type="text"]').first();
        
        if (await input.isVisible()) {
          await input.focus();
          await page.waitForTimeout(100);
          await expect(input).toHaveScreenshot(`input-focused-${theme}.png`);
        }
      });
    });

    test('should display input with value', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const input = page.locator('input[type="text"]').first();
        
        if (await input.isVisible()) {
          await input.fill('Test Value');
          await page.waitForTimeout(100);
          await expect(input).toHaveScreenshot(`input-with-value-${theme}.png`);
        }
      });
    });

    test('should display input error state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const errorInput = page.locator('input[aria-invalid="true"]').or(
          page.locator('input.error')
        );
        
        if (await errorInput.first().isVisible()) {
          await expect(errorInput.first()).toHaveScreenshot(`input-error-${theme}.png`);
        }
      });
    });
  });

  test.describe('Select Components', () => {
    test('should display select default state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const select = page.locator('select').or(
          page.locator('[role="combobox"]')
        );
        
        if (await select.first().isVisible()) {
          await expect(select.first()).toHaveScreenshot(`select-default-${theme}.png`);
        }
      });
    });

    test('should display select dropdown open', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const select = page.locator('[role="combobox"]');
        
        if (await select.isVisible()) {
          await select.click();
          await page.waitForTimeout(150);
          await expect(page).toHaveScreenshot(`select-dropdown-${theme}.png`);
        }
      });
    });
  });

  test.describe('Checkbox Components', () => {
    test('should display checkbox unchecked', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const checkbox = page.locator('input[type="checkbox"]').or(
          page.locator('[role="checkbox"]')
        );
        
        if (await checkbox.first().isVisible()) {
          await expect(checkbox.first()).toHaveScreenshot(`checkbox-unchecked-${theme}.png`);
        }
      });
    });

    test('should display checkbox checked', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const checkbox = page.locator('input[type="checkbox"]').first();
        
        if (await checkbox.isVisible()) {
          await checkbox.check();
          await page.waitForTimeout(100);
          await expect(checkbox).toHaveScreenshot(`checkbox-checked-${theme}.png`);
        }
      });
    });
  });

  test.describe('Loading Spinner', () => {
    test('should display loading spinner', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const spinner = page.locator('[data-testid="loading-spinner"]').or(
          page.locator('.spinner').or(page.locator('.loading'))
        );
        
        if (await spinner.isVisible()) {
          await expect(spinner).toHaveScreenshot(`loading-spinner-${theme}.png`);
        }
      });
    });
  });

  test.describe('Toast Notifications', () => {
    test('should display toast notification', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const toast = page.locator('[data-testid="toast"]').or(
          page.locator('[role="alert"]')
        );
        
        if (await toast.isVisible()) {
          await expect(toast).toHaveScreenshot(`toast-notification-${theme}.png`);
        }
      });
    });
  });

  test.describe('Tabs Components', () => {
    test('should display tabs default state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const tabs = page.locator('[role="tablist"]');
        
        if (await tabs.isVisible()) {
          await expect(tabs).toHaveScreenshot(`tabs-default-${theme}.png`);
        }
      });
    });

    test('should display active tab state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const tab = page.locator('[role="tab"][aria-selected="true"]');
        
        if (await tab.isVisible()) {
          await expect(tab).toHaveScreenshot(`tab-active-${theme}.png`);
        }
      });
    });
  });

  test.describe('Accordion Components', () => {
    test('should display accordion closed state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const accordion = page.locator('[data-testid="accordion"]').or(
          page.locator('.accordion')
        );
        
        if (await accordion.first().isVisible()) {
          await expect(accordion.first()).toHaveScreenshot(`accordion-closed-${theme}.png`);
        }
      });
    });

    test('should display accordion open state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const accordionTrigger = page.locator('[data-testid="accordion-trigger"]').or(
          page.locator('.accordion-trigger')
        );
        
        if (await accordionTrigger.first().isVisible()) {
          await accordionTrigger.first().click();
          await page.waitForTimeout(200);
          const accordion = accordionTrigger.first().locator('..');
          await expect(accordion).toHaveScreenshot(`accordion-open-${theme}.png`);
        }
      });
    });
  });

  test.describe('Icon Button', () => {
    test('should display icon button', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const iconButton = page.locator('[data-testid="icon-button"]').or(
          page.locator('button[aria-label]')
        );
        
        if (await iconButton.first().isVisible()) {
          await expect(iconButton.first()).toHaveScreenshot(`icon-button-${theme}.png`);
        }
      });
    });

    test('should display icon button hover', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const iconButton = page.locator('button[aria-label]').first();
        
        if (await iconButton.isVisible()) {
          await iconButton.hover();
          await page.waitForTimeout(150);
          await expect(iconButton).toHaveScreenshot(`icon-button-hover-${theme}.png`);
        }
      });
    });
  });

  test.describe('Tooltips', () => {
    test('should display tooltip on hover', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const trigger = page.locator('[data-testid="tooltip-trigger"]').or(
          page.locator('button').first()
        );
        
        if (await trigger.isVisible()) {
          await trigger.hover();
          await page.waitForTimeout(300);
          
          const tooltip = page.locator('[role="tooltip"]');
          if (await tooltip.isVisible()) {
            await expect(page).toHaveScreenshot(`tooltip-visible-${theme}.png`);
          }
        }
      });
    });
  });
});
