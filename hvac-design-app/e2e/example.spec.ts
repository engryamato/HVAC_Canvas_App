import { test, expect } from '@playwright/test';

/**
 * Example E2E test for SizeWise HVAC Canvas App
 * These tests verify the application loads and basic functionality works
 */

test.describe.skip('Application Launch', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page loads without errors
    await expect(page).toHaveTitle(/SizeWise|HVAC/i);
  });

  test('should display the main canvas area', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the app to fully load
    await page.waitForLoadState('networkidle');
    
    // The canvas container should be visible
    // This selector will be updated once the canvas component is implemented
    const mainContent = page.locator('main, [data-testid="canvas-container"]');
    await expect(mainContent).toBeVisible();
  });
});

test.describe.skip('Navigation', () => {
  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Look for dashboard link or button
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/dashboard/);
    }
  });
});

