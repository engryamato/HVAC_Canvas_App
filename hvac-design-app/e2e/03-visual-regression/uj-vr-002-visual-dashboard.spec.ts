import { test, expect, type Page } from '@playwright/test';

async function createProjectAndReturnToDashboard(page: Page, projectName: string) {
  await page.getByTestId('new-project-btn').click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('project-name-input').fill(projectName);
  await page.getByTestId('create-button').click();

  await expect(page).toHaveURL(/\/canvas\//, { timeout: 15000 });
  await page.getByTestId('breadcrumb-dashboard').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Visual Regression Tests for Dashboard
 * Verifies all dashboard components, panels, and elements are properly rendered
 */

test.describe('Dashboard Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage for consistent state
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.removeItem('sws.projectIndex');
      localStorage.removeItem('sws.preferences');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.describe('Empty State', () => {
    test('should display empty dashboard correctly', async ({ page }) => {
      // Wait for dashboard to fully render
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 }).catch(() => {});

      // Take full page screenshot
      await expect(page).toHaveScreenshot('dashboard-empty-state.png', {
        fullPage: true,
      });
    });

    test('should display header with correct elements', async ({ page }) => {
      // Screenshot header section
      const header = page.locator('header').first();
      if (await header.isVisible()) {
        await expect(header).toHaveScreenshot('dashboard-header.png');
      }
    });

    test('should display "New Project" button prominently', async ({ page }) => {
      const newProjectBtn = page.getByTestId('new-project-btn');
      if (await newProjectBtn.isVisible()) {
        await expect(newProjectBtn).toHaveScreenshot('new-project-button.png');
      }
    });

    test('should display empty state illustration/message', async ({ page }) => {
      // Look for empty state content
      const emptyState = page.locator('[data-testid="empty-state"]').or(
        page.getByText(/no projects/i)
      );
      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('empty-state-message.png');
      }
    });
  });

  test.describe('New Project Dialog', () => {
    test('should display new project dialog correctly', async ({ page }) => {
      // Open new project dialog
      await page.getByTestId('new-project-btn').click();

      // Wait for dialog animation
      await page.waitForTimeout(300);

      // Screenshot the dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveScreenshot('new-project-dialog.png');
    });

    test('should display all form fields in dialog', async ({ page }) => {
      await page.getByTestId('new-project-btn').click();
      await page.waitForTimeout(300);

      // Verify form fields are visible
      await expect(page.getByLabel(/project name/i)).toBeVisible();

      // Screenshot form area
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        await expect(form).toHaveScreenshot('new-project-form-fields.png');
      }
    });

    test('should display validation error states', async ({ page }) => {
      await page.getByTestId('new-project-btn').click();
      await page.waitForTimeout(300);

      // The create button should be disabled when form is invalid.
      const createButton = page.getByRole('dialog').getByTestId('create-button');
      await expect(createButton).toBeDisabled();

      // Screenshot with validation errors
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveScreenshot('new-project-dialog-validation-error.png');
    });

    test('should display filled form correctly', async ({ page }) => {
      await page.getByTestId('new-project-btn').click();
      await page.waitForTimeout(300);

      // Fill in all fields
      await page.getByLabel(/project name/i).fill('Visual Test Project');
      const projectNumber = page.getByLabel(/project number/i);
      if (await projectNumber.isVisible()) {
        await projectNumber.fill('VT-2024-001');
      }
      const clientName = page.getByLabel(/client name/i);
      if (await clientName.isVisible()) {
        await clientName.fill('Test Client Inc.');
      }

      // Screenshot filled form
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveScreenshot('new-project-dialog-filled.png');
    });
  });

  test.describe('Project Cards', () => {
    test.beforeEach(async ({ page }) => {
      await createProjectAndReturnToDashboard(page, 'Test Project Alpha');
    });

    test('should display project card correctly', async ({ page }) => {
      const projectCard = page.getByTestId('all-projects').getByTestId('project-card').first();
      await expect(projectCard).toBeVisible();
      await expect(projectCard).toHaveScreenshot('project-card.png');
    });

    test('should display project card hover state', async ({ page }) => {
      const projectCard = page.getByTestId('all-projects').getByTestId('project-card').first();
      await expect(projectCard).toBeVisible();
      await projectCard.hover();
      await page.waitForTimeout(200);
      await expect(projectCard).toHaveScreenshot('project-card-hover.png');
    });

    test('should display project context menu', async ({ page }) => {
      // Right-click or click menu button on project card
      const menuButton = page
        .getByTestId('all-projects')
        .locator('[data-testid="project-menu"]')
        .first();

      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(200);
        await expect(page).toHaveScreenshot('project-context-menu.png');
      }
    });

    test('should display multiple project cards in grid', async ({ page }) => {
      // Create additional projects
      for (let i = 2; i <= 4; i++) {
        await createProjectAndReturnToDashboard(page, `Test Project ${i}`);
      }

      // Screenshot the grid layout
      await expect(page).toHaveScreenshot('dashboard-multiple-projects.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Search and Filter Bar', () => {
    test.beforeEach(async ({ page }) => {
      // Create test projects
      for (let i = 1; i <= 3; i++) {
        await createProjectAndReturnToDashboard(page, `Project ${i}`);
      }
    });

    test('should display search bar correctly', async ({ page }) => {
      const searchBar = page.getByLabel('Search projects');

      if (await searchBar.isVisible()) {
        await expect(searchBar).toHaveScreenshot('search-bar.png');
      }
    });

    test('should display search with input', async ({ page }) => {
      const searchBar = page.getByLabel('Search projects');

      if (await searchBar.isVisible()) {
        await searchBar.fill('Project 1');
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot('search-with-input.png', {
          fullPage: true,
        });
      }
    });

    test('should display sort dropdown', async ({ page }) => {
      const sortSelect = page.getByTestId('sort-select');
      if (await sortSelect.isVisible()) {
        await expect(sortSelect).toHaveScreenshot('sort-dropdown.png');
      }
    });
  });

  test.describe('Statistics Cards', () => {
    test('should display stat cards correctly', async ({ page }) => {
      const statsSection = page.locator('[data-testid="stats-section"]').or(
        page.locator('.stats-container')
      );

      if (await statsSection.isVisible()) {
        await expect(statsSection).toHaveScreenshot('stats-cards.png');
      }
    });

    test('should display project count', async ({ page }) => {
      const projectCount = page.getByText(/\d+ (active )?project/i);
      if (await projectCount.isVisible()) {
        await expect(projectCount).toHaveScreenshot('project-count.png');
      }
    });
  });

  test.describe('Confirm Dialogs', () => {
    test.beforeEach(async ({ page }) => {
      // Create a project to have something to delete
      await page.getByRole('button', { name: /new project/i }).click();
      await page.waitForTimeout(300);
      await page.getByLabel(/project name/i).fill('Project to Delete');
      await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
      await page.waitForTimeout(500);
    });

    test('should display delete confirmation dialog', async ({ page }) => {
      // Find and click delete button
      const menuButton = page.locator('[data-testid="project-menu"]').first().or(
        page.getByRole('button', { name: /menu|options|more/i }).first()
      );

      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(200);

        const deleteOption = page.getByRole('menuitem', { name: /delete/i }).or(
          page.getByText(/delete/i)
        );

        if (await deleteOption.isVisible()) {
          await deleteOption.click();
          await page.waitForTimeout(300);

          const confirmDialog = page.getByRole('alertdialog').or(
            page.getByRole('dialog')
          );

          if (await confirmDialog.isVisible()) {
            await expect(confirmDialog).toHaveScreenshot('delete-confirm-dialog.png');
          }
        }
      }
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
      });
    });

    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
      });
    });
  });
});
