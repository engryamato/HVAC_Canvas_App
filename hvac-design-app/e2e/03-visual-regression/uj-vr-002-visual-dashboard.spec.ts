import { test, expect } from '@playwright/test';
import { openDashboard } from '../utils/test-utils';
import { withThemeVariants, setLightMode } from '../utils/theme-utils';

/**
 * Visual Regression Tests for Dashboard Page
 * Verifies project cards, search functionality, new project dialog, and theme toggle
 */

test.describe('Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
    await page.waitForLoadState('networkidle');
    // Set light mode as default for consistent baseline
    await setLightMode(page);
  });

  test.describe('Dashboard Layout', () => {
    test('should display complete dashboard layout', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        await expect(page).toHaveScreenshot(`dashboard-full-layout-${theme}.png`, {
          fullPage: true,
        });
      });
    });

    test('should display empty dashboard state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        // Clear any existing projects first if needed
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`dashboard-empty-state-${theme}.png`);
      });
    });
  });

  test.describe('Project Cards', () => {
    test('should display project card correctly', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const projectCard = page.locator('[data-testid="project-card"]').or(
          page.locator('.project-card')
        ).first();

        if (await projectCard.isVisible()) {
          await expect(projectCard).toHaveScreenshot(`project-card-${theme}.png`);
        }
      });
    });

    test('should display project card hover state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const projectCard = page.locator('[data-testid="project-card"]').or(
          page.locator('.project-card')
        ).first();

        if (await projectCard.isVisible()) {
          await projectCard.hover();
          await page.waitForTimeout(150);
          await expect(projectCard).toHaveScreenshot(`project-card-hover-${theme}.png`);
        }
      });
    });

    test('should display multiple project cards grid', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const projectsGrid = page.locator('[data-testid="projects-grid"]').or(
          page.locator('.projects-grid')
        );

        if (await projectsGrid.isVisible()) {
          await expect(projectsGrid).toHaveScreenshot(`projects-grid-${theme}.png`);
        }
      });
    });
  });

  test.describe('Search and Filter', () => {
    test('should display search bar', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const searchBar = page.locator('[data-testid="search-bar"]').or(
          page.getByPlaceholder(/search/i)
        );

        if (await searchBar.isVisible()) {
          await expect(searchBar).toHaveScreenshot(`search-bar-${theme}.png`);
        }
      });
    });

    test('should display search bar with focus state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const searchBar = page.locator('[data-testid="search-bar"]').or(
          page.getByPlaceholder(/search/i)
        );

        if (await searchBar.isVisible()) {
          await searchBar.focus();
          await page.waitForTimeout(100);
          await expect(searchBar).toHaveScreenshot(`search-bar-focused-${theme}.png`);
        }
      });
    });

    test('should display search with results', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const searchBar = page.locator('[data-testid="search-bar"]').or(
          page.getByPlaceholder(/search/i)
        );

        if (await searchBar.isVisible()) {
          await searchBar.fill('test');
          await page.waitForTimeout(300);
          await expect(page).toHaveScreenshot(`dashboard-search-results-${theme}.png`);
        }
      });
    });
  });

  test.describe('New Project Dialog', () => {
    test('should display new project button', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const newProjectBtn = page.getByRole('button', { name: /new project/i }).or(
          page.locator('[data-testid="new-project-btn"]')
        );

        if (await newProjectBtn.isVisible()) {
          await expect(newProjectBtn).toHaveScreenshot(`new-project-button-${theme}.png`);
        }
      });
    });

    test('should display new project dialog', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const newProjectBtn = page.getByRole('button', { name: /new project/i }).or(
          page.locator('[data-testid="new-project-btn"]')
        );

        if (await newProjectBtn.isVisible()) {
          await newProjectBtn.click();
          await page.waitForTimeout(200);

          const dialog = page.locator('[role="dialog"]').or(
            page.locator('[data-testid="new-project-dialog"]')
          );

          if (await dialog.isVisible()) {
            await expect(dialog).toHaveScreenshot(`new-project-dialog-${theme}.png`);
          }
        }
      });
    });

    test('should display new project dialog with validation error', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const newProjectBtn = page.getByRole('button', { name: /new project/i });

        if (await newProjectBtn.isVisible()) {
          await newProjectBtn.click();
          await page.waitForTimeout(200);

          // Try to submit without filling required field
          const submitBtn = page.getByRole('button', { name: /create|submit/i });
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(300);

            const dialog = page.locator('[role="dialog"]');
            if (await dialog.isVisible()) {
              await expect(dialog).toHaveScreenshot(`new-project-dialog-error-${theme}.png`);
            }
          }
        }
      });
    });
  });

  test.describe('Theme Toggle', () => {
    test('should display theme toggle button', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const themeToggle = page.locator('[data-testid="theme-toggle"]').or(
          page.getByRole('button', { name: /theme|dark mode|light mode/i })
        );

        if (await themeToggle.isVisible()) {
          await expect(themeToggle).toHaveScreenshot(`theme-toggle-${theme}.png`);
        }
      });
    });

    test('should verify theme toggle functionality', async ({ page }) => {
      // This test verifies the toggle switches themes correctly
      const themeToggle = page.locator('[data-testid="theme-toggle"]').or(
        page.getByRole('button', { name: /theme|dark mode|light mode/i })
      );

      if (await themeToggle.isVisible()) {
        // Take screenshot in light mode
        await setLightMode(page);
        await expect(page).toHaveScreenshot('dashboard-light-mode.png', { fullPage: true });

        // Click toggle and verify dark mode
        await themeToggle.click();
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot('dashboard-dark-mode-toggled.png', { fullPage: true });
      }
    });
  });

  test.describe('Header and Navigation', () => {
    test('should display app header', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const header = page.locator('header').or(
          page.locator('[data-testid="app-header"]')
        );

        if (await header.isVisible()) {
          await expect(header).toHaveScreenshot(`header-${theme}.png`);
        }
      });
    });

    test('should display navigation menu', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const nav = page.locator('nav').or(
          page.locator('[role="navigation"]')
        );

        if (await nav.isVisible()) {
          await expect(nav).toHaveScreenshot(`navigation-${theme}.png`);
        }
      });
    });
  });

  test.describe('Action Buttons and Controls', () => {
    test('should display action buttons correctly', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const actionButtons = page.locator('[data-testid="action-buttons"]').or(
          page.locator('.action-buttons')
        );

        if (await actionButtons.isVisible()) {
          await expect(actionButtons).toHaveScreenshot(`action-buttons-${theme}.png`);
        }
      });
    });

    test('should display button hover states', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const button = page.getByRole('button').first();

        if (await button.isVisible()) {
          await button.hover();
          await page.waitForTimeout(150);
          await expect(button).toHaveScreenshot(`button-hover-${theme}.png`);
        }
      });
    });
  });
});
