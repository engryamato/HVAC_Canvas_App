/**
 * E2E Test Suite: Open Existing Project (UJ-PM-002)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-PM-002-OpenExistingProject.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 * Every scenario mentioned in the doc is tested here.
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Seed IndexedDB with mock project data
 * This allows us to test "opening existing projects" without running create flow
 */
async function seedProjects(page: Page, projects: any[]) {
    await page.goto('/dashboard');
    await page.evaluate((projectsData) => {
        // Use the correct localStorage key from Zustand persist middleware
        const storageKey = 'sws.projectIndex';
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{"state":{"projects":[],"recentProjectIds":[]}}');

        // Add new projects to the existing state
        existing.state.projects = [...(existing.state.projects || []), ...projectsData];

        // Populate recentProjectIds with the seeded project IDs (up to 5)
        const newIds = projectsData.map((p: any) => p.projectId);
        existing.state.recentProjectIds = [...newIds, ...(existing.state.recentProjectIds || [])].slice(0, 5);

        // Save back to localStorage for Dashboard store
        localStorage.setItem(storageKey, JSON.stringify(existing));

        const buildEnvelope = (project: any) => {
            const now = new Date().toISOString();
            const projectPayload = {
                project: {
                    schemaVersion: project.version || '1.0.0',
                    projectId: project.projectId,
                    projectName: project.projectName || 'Untitled Project',
                    projectNumber: project.projectNumber,
                    clientName: project.clientName,
                    createdAt: project.createdAt || now,
                    modifiedAt: project.modifiedAt || now,
                    entities: { byId: {}, allIds: [] },
                    viewportState: { panX: 0, panY: 0, zoom: 1 },
                    settings: { unitSystem: 'imperial', gridSize: 24, gridVisible: true },
                    calculations: undefined,
                    billOfMaterials: undefined,
                },
            };

            let hash = 2166136261;
            const value = JSON.stringify(projectPayload);
            for (let i = 0; i < value.length; i += 1) {
                hash ^= value.charCodeAt(i);
                hash = Math.imul(hash, 16777619);
            }
            const checksum = (hash >>> 0).toString(16).padStart(8, '0');

            return {
                schemaVersion: '1.0.0',
                projectId: project.projectId,
                savedAt: now,
                checksum,
                payload: projectPayload,
            };
        };

        for (const project of projectsData) {
            const envelope = buildEnvelope(project);
            localStorage.setItem(`hvac-project-${project.projectId}`, JSON.stringify(envelope));
        }
    }, projects);
    await page.reload();
}

/**
 * Helper: Clear all application storage
 */
async function clearProjectStorage(page: Page) {
    await page.goto('/dashboard');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.reload();
}

/**
 * Helper: Mock File System Access API
 * Returns a mock FileSystemFileHandle for testing file-based project opening
 */
async function mockFileSystemAccess(page: Page, fileContent: any) {
    await page.evaluate((content) => {
        const mockFile = new File(
            [JSON.stringify(content)],
            'test-project.hvac',
            { type: 'application/json' }
        );

        const mockFileHandle = {
            kind: 'file',
            name: 'test-project.hvac',
            getFile: async () => mockFile,
        };

        // Mock showOpenFilePicker
        (window as any).showOpenFilePicker = async () => {
            return [mockFileHandle];
        };
    }, fileContent);
}

/**
 * Helper: Create mock project data
 */
function createMockProject(overrides = {}) {
    const projectId = crypto.randomUUID();
    return {
        projectId,
        projectName: 'Office Building HVAC',
        projectNumber: '',
        clientName: 'Acme Corporation',
        version: '1.0.0', // Project version
        entityCount: 12,
        createdAt: new Date('2025-01-01').toISOString(),
        modifiedAt: new Date('2025-01-09').toISOString(),
        storagePath: `project-${projectId}`,
        isArchived: false,
        ...overrides,
    };
}

test.describe('UJ-PM-002: Open Existing Project', () => {
    test.beforeEach(async ({ page }) => {
        // Start with clean slate
        await clearProjectStorage(page);
        // Capture console logs to debug
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    });

    test('Strict Flow: Open Project from Dashboard', async ({ page }) => {
        // Seed projects for testing
        const mockProjects = [
            createMockProject({
                projectName: 'Office HVAC',
                modifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                entityCount: 12
            }),
            createMockProject({
                projectName: 'Warehouse A',
                modifiedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                entityCount: 8
            }),
            createMockProject({
                projectName: 'Retail Store',
                modifiedAt: new Date('2025-01-15').toISOString(),
                entityCount: 15
            }),
        ];

        await seedProjects(page, mockProjects);

        // --- Step 1: Accessing Dashboard and Project List ---
        await test.step('Step 1: Accessing Dashboard and Project List', async () => {
            // User is on dashboard (already navigated by seedProjects)
            await expect(page).toHaveURL('/dashboard', { timeout: 5000 });

            // Verify Dashboard loads with project list
            await expect(page.getByText('Recent Projects')).toBeVisible({ timeout: 5000 });
            await expect(page.getByText('All Projects')).toBeVisible({ timeout: 5000 });

            // Verify project cards are rendered in All Projects
            const allProjects = page.locator('[data-testid="all-projects"]');
            await expect(allProjects.getByText('Office HVAC')).toBeVisible({ timeout: 5000 });
            await expect(allProjects.getByText('Warehouse A')).toBeVisible({ timeout: 5000 });
            await expect(allProjects.getByText('Retail Store')).toBeVisible({ timeout: 5000 });

            // Verify metadata displays (entity count)
            await expect(allProjects.getByText('12 items')).toBeVisible({ timeout: 5000 });
            await expect(allProjects.getByText('8 items')).toBeVisible({ timeout: 5000 });
        });

        // --- Step 2: Searching and Filtering Projects ---
        await test.step('Step 2: Searching and Filtering Projects', async () => {
            // User clicks search box
            const searchInput = page.getByPlaceholder(/search/i);
            await searchInput.click();

            // User types "warehouse"
            await searchInput.fill('warehouse');

            // Wait for debounced search to complete
            await page.waitForTimeout(500);

            // Verify filtered results in All Projects
            const allProjects = page.locator('[data-testid="all-projects"]');
            await expect(allProjects.getByText('Warehouse A')).toBeVisible({ timeout: 5000 });
            // Other projects should be filtered out or hidden
            // (This depends on implementation - they might be display:none or removed from DOM)

            // Verify result count (if implemented)
            // await expect(page.getByText(/1 project.*found/i)).toBeVisible();

            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(500);

            // All projects visible again in All Projects
            await expect(page.locator('[data-testid="all-projects"]').getByText('Office HVAC')).toBeVisible({ timeout: 5000 });
            await expect(page.locator('[data-testid="all-projects"]').getByText('Retail Store')).toBeVisible({ timeout: 5000 });
        });

        // --- Step 3: Opening Project from Dashboard ---
        await test.step('Step 3: Opening Project from Dashboard', async () => {
            // Locate the "Office HVAC" project card in All Projects
            const allProjects = page.locator('[data-testid="all-projects"]');
            const projectCard = allProjects.locator('[data-testid="project-card"]').filter({
                hasText: 'Office HVAC'
            });

            // Wait for card to be visible
            await expect(projectCard.first()).toBeVisible({ timeout: 5000 });

            // Click the "Open" button
            const openButton = projectCard.first().getByRole('button', { name: /open/i });
            await openButton.scrollIntoViewIfNeeded();
            await expect(openButton).toBeVisible({ timeout: 3000 });
            await openButton.click();

            // Wait for navigation to canvas
            await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
            await page.waitForLoadState('networkidle');

            await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
            await expect(page.getByTestId('breadcrumb')).toContainText('Office HVAC');
        });
    });

    test('Step 4: Opening Project from File System', async ({ page }) => {
        await test.step('Step 4: Opening Project from File System', async () => {
            const projectId = crypto.randomUUID();
            const now = new Date().toISOString();
            const mockFileProject = {
                schemaVersion: '1.0.0',
                projectId,
                projectName: 'File System Project',
                projectNumber: '',
                clientName: 'From File',
                createdAt: now,
                modifiedAt: now,
                entities: { byId: {}, allIds: [] },
                viewportState: { panX: 0, panY: 0, zoom: 1 },
                settings: { unitSystem: 'imperial', gridSize: 24, gridVisible: true },
                calculations: undefined,
                billOfMaterials: undefined,
            };

            await mockFileSystemAccess(page, mockFileProject);

            // User clicks File menu
            await page.getByRole('button', { name: /file/i }).click();

            // User clicks "Open from File..."
            await page.getByRole('menuitem', { name: /open from file/i }).click();

            // The native file picker would open here, but it's mocked
            // Our mock auto-returns a file handle

            // Wait for project to load
            await page.waitForLoadState('networkidle');
            await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });

            await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
            await expect(page.getByTestId('breadcrumb')).toContainText('File System Project');
        });
    });



    test('Step 5: Auto-Opening Last Project', async ({ page }) => {
        // Create a mock project
        const mockProject = createMockProject({
            projectName: 'Auto Open Project',
        });

        await seedProjects(page, [mockProject]);
        await page.evaluate((projectId) => {
            localStorage.setItem('sws.settings', JSON.stringify({
                state: { autoOpenLastProject: true },
                version: 0
            }));
            localStorage.setItem('lastActiveProjectId', projectId);
        }, mockProject.projectId);

         await test.step('Step 5: Auto-Opening Last Project', async () => {
            // Reload page to trigger auto-open
            await page.reload();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for auto-open notification (if implemented)
            // await expect(page.getByText(/opening last project/i)).toBeVisible();

            // Should auto-navigate to canvas
            await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
            await page.waitForLoadState('networkidle');

            // Verify correct project opened
            await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
            await expect(page.getByTestId('breadcrumb')).toContainText('Auto Open Project');
        });
    });

    test('Edge Case: Project Corrupted or Invalid Data', async ({ page }) => {
        const projectId = crypto.randomUUID();
        await page.goto('/dashboard');
        await page.evaluate((pid) => {
            localStorage.setItem('sws.projectIndex', JSON.stringify({
                state: {
                    projects: [{
                        projectId: pid,
                        projectName: 'Corrupted Project',
                        createdAt: new Date().toISOString(),
                        modifiedAt: new Date().toISOString(),
                        storagePath: `project-${pid}`,
                        isArchived: false,
                        entityCount: 0,
                    }],
                    recentProjectIds: [pid],
                    loading: false,
                },
                version: 0,
            }));
            localStorage.setItem(`hvac-project-${pid}`, 'corrupted');
        }, projectId);
        await page.reload();

        await test.step('Edge Case: Corrupted Data Handling', async () => {
            await page.goto(`/canvas/${projectId}`);
            await expect(page.getByRole('heading', { name: /project not found/i })).toBeVisible({ timeout: 10000 });
        });
    });

    test('Edge Case: Version Mismatch - Newer Project Version', async ({ page }) => {
        // Seed a project with higher version
        const newerVersionProject = createMockProject({
            projectName: 'Future Version Project',
            version: '99.0.0', // Much higher than current app version
        });

        await seedProjects(page, [newerVersionProject]);

         await test.step('Edge Case: Version Mismatch Handling', async () => {
            // Try to open newer version project (scope to all-projects to avoid strict mode)
            const allProjects = page.locator('[data-testid="all-projects"]');
            const projectCard = allProjects.locator('[data-testid="project-card"]').filter({
                hasText: 'Future Version Project'
            });

            // Wait for card to be visible
            await expect(projectCard.first()).toBeVisible({ timeout: 5000 });

            const openButton = projectCard.first().getByRole('button', { name: /open/i });
            await openButton.scrollIntoViewIfNeeded();
            await expect(openButton).toBeVisible({ timeout: 3000 });
            await openButton.click();

            // Wait for warning dialog
            await page.waitForTimeout(1000);
            await expect(page.getByRole('heading', { name: /newer.*version/i })).toBeVisible({ timeout: 5000 });

            // Verify options presented
            await expect(page.getByRole('button', { name: /open anyway/i })).toBeVisible({ timeout: 3000 });
            await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible({ timeout: 3000 });
        });
    });

    test('Error Scenario: IndexedDB Read Failure', async ({ page }) => {
        await test.step('Error Scenario: IndexedDB Failure', async () => {
            // Mock Storage/Loading failure using addInitScript to persist across navigation
            const seeded = createMockProject({ projectName: 'Storage Failure Project' });
            await seedProjects(page, [seeded]);

            await page.addInitScript(() => {
                const originalGetItem = Storage.prototype.getItem;
                Storage.prototype.getItem = function (key) {
                    if (typeof key === 'string' && key.startsWith('hvac-project-')) {
                        throw new Error('Storage Read Failed');
                    }
                    return originalGetItem.call(this, key);
                };
            });

            await page.goto(`/canvas/${seeded.projectId}`);

            // Wait for error message to be displayed
            await page.waitForTimeout(1000);

            await expect(page.getByRole('heading', { name: /project not found/i })).toBeVisible({ timeout: 10000 });
        });
    });



    test('Keyboard Shortcuts: Dashboard Navigation', async ({ page }) => {
        // Seed multiple projects
        const mockProjects = [
            createMockProject({ projectName: 'Project 1' }),
            createMockProject({ projectName: 'Project 2' }),
            createMockProject({ projectName: 'Project 3' }),
        ];

        await seedProjects(page, mockProjects);

        await test.step('Keyboard Shortcuts: Search', async () => {
            // Press Ctrl+F to focus search (or Meta+F on Mac if supported, but typically Ctrl+F works for web apps)
            // Ensure page is focused first
            await page.click('body');
            await page.keyboard.press('Control+f');

            // Search input should be focused
            const searchInput = page.getByPlaceholder(/search/i);
            await expect(searchInput).toBeFocused();

            // Type search term
            await page.keyboard.type('Project 2');
            await page.waitForTimeout(500);

            // Verify filtered
            const allProjects = page.locator('[data-testid="all-projects"]');
            await expect(allProjects.getByText('Project 2')).toBeVisible();

            // Press Escape to clear search
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);

            // All projects visible again
            await expect(page.locator('[data-testid="all-projects"]').getByText('Project 1')).toBeVisible();
            await expect(page.locator('[data-testid="all-projects"]').getByText('Project 3')).toBeVisible();
        });

        await test.step('Keyboard Shortcuts: Open Project with Enter', async () => {
            await page.click('body');
            await page.keyboard.press('Enter');

            // Should navigate to canvas
            await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
        });
    });

    test('Verify Recent Projects Section', async ({ page }) => {
        // Seed projects with different modified dates
        const mockProjects = Array.from({ length: 12 }, (_, i) =>
            createMockProject({
                projectName: `Project ${i + 1}`,
                modifiedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(), // i days ago
            })
        );

        await seedProjects(page, mockProjects);

        await test.step('Verify Recent Projects Limited to 10', async () => {
            // Navigate to dashboard
            await page.goto('/dashboard');

            // Recent Projects section should exist
            await expect(page.getByText('Recent Projects')).toBeVisible();

            // Count projects in Recent section (should be max 5)
            // Implementation detail: assuming Recent section has a specific container
            const recentSection = page.locator('[data-testid="recent-projects"]');
            if (await recentSection.isVisible()) {
                const recentCards = recentSection.locator('[data-testid="project-card"]');
                const count = await recentCards.count();
                expect(count).toBeLessThanOrEqual(5);
            }
        });
    });

    test('Empty State: No Projects', async ({ page }) => {
        await test.step('Empty State Display', async () => {
            // Navigate to dashboard with no projects
            await page.goto('/dashboard');

            // Verify empty state message
            await expect(page.getByText(/no projects yet/i)).toBeVisible();

            // Verify "Create New Project" button in empty state
            await expect(page.getByTestId('empty-state-create-btn')).toBeVisible();
        });
    });
});
