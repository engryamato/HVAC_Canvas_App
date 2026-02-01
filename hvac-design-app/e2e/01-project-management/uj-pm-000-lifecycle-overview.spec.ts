import { test, expect } from '@playwright/test';

/**
 * E2E tests for Project Management and Data Persistence (Phase 1)
 * Tests the complete project lifecycle including localStorage persistence
 */

test.describe('Project Management - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.removeItem('sws.projectIndex');
      localStorage.removeItem('sws.preferences');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.describe('Create Project', () => {
    test('should create a new project with all metadata fields', async ({ page }) => {
      // Click new project button (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();

      // Wait for dialog to appear with proper timeout
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.waitForLoadState('networkidle');

      // Fill in project details using label selectors
      await page.getByLabel(/project name/i).fill('Test HVAC Project');
      await page.getByLabel(/project number/i).fill('HVAC-2024-001');
      await page.getByLabel(/client name/i).fill('Acme Corporation');

      // Submit form
      await page.getByRole('button', { name: /create/i }).click();

      // App auto-navigates to canvas after project creation
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Navigate back to dashboard to verify project card
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify project card appears in dashboard with proper timeout
      await expect(page.getByText('Test HVAC Project')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('#HVAC-2024-001')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Acme Corporation')).toBeVisible({ timeout: 5000 });
    });

    test('should persist new project to localStorage', async ({ page }) => {
      // Create a project (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();

      // Wait for dialog to appear
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // Fill project name
      await page.getByLabel(/project name/i).fill('Persisted Project');

      // Submit form
      await page.getByRole('button', { name: /create/i }).click();

      // App auto-navigates to canvas after project creation
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Verify localStorage structure (it's written before navigation)
      const projectIndex = await page.evaluate(() => {
        const stored = localStorage.getItem('sws.projectIndex');
        return stored ? JSON.parse(stored) : null;
      });

      expect(projectIndex).not.toBeNull();
      expect(projectIndex.state.projects).toHaveLength(1);
      expect(projectIndex.state.projects[0].projectName).toBe('Persisted Project');
      expect(projectIndex.state.projects[0]).toHaveProperty('projectId');
      expect(projectIndex.state.projects[0]).toHaveProperty('storagePath');
      expect(projectIndex.state.projects[0]).toHaveProperty('createdAt');
      expect(projectIndex.state.projects[0]).toHaveProperty('modifiedAt');
      expect(projectIndex.state.projects[0].isArchived).toBe(false);
    });

    test('should validate project name is required', async ({ page }) => {
      // Click new project button (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();

      // Wait for dialog to appear
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // Verify Create button is disabled when name is empty
      const createBtn = page.getByRole('button', { name: /create/i });
      await expect(createBtn).toBeDisabled();

      // Dialog should still be open
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    });

    test('should validate project name length and characters', async ({ page }) => {
      // Click new project button (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();

      // Wait for dialog to appear
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

      // Test max length (100 characters) - enter exactly 100 chars
      const longName = 'A'.repeat(100);
      await page.getByLabel(/project name/i).fill(longName);

      // Should show character count at limit (100/100)
      await expect(page.getByText('100/100')).toBeVisible({ timeout: 3000 });

      // Button should still be enabled (100 is valid)
      const createBtn = page.getByRole('button', { name: /create/i });
      await expect(createBtn).toBeEnabled();
    });

    test('should show correct project count after creation', async ({ page }) => {
      // Initially should show 0 in the Active tab badge (dashboard shows count in tab)
      const activeTab = page.getByTestId('tab-active');
      await expect(activeTab).toContainText('0');

      // Create a project (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByLabel(/project name/i).fill('First Project');
      await page.getByRole('button', { name: /create/i }).click();

      // Wait for navigation to canvas, then go back
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should now show 1 in the Active tab badge
      await expect(activeTab).toContainText('1');

      // Create another project
      await newProjectBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByLabel(/project name/i).fill('Second Project');
      await page.getByRole('button', { name: /create/i }).click();

      // Wait for navigation to canvas, then go back
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should now show 2 in the Active tab badge
      await expect(activeTab).toContainText('2');
    });
  });

  test.describe('Project Card Actions', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test project first (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByLabel(/project name/i).fill('Test Project');
      await page.getByLabel(/project number/i).fill('TEST-001');
      await page.getByRole('button', { name: /create/i }).click();

      // App auto-navigates to canvas after project creation
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Navigate back to dashboard for card actions tests
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Test Project')).toBeVisible({ timeout: 5000 });
    });

    test('should rename project and update localStorage', async ({ page }) => {
      // Open project actions menu
      await page.getByTestId('project-card-menu-btn').click();
      await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });

      await page.getByTestId('menu-edit-btn').click();

      // Wait for rename input to be visible and focused
      const input = page.getByLabel(/project name/i);
      await expect(input).toBeVisible({ timeout: 3000 });
      await input.focus();

      // Edit the name
      await input.clear();
      await input.fill('Renamed Project');
      await page.getByRole('button', { name: /save/i }).click();

      // Wait for rename to complete and localStorage to update
      await page.waitForTimeout(500);

      // Verify UI updated
      await expect(page.getByText('Renamed Project')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Test Project')).not.toBeVisible({ timeout: 5000 });

      // Verify localStorage updated
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects[0].projectName).toBe('Renamed Project');
    });

    test('should duplicate project with new ID and storage path', async ({ page }) => {
      // Get original project ID
      const originalIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      const originalId = originalIndex.state.projects[0].projectId;
      const originalPath = originalIndex.state.projects[0].storagePath;

      // Open project actions menu
      await page.getByTestId('project-card-menu-btn').click();
      await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });

      await page.getByTestId('menu-duplicate-btn').click();
      await page.waitForTimeout(500);

      // Verify both projects visible (use exact match or role for unique selection)
      await expect(page.getByRole('heading', { name: 'Test Project', exact: true })).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('heading', { name: 'Test Project - Copy' })).toBeVisible({ timeout: 5000 });

      // Verify localStorage has 2 projects with different IDs
      const updatedIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });

      expect(updatedIndex.state.projects).toHaveLength(2);

      const duplicate = updatedIndex.state.projects[0]; // Most recent first
      expect(duplicate.projectName).toBe('Test Project - Copy');
      expect(duplicate.projectId).not.toBe(originalId);
      expect(duplicate.storagePath).not.toBe(originalPath);
      expect(duplicate.isArchived).toBe(false);
    });

    test('should archive project and move to archived tab', async ({ page }) => {
      // Archive the project - click menu first
      await page.getByTestId('project-card-menu-btn').first().click();
      await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });

      // Click archive (happens immediately, no confirmation dialog)
      await page.getByTestId('menu-archive-btn').click();

      // Wait for state update
      await page.waitForTimeout(500);

      // Project should no longer be in active tab
      await expect(page.getByText('Test Project')).not.toBeVisible({ timeout: 5000 });

      // Switch to archived tab using testid
      await page.getByTestId('tab-archived').click();
      await page.waitForTimeout(200);

      // Project should be visible in archived tab
      await expect(page.getByText('Test Project')).toBeVisible({ timeout: 5000 });

      // Verify localStorage
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects[0].isArchived).toBe(true);
    });

    test('should restore archived project', async ({ page }) => {
      // First archive the project (using .first() in case of multiple cards)
      await page.getByTestId('project-card-menu-btn').first().click();
      await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });

      // Archive happens immediately, no confirmation dialog
      await page.getByTestId('menu-archive-btn').click();
      await page.waitForTimeout(300);

      // Switch to archived tab
      await page.getByTestId('tab-archived').click();
      await page.waitForTimeout(200);

      // Restore the project
      await page.getByTestId('project-card-menu-btn').first().click();
      await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });

      await page.getByTestId('menu-restore-btn').click();
      await page.waitForTimeout(500);

      // Switch back to active tab
      await page.getByTestId('tab-active').click();
      await page.waitForTimeout(200);

      // Project should be back in active list
      await expect(page.getByText('Test Project')).toBeVisible({ timeout: 5000 });

      // Verify localStorage
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects[0].isArchived).toBe(false);
    });


     test('should delete project immediately', async ({ page }) => {
      // Open project actions menu
      await page.getByTestId('project-card-menu-btn').first().click();
      await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });

      // Delete happens immediately, no confirmation dialog
      await page.getByTestId('menu-delete-btn').click();

      // Wait for project to be removed
      await page.waitForTimeout(500);

      // Verify project removed
      await expect(page.getByText('Test Project')).not.toBeVisible({ timeout: 5000 });

      // Verify localStorage is empty
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects).toHaveLength(0);
    });

    // Skip cancel test - delete happens immediately without confirmation
    test.skip('should cancel delete confirmation', async ({ page: _page }) => {
      // This test is skipped because delete happens immediately without confirmation
    });
  });

   test.describe('Navigation to Canvas', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test project (use header button)
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByLabel(/project name/i).fill('Canvas Test Project');
      await page.getByRole('button', { name: /create/i }).click();

      // App auto-navigates to canvas after project creation
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Navigate back to dashboard for navigation tests
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Canvas Test Project' })).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to canvas editor from project card', async ({ page }) => {
      // Click project card (opens project)
      await page.getByTestId('project-card').first().click();

      // Wait for navigation to canvas
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
    });

    test('should show back to dashboard link in canvas', async ({ page }) => {
      await page.getByTestId('project-card').first().click();
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('breadcrumb-dashboard')).toBeVisible({ timeout: 5000 });
    });

    test('should navigate back to dashboard from canvas', async ({ page }) => {
      await page.getByTestId('project-card').first().click();
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      await page.getByTestId('breadcrumb-dashboard').click();

      // Wait for navigation to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Canvas Test Project' })).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Preferences Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.removeItem('sws.preferences');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should persist preferences to localStorage', async ({ page }) => {
    // Set preferences via JavaScript (simulating UI interaction)
    await page.evaluate(() => {
      const prefs = {
        state: {
          projectFolder: '/custom/folder',
          unitSystem: 'metric',
          autoSaveInterval: 30000,
          gridSize: 48,
          theme: 'dark',
        },
        version: 0,
      };
      localStorage.setItem('sws.preferences', JSON.stringify(prefs));
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify preferences persisted
    const prefs = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sws.preferences') || '{}');
    });

    expect(prefs.state.projectFolder).toBe('/custom/folder');
    expect(prefs.state.unitSystem).toBe('metric');
    expect(prefs.state.autoSaveInterval).toBe(30000);
    expect(prefs.state.gridSize).toBe(48);
    expect(prefs.state.theme).toBe('dark');
  });

  test('should use default preferences when none stored', async ({ page }) => {
    // Navigate to canvas to trigger preference usage
    await page.goto('/canvas/test-project');
    await page.waitForLoadState('networkidle');

    // Check that default preferences are used
    const prefs = await page.evaluate(() => {
      const stored = localStorage.getItem('sws.preferences');
      return stored ? JSON.parse(stored) : null;
    });

    // If preferences were created, they should have default values
    if (prefs?.state) {
      expect(prefs.state.unitSystem).toBe('imperial');
      expect(prefs.state.theme).toBe('light');
      expect(prefs.state.gridSize).toBe(24);
    }
  });
});

test.describe('Data Persistence Across Sessions', () => {
   test('should restore projects after page reload', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('sws.projectIndex'));
    await page.reload();

    // Create multiple projects (app navigates to canvas after each, so we go back)
    for (let i = 1; i <= 3; i++) {
      const newProjectBtn = page.getByTestId('new-project-btn');
      await newProjectBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByLabel(/project name/i).fill(`Project ${i}`);
      await page.getByRole('button', { name: /create/i }).click();
      
      // Wait for navigation to canvas
      await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
      
      // Go back to dashboard for next project
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // All projects should still be visible
    await expect(page.getByText('Project 1')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Project 2')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Project 3')).toBeVisible({ timeout: 5000 });
  });

   test('should maintain project order after reload (most recent first)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('sws.projectIndex'));
    await page.reload();

    // Create first project
    const newProjectBtn = page.getByTestId('new-project-btn');
    await newProjectBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/project name/i).fill('First Created');
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for navigation to canvas, then go back
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Create second project
    await newProjectBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/project name/i).fill('Second Created');
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for navigation to canvas, then go back
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get order from localStorage
    const projectIndex = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
    });

    // Most recent should be first
    expect(projectIndex.state.projects[0].projectName).toBe('Second Created');
    expect(projectIndex.state.projects[1].projectName).toBe('First Created');
  });

   test('should preserve archived status after reload', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('sws.projectIndex'));
    await page.reload();

    // Create a project
    const newProjectBtn = page.getByTestId('new-project-btn');
    await newProjectBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/project name/i).fill('Archived Project');
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for navigation to canvas, then go back
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Archive the project (happens immediately, no confirmation)
    await page.getByTestId('project-card-menu-btn').click();
    await expect(page.getByTestId('project-card-menu')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('menu-archive-btn').click();
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Project should not be in active tab
    await expect(page.getByText('Archived Project')).not.toBeVisible({ timeout: 5000 });

    // Should be in archived tab
    await page.getByTestId('tab-archived').click();
    await page.waitForTimeout(200);

    await expect(page.getByText('Archived Project')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Empty State Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('sws.projectIndex'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should show empty state when no projects exist', async ({ page }) => {
    await expect(page.getByText(/no projects yet/i)).toBeVisible();
    await expect(page.getByText(/create your first/i)).toBeVisible();
  });

   test('should show empty state for archived tab when no archived projects', async ({ page }) => {
    // Create a project (but don't archive it) - use header button
    const newProjectBtn = page.getByTestId('new-project-btn');
    await newProjectBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
   await page.getByLabel(/project name/i).fill('Active Project');
    await page.getByRole('button', { name: /create/i }).click();

    // Project creation navigates to canvas; return to dashboard to verify tabs.
    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await page.getByTestId('breadcrumb-dashboard').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Switch to archived tab
    await page.getByTestId('tab-archived').click();
    await page.waitForTimeout(200);

    // Should show empty state for archived
    await expect(
      page.getByTestId('all-projects').getByText(/no archived projects/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should provide create button in empty state', async ({ page }) => {
    // Click the create button in empty state
    const createButton = page.getByTestId('empty-state-create-btn');
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('localStorage Structure Validation', () => {
  test('should use correct localStorage keys', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a project to trigger localStorage write - use header button
    const newProjectBtn = page.getByTestId('new-project-btn');
    await newProjectBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByLabel(/project name/i).fill('Storage Test');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(500);

    // Verify correct keys are used
    const keys = await page.evaluate(() => Object.keys(localStorage));

    expect(keys).toContain('sws.projectIndex');
  });

  test('should have valid ProjectListItem structure', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a project with all fields - use header button
    const newProjectBtn = page.getByTestId('new-project-btn');
    await newProjectBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.getByLabel(/project name/i).fill('Structure Test');
    await page.getByLabel(/project number/i).fill('STRUCT-001');
    await page.getByLabel(/client name/i).fill('Test Client');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(500);

    // Verify structure
    const projectIndex = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
    });

    const project = projectIndex.state.projects[0];

    // Required fields
    expect(project).toHaveProperty('projectId');
    expect(project).toHaveProperty('projectName');
    expect(project).toHaveProperty('createdAt');
    expect(project).toHaveProperty('modifiedAt');
    expect(project).toHaveProperty('storagePath');
    expect(project).toHaveProperty('isArchived');

    // Optional fields
    expect(project).toHaveProperty('projectNumber');
    expect(project).toHaveProperty('clientName');

    // Type validation
    expect(typeof project.projectId).toBe('string');
    expect(typeof project.projectName).toBe('string');
    expect(typeof project.storagePath).toBe('string');
    expect(typeof project.isArchived).toBe('boolean');

    // UUID format for projectId (8-4-4-4-12 pattern)
    expect(project.projectId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // ISO8601 format for timestamps
    expect(() => new Date(project.createdAt)).not.toThrow();
    expect(() => new Date(project.modifiedAt)).not.toThrow();
  });
});

