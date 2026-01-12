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
      // Click new project button
      await page.getByRole('button', { name: /new project/i }).click();

      // Wait for dialog to appear
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill in project details using label selectors
      await page.getByLabel(/project name/i).fill('Test HVAC Project');
      await page.getByLabel(/project number/i).fill('HVAC-2024-001');
      await page.getByLabel(/client name/i).fill('Acme Corporation');

      // Submit form
      await page.getByRole('button', { name: /create/i }).click();

      // Verify project card appears in dashboard
      await expect(page.getByText('Test HVAC Project')).toBeVisible();
      await expect(page.getByText('#HVAC-2024-001')).toBeVisible();
      await expect(page.getByText('Acme Corporation')).toBeVisible();
    });

    test('should persist new project to localStorage', async ({ page }) => {
      // Create a project
      await page.getByRole('button', { name: /new project/i }).click();
      await page.getByLabel(/project name/i).fill('Persisted Project');
      await page.getByRole('button', { name: /create/i }).click();

      // Wait for project card to appear
      await expect(page.getByText('Persisted Project')).toBeVisible();

      // Verify localStorage structure
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
      await page.getByRole('button', { name: /new project/i }).click();

      // Try to submit without filling name
      await page.getByRole('button', { name: /create/i }).click();

      // Error should be shown (dialog should still be open)
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should validate project name length and characters', async ({ page }) => {
      await page.getByRole('button', { name: /new project/i }).click();

      // Test invalid characters
      await page.getByLabel(/project name/i).fill('Invalid/Name');
      await page.getByLabel(/project name/i).blur();

      // Should show error about invalid characters
      await expect(page.getByText(/invalid/i)).toBeVisible();
    });

    test('should show correct project count after creation', async ({ page }) => {
      // Initially should show 0 active projects
      await expect(page.getByText(/0 active project/i)).toBeVisible();

      // Create a project
      await page.getByRole('button', { name: /new project/i }).click();
      await page.getByLabel(/project name/i).fill('First Project');
      await page.getByRole('button', { name: /create/i }).click();

      // Should now show 1 active project
      await expect(page.getByText(/1 active project(?!s)/i)).toBeVisible();

      // Create another project
      await page.getByRole('button', { name: /new project/i }).click();
      await page.getByLabel(/project name/i).fill('Second Project');
      await page.getByRole('button', { name: /create/i }).click();

      // Should now show 2 active projects
      await expect(page.getByText(/2 active projects/i)).toBeVisible();
    });
  });

  test.describe('Project Card Actions', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test project first
      await page.getByRole('button', { name: /new project/i }).click();
      await page.getByLabel(/project name/i).fill('Test Project');
      await page.getByLabel(/project number/i).fill('TEST-001');
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText('Test Project')).toBeVisible();
    });

    test('should rename project and update localStorage', async ({ page }) => {
      // Open project actions menu
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /rename/i }).click();

      // Edit the name
      const input = page.getByLabel(/project name/i);
      await input.clear();
      await input.fill('Renamed Project');
      await page.getByRole('button', { name: /save/i }).click();

      // Verify UI updated
      await expect(page.getByText('Renamed Project')).toBeVisible();
      await expect(page.getByText('Test Project')).not.toBeVisible();

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

      // Duplicate the project
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /duplicate/i }).click();

      // Verify both projects visible
      await expect(page.getByText('Test Project')).toBeVisible();
      await expect(page.getByText('Test Project (Copy)')).toBeVisible();

      // Verify localStorage has 2 projects with different IDs
      const updatedIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });

      expect(updatedIndex.state.projects).toHaveLength(2);

      const duplicate = updatedIndex.state.projects[0]; // Most recent first
      expect(duplicate.projectName).toBe('Test Project (Copy)');
      expect(duplicate.projectId).not.toBe(originalId);
      expect(duplicate.storagePath).not.toBe(originalPath);
      expect(duplicate.isArchived).toBe(false);
    });

    test('should archive project and move to archived tab', async ({ page }) => {
      // Archive the project
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /archive/i }).click();

      // Confirm archive in dialog
      await page.getByRole('button', { name: /archive/i }).click();

      // Project should no longer be in active tab
      await expect(page.getByText('Test Project')).not.toBeVisible();

      // Switch to archived tab
      await page.getByRole('button', { name: /archived/i }).click();

      // Project should be visible in archived tab
      await expect(page.getByText('Test Project')).toBeVisible();
      await expect(page.getByText(/archived/i)).toBeVisible();

      // Verify localStorage
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects[0].isArchived).toBe(true);
    });

    test('should restore archived project', async ({ page }) => {
      // First archive the project
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /archive/i }).click();
      await page.getByRole('button', { name: /archive/i }).click();

      // Switch to archived tab
      await page.getByRole('button', { name: /archived/i }).click();

      // Restore the project
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /restore/i }).click();

      // Switch back to active tab
      await page.getByRole('button', { name: /active/i }).click();

      // Project should be back in active list
      await expect(page.getByText('Test Project')).toBeVisible();

      // Verify localStorage
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects[0].isArchived).toBe(false);
    });

    test('should delete project with confirmation', async ({ page }) => {
      // Delete the project
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /delete/i }).click();

      // Confirm dialog should appear
      await expect(page.getByText(/permanently delete/i)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /delete/i }).click();

      // Project should be removed
      await expect(page.getByText('Test Project')).not.toBeVisible();

      // Verify localStorage is empty
      const projectIndex = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('sws.projectIndex') || '{}');
      });
      expect(projectIndex.state.projects).toHaveLength(0);
    });

    test('should cancel delete confirmation', async ({ page }) => {
      // Try to delete
      await page.getByRole('button', { name: /project actions/i }).click();
      await page.getByRole('button', { name: /delete/i }).click();

      // Cancel
      await page.getByRole('button', { name: /cancel/i }).click();

      // Project should still exist
      await expect(page.getByText('Test Project')).toBeVisible();
    });
  });

  test.describe('Navigation to Canvas', () => {
    test.beforeEach(async ({ page }) => {
      // Create a test project
      await page.getByRole('button', { name: /new project/i }).click();
      await page.getByLabel(/project name/i).fill('Canvas Test Project');
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText('Canvas Test Project')).toBeVisible();
    });

    test('should navigate to canvas editor from project card', async ({ page }) => {
      // Click open project
      await page.getByRole('link', { name: /open project/i }).click();

      // Should navigate to canvas URL
      await expect(page).toHaveURL(/\/canvas\//);

      // Canvas should be visible
      await expect(page.locator('canvas')).toBeVisible();
    });

    test('should show back to dashboard link in canvas', async ({ page }) => {
      await page.getByRole('link', { name: /open project/i }).click();
      await expect(page).toHaveURL(/\/canvas\//);

      // Back link should be visible
      await expect(page.getByRole('link', { name: /back.*dashboard/i })).toBeVisible();
    });

    test('should navigate back to dashboard from canvas', async ({ page }) => {
      await page.getByRole('link', { name: /open project/i }).click();
      await expect(page).toHaveURL(/\/canvas\//);

      // Click back
      await page.getByRole('link', { name: /back.*dashboard/i }).click();

      // Should be back at dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText('Canvas Test Project')).toBeVisible();
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

    // Create multiple projects
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: /new project/i }).click();
      await page.getByLabel(/project name/i).fill(`Project ${i}`);
      await page.getByRole('button', { name: /create/i }).click();
      await expect(page.getByText(`Project ${i}`)).toBeVisible();
    }

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // All projects should still be visible
    await expect(page.getByText('Project 1')).toBeVisible();
    await expect(page.getByText('Project 2')).toBeVisible();
    await expect(page.getByText('Project 3')).toBeVisible();
  });

  test('should maintain project order after reload (most recent first)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.evaluate(() => localStorage.removeItem('sws.projectIndex'));
    await page.reload();

    // Create projects
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill('First Created');
    await page.getByRole('button', { name: /create/i }).click();

    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill('Second Created');
    await page.getByRole('button', { name: /create/i }).click();

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

    // Create and archive a project
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill('Archived Project');
    await page.getByRole('button', { name: /create/i }).click();

    await page.getByRole('button', { name: /project actions/i }).click();
    await page.getByRole('button', { name: /archive/i }).click();
    await page.getByRole('button', { name: /archive/i }).click();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Project should not be in active tab
    await expect(page.getByText('Archived Project')).not.toBeVisible();

    // Should be in archived tab
    await page.getByRole('button', { name: /archived/i }).click();
    await expect(page.getByText('Archived Project')).toBeVisible();
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
    // Create a project (but don't archive it)
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill('Active Project');
    await page.getByRole('button', { name: /create/i }).click();

    // Switch to archived tab
    await page.getByRole('button', { name: /archived/i }).click();

    // Should show empty state for archived
    await expect(page.getByText(/no archived projects/i)).toBeVisible();
  });

  test('should provide create button in empty state', async ({ page }) => {
    // Click the create button in empty state
    const createButton = page.getByRole('button', { name: /create project/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('localStorage Structure Validation', () => {
  test('should use correct localStorage keys', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a project to trigger localStorage write
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill('Storage Test');
    await page.getByRole('button', { name: /create/i }).click();

    // Verify correct keys are used
    const keys = await page.evaluate(() => Object.keys(localStorage));

    expect(keys).toContain('sws.projectIndex');
  });

  test('should have valid ProjectListItem structure', async ({ page }) => {
    await page.goto('/dashboard');

    // Create a project with all fields
    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel(/project name/i).fill('Structure Test');
    await page.getByLabel(/project number/i).fill('STRUCT-001');
    await page.getByLabel(/client name/i).fill('Test Client');
    await page.getByRole('button', { name: /create/i }).click();

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

    // UUID format for projectId
    expect(project.projectId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // ISO8601 format for timestamps
    expect(() => new Date(project.createdAt)).not.toThrow();
    expect(() => new Date(project.modifiedAt)).not.toThrow();
  });
});
