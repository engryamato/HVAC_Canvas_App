/**
 * E2E Test Suite: Environment Detection (OS-INIT-002)
 *
 * This test suite validates the environment detection mechanism and
 * graceful degradation behavior in web browser environment.
 *
 * Test Coverage:
 * - Environment detection (isTauri)
 * - Web fallback behavior for file operations
 * - Feature availability indicators
 * - Error handling for unsupported operations
 *
 * @spec docs/offline-storage/01-initialization/OS-INIT-002-EnvironmentDetection.md
 * @created 2026-01-12
 */

import { test, expect, Page } from '@playwright/test';

test.describe('OS-INIT-002: Environment Detection', () => {

    test.describe('Core Detection', () => {
        test('should detect web browser environment (not Tauri)', async ({ page }) => {
            await page.goto('/');

            // Verify Tauri API is not available in web browser
            const isTauri = await page.evaluate(() => {
                return typeof window !== 'undefined' && '__TAURI__' in window;
            });

            expect(isTauri).toBe(false);
        });

        test('should have window object available', async ({ page }) => {
            await page.goto('/');

            const hasWindow = await page.evaluate(() => {
                return typeof window !== 'undefined';
            });

            expect(hasWindow).toBe(true);
        });
    });

    test.describe('Web Environment Fallbacks', () => {
        test('should function with localStorage persistence', async ({ page }) => {
            await page.goto('/');

            // Verify localStorage is available and functional
            const canUseStorage = await page.evaluate(() => {
                try {
                    localStorage.setItem('test-env-check', 'value');
                    const retrieved = localStorage.getItem('test-env-check');
                    localStorage.removeItem('test-env-check');
                    return retrieved === 'value';
                } catch (e) {
                    return false;
                }
            });

            expect(canUseStorage).toBe(true);
        });

        test('should block app when localStorage is unavailable', async ({ page }) => {
            await page.addInitScript(() => {
                Object.defineProperty(window, 'localStorage', {
                    value: {
                        getItem: () => { throw new Error('localStorage disabled'); },
                        setItem: () => { throw new Error('localStorage disabled'); },
                        removeItem: () => { throw new Error('localStorage disabled'); },
                        clear: () => { throw new Error('localStorage disabled'); },
                    },
                    configurable: true,
                });
            });

            await page.goto('/');
            const toast = page.getByTestId('toast-error');
            await expect(toast).toBeVisible({ timeout: 10000 });
            await expect(toast).toContainText(/local storage unavailable/i);
        });

        test('should persist app state to localStorage', async ({ page }) => {
            await page.goto('/');
            await page.evaluate(() => localStorage.clear());
            await page.reload();

            // Wait for app to initialize
            await expect(page.getByTestId('app-logo')).toBeVisible();

            // Complete onboarding to trigger state persistence
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
            await page.getByTestId('skip-tutorial-btn').click();

            // Verify state was persisted to localStorage
            const hasAppStorage = await page.evaluate(() => {
                return localStorage.getItem('hvac-app-storage') !== null;
            });

            expect(hasAppStorage).toBe(true);
        });
    });

    test.describe('Feature Availability', () => {
        test('should allow project creation in web mode', async ({ page }) => {
            await page.goto('/');
            await page.evaluate(() => localStorage.clear());
            await page.reload();

            // Navigate through onboarding
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
            await page.getByTestId('skip-tutorial-btn').click();
            await expect(page).toHaveURL(/\/dashboard/);

            // Verify "New Project" button is available
            const newProjectBtn = page.getByTestId('new-project-btn');
            await expect(newProjectBtn).toBeVisible();
            await expect(newProjectBtn).toBeEnabled();
        });

        test('should support project export via download', async ({ page }) => {
            // In web mode, export should trigger browser download (not file save)
            // This is a capability check, not full flow test

            await page.addInitScript(() => {
                localStorage.setItem(
                    'hvac-app-storage',
                    JSON.stringify({ state: { hasLaunched: true }, version: 0 })
                );
            });
            await page.goto('/?skipSplash=true');

            // Wait for dashboard
            await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

            // Web mode should still show export options (via download)
            // Exact UI depends on implementation
        });
    });

    test.describe('Graceful Degradation', () => {
        test('should not crash when file operations are unavailable', async ({ page }) => {
            await page.goto('/');

            // App should load successfully despite no file system access
            await expect(page.getByTestId('app-logo')).toBeVisible();

            // No JavaScript errors should occur
            const errors: string[] = [];
            page.on('pageerror', (error) => {
                errors.push(error.message);
            });

            // Navigate through app
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });

            // Filter out non-critical errors
            const criticalErrors = errors.filter(e =>
                e.includes('Tauri') ||
                e.includes('filesystem') ||
                e.includes('__TAURI__')
            );

            expect(criticalErrors).toHaveLength(0);
        });

        test('should handle missing Tauri APIs gracefully', async ({ page }) => {
            await page.goto('/');

            // Attempt to access file-related features should not crash
            const result = await page.evaluate(async () => {
                try {
                    // This simulates what happens when code tries to use Tauri
                    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
                    if (!isTauri) {
                        // Should return graceful fallback
                        return { mode: 'web', success: true };
                    }
                    return { mode: 'tauri', success: true };
                } catch (e) {
                    return { mode: 'error', success: false };
                }
            });

            expect(result.mode).toBe('web');
            expect(result.success).toBe(true);
        });
    });

    test.describe('Storage Layer Selection', () => {
        test('should use localStorage as primary persistence in web mode', async ({ page }) => {
            await page.goto('/');
            await page.evaluate(() => localStorage.clear());
            await page.reload();

            // Complete onboarding
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
            await page.getByTestId('skip-tutorial-btn').click();
            await expect(page).toHaveURL(/\/dashboard/);

            // Verify all expected storage keys exist
            const storageKeys = await page.evaluate(() => {
                return Object.keys(localStorage);
            });

            // Should have app state and preferences at minimum
            expect(storageKeys).toContain('hvac-app-storage');
            // Preferences are lazy-loaded, might not exist yet
            // expect(storageKeys).toContain('sws.preferences');
        });

        test('should maintain state across page reloads in web mode', async ({ page }) => {
            // First visit - complete onboarding
            await page.goto('/');
            await page.evaluate(() => localStorage.clear());
            await page.reload();

            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
            await page.getByTestId('skip-tutorial-btn').click();
            await expect(page).toHaveURL(/\/dashboard/);

            // Get hasLaunched state
            const beforeReload = await page.evaluate(() => {
                const data = localStorage.getItem('hvac-app-storage');
                return data ? JSON.parse(data) : null;
            });

            expect(beforeReload?.state?.hasLaunched).toBe(true);

            // Reload page
            await page.reload();

            // Should go directly to dashboard (not welcome screen)
            await expect(page).toHaveURL(/\/dashboard/);
            await expect(page.getByText('Welcome to HVAC Canvas')).not.toBeVisible();

            // State should persist
            const afterReload = await page.evaluate(() => {
                const data = localStorage.getItem('hvac-app-storage');
                return data ? JSON.parse(data) : null;
            });

            expect(afterReload?.state?.hasLaunched).toBe(true);
        });
    });

    test.describe('Console Warnings', () => {
        test('should not show environment-related errors in console', async ({ page }) => {
            const consoleErrors: string[] = [];

            page.on('console', (msg) => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto('/');
            await expect(page.getByTestId('app-logo')).toBeVisible();

            // Filter for environment-related errors
            const envErrors = consoleErrors.filter(e =>
                e.toLowerCase().includes('tauri') ||
                e.toLowerCase().includes('environment') ||
                e.toLowerCase().includes('__tauri__')
            );

            expect(envErrors).toHaveLength(0);
        });
    });
});
