import { Page, expect } from '@playwright/test';

/**
 * Initializes the application state and navigates to the canvas.
 * This helper skips the onboarding wizard and ensures a project exists.
 * 
 * @param page - The Playwright Page object.
 * @param projectName - The name of the project to create (if creating new).
 */
export async function openCanvas(page: Page, projectName: string = 'E2E Test Project') {
  // 1. Bypass Onboarding Wizard
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({
      state: { hasLaunched: true },
      version: 0,
    }));
    localStorage.setItem('hvac-tutorial-storage', JSON.stringify({
      state: { isActive: false, isCompleted: true },
      version: 0,
    }));
  });

  // 2. Go to Dashboard
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/dashboard/);

  // 3. Check for existing projects or create new one
  const projectCards = page.locator('[data-testid="project-card"]');
  const projectCount = await projectCards.count();

  if (projectCount === 0) {
    // Create new project
    const emptyStateButton = page.getByTestId('empty-state-create-btn');
    const newProjectButton = page.getByTestId('new-project-btn');
    
    if (await emptyStateButton.isVisible()) {
      await emptyStateButton.click();
    } else {
      await newProjectButton.click();
    }
    
    // Fill project details
    await page.getByTestId('project-name-input').fill(projectName);
    await page.getByTestId('create-button').click();
    
    // Verify redirection to canvas
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    // Open first existing project
    // Note: In a real "clean slate" test env, we might want to always create new,
    // but for local dev/faster tests, reusing is fine if state is reset.
    // For specific tests, generating a unique project name helps.
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

/**
 * Ensures the Properties Panel is visible and active.
 * Handles timing issues by retrying with Ctrl+P and waiting for visibility.
 * 
 * @param page - The Playwright Page object.
 */
export async function ensurePropertiesPanelVisible(page: Page) {
  const propertiesPanel = page.getByTestId('properties-panel');
  
  // Try to find and click the properties tab button (works in both collapsed and expanded modes)
  const propertiesTab = page.getByTestId('tab-properties');
  if (await propertiesTab.isVisible()) {
    await propertiesTab.click();
    // Wait for panel to appear
    await expect(propertiesPanel).toBeVisible({ timeout: 2000 });
    return;
  }

  // Fallback to keyboard shortcut if tab button somehow not found
  await page.keyboard.press('Control+p');
  await expect(propertiesPanel).toBeVisible({ timeout: 2000 });
}
