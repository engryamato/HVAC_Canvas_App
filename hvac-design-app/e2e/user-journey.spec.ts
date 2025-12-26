import { test, expect } from '@playwright/test';

test('User Journey: Create a New Project', async ({ page }) => {
  // Step 1: Navigate to the dashboard
  await page.goto('/dashboard');
  await expect(page).toHaveTitle(/Dashboard/);

  // Step 2: Click on "New Project"
  await page.click('text=New Project');
  await expect(page).toHaveURL(/\/canvas\//);

  // Step 3: Enter project name and description
  await page.fill('input[name="projectName"]', 'Test Project');
  await page.fill('textarea[name="description"]', 'This is a test project.');
  await page.click('button[type="submit"]');

  // Step 4: Verify project creation
  await expect(page).toHaveURL(/\/canvas\/[0-9a-fA-F]+/);
  await expect(page.locator('.project-name')).toHaveText('Test Project');
});