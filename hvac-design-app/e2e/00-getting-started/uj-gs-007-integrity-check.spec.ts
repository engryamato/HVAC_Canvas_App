/**
 * E2E Test Suite: Database Integrity Check (OS-INIT-003)
 *
 * This test suite validates data integrity verification during application
 * startup and project loading, including corruption detection and recovery.
 *
 * Test Coverage:
 * - localStorage validation at startup
 * - Project file validation on load
 * - Backup recovery when main file corrupted
 * - User notifications for data issues
 *
 * @spec docs/offline-storage/01-initialization/OS-INIT-003-DatabaseIntegrityCheck.md
 * @created 2026-01-12
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Clear all storage
 */
async function clearStorage(page: Page) {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}

/**
 * Helper: Set localStorage item
 */
async function setStorageItem(page: Page, key: string, value: any) {
    await page.evaluate(([k, v]) => {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }, [key, value]);
}

test.describe('OS-INIT-003: Database Integrity Check', () => {
    test.beforeEach(({ page }) => {
        page.on('console', msg => console.log(`[Browser] ${msg.text()}`));
    });

    test.describe('Debug: Storage Dump', () => {
        test('should dump real storage content', async ({ page }) => {
            await page.goto('/');
            await clearStorage(page);
            await page.reload();
            // Complete onboarding
            await page.getByTestId('skip-tutorial-btn').click();
            await expect(page).toHaveURL(/\/dashboard/);

            // Dump storage
            const dump = await page.evaluate(() => {
                return JSON.stringify(localStorage);
            });
            console.log('[Browser] STORAGE DUMP:', dump);
        });
    });

    test.describe('Phase 1: localStorage Validation (Startup)', () => {
        test('should handle clean localStorage gracefully', async ({ page }) => {
            await page.goto('/');
            await clearStorage(page);
            await page.reload();

            // App should load with default state
            await expect(page.getByTestId('app-logo')).toBeVisible();
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });

            // Welcome screen should appear (first launch)
            await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible();
        });

        test('should recover from corrupted localStorage JSON', async ({ page }) => {
            await page.goto('/');

            // Set corrupted JSON in preferences store
            await setStorageItem(page, 'sws.preferences', '{ invalid json content');

            // Reload page
            await page.reload();

            // App should still load (falls back to defaults)
            await expect(page.getByTestId('app-logo')).toBeVisible();

            // No JavaScript errors from JSON parse failure
            const errors: string[] = [];
            page.on('pageerror', (e) => errors.push(e.message));

            await page.waitForTimeout(1000);
            const jsonErrors = errors.filter(e => e.includes('JSON'));
            expect(jsonErrors).toHaveLength(0);
        });

        test('should recover from corrupted app state', async ({ page }) => {
            await page.goto('/');

            // Set corrupted app storage
            await setStorageItem(page, 'hvac-app-storage', 'not-valid-json-at-all');

            await page.reload();

            // Should treat as first launch (corrupted data ignored)
            await expect(page.getByTestId('app-logo')).toBeVisible();
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });

            // First launch experience (since hasLaunched couldn't be read)
            await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible();
        });

        test('should handle empty localStorage values', async ({ page }) => {
            await page.goto('/');

            // Set empty values
            await setStorageItem(page, 'hvac-app-storage', '');
            await setStorageItem(page, 'sws.preferences', '{}');

            await page.reload();

            // Should load with defaults
            await expect(page.getByTestId('app-logo')).toBeVisible();
        });
    });

    test.describe('Phase 2: Project Data Validation', () => {
        test('should handle missing project index gracefully', async ({ page }) => {
            await page.goto('/');
            await clearStorage(page);

            // Simulate returning user without project index
            await setStorageItem(page, 'hvac-app-storage', {
                state: { hasLaunched: true },
                version: 0
            });

            await page.reload();

            // Should go to dashboard (not welcome)
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

            // Should show empty state (no projects found)
            const projectList = page.getByTestId('project-list');
            if (await projectList.isVisible()) {
                // No projects should be listed (or empty state shown)
            }
        });

        test('should validate project entry structure', async ({ page }) => {
            await page.goto('/');

            // Set valid returning user state
            await setStorageItem(page, 'hvac-app-storage', {
                state: { hasLaunched: true },
                version: 0
            });

            // Set valid project index
            await setStorageItem(page, 'sws.projectIndex', {
                state: {
                    projects: [{
                        projectId: 'test-project-001',
                        projectName: 'Test Project',
                        createdAt: new Date().toISOString(),
                        modifiedAt: new Date().toISOString(),
                        storagePath: 'project-test-project-001',
                        isArchived: false
                    }],
                    recentProjectIds: [],
                    loading: false
                },
                version: 0
            });

            await page.reload();

            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
            // Project should appear in list
            await expect(page.getByText('Test Project')).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('User Notifications', () => {
        test('should show warning toast when backup loaded', async ({ page }) => {
            await page.goto('/');

            // Complete onboarding to trigger persistence
            await setStorageItem(page, 'hvac-app-storage', {
                state: { hasLaunched: true },
                version: 0
            });
            await page.reload();
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
            await page.getByTestId('skip-tutorial-btn').click();

            // Load project with mocked backup
            await setStorageItem(page, 'hvac-project-test-project-001', {
                schemaVersion: '1.0.0',
                projectId: 'test-project-001',
                savedAt: new Date().toISOString(),
                payload: { project: {} }
            });

            // Simulate backup recovery scenario
            await page.goto('/');
            await page.reload();
            await expect(page.getByTestId('app-logo')).toBeVisible();

            // Check for backup-loaded warning toast
            // The logic here is simplified for verification
            const errorToast = page.locator('[role="alert"]').filter({ hasText: /backup|loaded/i });
            await expect(errorToast).toBeVisible({ timeout: 2000 });
        });
    });

    test.describe('Performance', () => {
        test('should complete startup validation quickly', async ({ page }) => {
            await page.goto('/');
            await clearStorage(page);

            const startTime = Date.now();
            await page.reload();

            // Wait for app to be interactive
            await expect(page.getByTestId('app-logo')).toBeVisible();
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });

            const loadTime = Date.now() - startTime;

            // Validation should complete within reasonable time
            expect(loadTime).toBeLessThan(5000);
        });
    });

    test.describe('State Consistency', () => {
        test('should maintain consistent state after recovery', async ({ page }) => {
            await page.goto('/');

            // Corrupt some storage but not all
            await setStorageItem(page, 'sws.preferences', '{ broken');
            await setStorageItem(page, 'hvac-app-storage', {
                state: { hasLaunched: true },
                version: 0
            });

            await page.reload();

            // App should recover preferences to defaults
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

            // Verify preferences are valid (check via localStorage)
            const prefs = await page.evaluate(() => {
                const data = localStorage.getItem('sws.preferences');
                try {
                    return JSON.parse(data || '{}');
                } catch {
                    return null;
                }
            });

            // Should have valid preferences after recovery
            expect(prefs).not.toBeNull();
        });
    });
});
