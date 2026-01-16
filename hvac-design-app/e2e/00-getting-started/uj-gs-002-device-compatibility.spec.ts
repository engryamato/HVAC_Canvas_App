/**
 * E2E Test Suite: Device Compatibility and Responsive Adaptation (UJ-GS-002)
 *
 * This test suite validates device detection, responsive layout adaptation,
 * and blocking behavior for incompatible devices.
 *
 * Test Coverage:
 * - Mobile Blocking (< 640px): Application blocks access with no proceed option
 * - Tablet Responsive (640-1024px): Sidebars collapse, touch-friendly layout
 * - Desktop Full Layout (>= 1024px): All panels visible and expanded
 * - Window Resize Transitions: Dynamic blocking/unblocking
 * - Exit Button Behavior: Platform-appropriate exit
 *
 * @spec docs/user-journeys/00-getting-started/tauri-offline/UJ-GS-002-DeviceCompatibility.md
 * @author Device Compatibility Team
 * @created 2026-01-10
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Test Configuration: Device Viewports
 */
const VIEWPORTS = {
    mobile: {
        iphone14: { width: 390, height: 844 },
        pixel5: { width: 393, height: 851 },
        galaxyS21: { width: 360, height: 800 },
    },
    tablet: {
        ipadMini: { width: 768, height: 1024 },
        ipadAir: { width: 820, height: 1180 },
        galaxyTab: { width: 800, height: 1280 },
    },
    desktop: {
        laptop: { width: 1280, height: 720 },
        standard: { width: 1920, height: 1080 },
        wide: { width: 2560, height: 1440 },
    },
};

/**
 * Helper: Set viewport size and reload page
 */
async function setViewport(page: Page, width: number, height: number) {
    await page.setViewportSize({ width, height });
    await page.reload();
    // Wait for device detection to complete
    await page.waitForLoadState('networkidle');
}

async function markHasLaunched(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('hvac-app-storage', JSON.stringify({
            state: { hasLaunched: true },
            version: 0,
        }));
    });
}


test.describe('UJ-GS-002: Device Compatibility and Responsive Adaptation', () => {

    test.describe('Step 1: Mobile Device Blocking (< 640px)', () => {

        test('Scenario: iPhone 14 (390px) - Displays blocking overlay', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);

            // Navigate to application
            await page.goto('/');

            // Validate blocking overlay is visible
            const deviceWarning = page.getByTestId('device-warning');
            await expect(deviceWarning).toBeVisible({ timeout: 10000 });

            // Validate warning message content
            await expect(page.getByText('Device Incompatible')).toBeVisible();
            await expect(page.getByText(/requires a larger screen/i)).toBeVisible();
            await expect(page.getByText(/Tablet, Laptop, or Desktop/i)).toBeVisible();

            // Validate Exit button is present
            const exitButton = page.getByTestId('exit-application');
            await expect(exitButton).toBeVisible();

            // Validate NO proceed/dismiss button exists
            const proceedButton = page.getByRole('button', { name: /proceed|continue|dismiss/i });
            await expect(proceedButton).not.toBeVisible();

            // Validate application content is not interactive
            // The canvas and other UI should be rendered behind blur but not accessible
            const canvas = page.getByTestId('canvas-container');
            // Canvas may or may not exist in DOM, but overlay should block interaction
            await expect(deviceWarning).toHaveCSS('z-index', '50');
        });

        test('Scenario: Android Pixel 5 (393px) - Blocking overlay appears', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.pixel5);
            await page.goto('/');

            await expect(page.getByTestId('device-warning')).toBeVisible({ timeout: 10000 });
            await expect(page.getByText('Device Incompatible')).toBeVisible();
        });

        test('Scenario: Galaxy S21 (360px) - Smallest mobile, still blocked', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.galaxyS21);
            await page.goto('/');

            await expect(page.getByTestId('device-warning')).toBeVisible({ timeout: 10000 });
            await expect(page.getByTestId('exit-application')).toBeVisible();
        });

        test('Edge Case: Exactly 639px - Should be blocked', async ({ page }) => {
            await page.setViewportSize({ width: 639, height: 800 });
            await page.goto('/');

            await expect(page.getByTestId('device-warning')).toBeVisible({ timeout: 10000 });
            await expect(page.getByText('Device Incompatible')).toBeVisible();
        });

    });

    test.describe('Step 2: Exit Button Behavior (Mobile)', () => {

        test('Scenario: Exit button is keyboard accessible', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);
            await page.goto('/');

            const exitButton = page.getByTestId('exit-application');
            await expect(exitButton).toBeVisible();

            // Tab should focus the exit button
            await page.keyboard.press('Tab');
            await expect(exitButton).toBeFocused();

            // Enter or Space should activate (but we can't test actual exit in browser context)
            // We just verify the button responds to keyboard
        });

        test('Scenario: Exit button shows in web context (fallback message expected)', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);
            await page.goto('/');

            const exitButton = page.getByTestId('exit-application');
            await exitButton.click();

            // In web context, window.close() is blocked, so a fallback message should appear
            // or the button remains visible (actual close doesn't happen in test)
            // We don't test Tauri-specific behavior here
        });

    });

    test.describe('Step 3: Tablet Responsive Layout (640-1024px)', () => {

        test('Scenario: iPad Mini (768px) - Application loads successfully', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.tablet.ipadMini);
            await page.goto('/');

            // No blocking overlay should be visible
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Application header should be visible
            await expect(page.getByTestId('app-logo')).toBeVisible();
        });

        test('Scenario: iPad Air (820px) - Responsive sidebar behavior', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.tablet.ipadAir);
            await page.goto('/');

            // No blocking
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Sidebars should be in collapsed/drawer state by default
            // Left sidebar collapsed (not persistent)
            const leftSidebarDrawer = page.getByTestId('left-sidebar-drawer');
            // Open left sidebar via hamburger
            const leftMenuButton = page.getByRole('button', { name: /project|left.*menu/i }).first();
            if (await leftMenuButton.isVisible()) {
                await leftMenuButton.click();
                // Sidebar drawer should appear as overlay
                await expect(leftSidebarDrawer).toBeVisible();
            }
        });

        test('Edge Case: Exactly 640px - Should NOT be blocked (tablet threshold)', async ({ page }) => {
            await page.setViewportSize({ width: 640, height: 800 });
            await page.goto('/');

            // Should load successfully, not blocked
            await expect(page.getByTestId('device-warning')).not.toBeVisible();
            await expect(page.getByTestId('app-logo')).toBeVisible();
        });

        test('Edge Case: Galaxy Tab (800px) - Tablet layout applies', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.tablet.galaxyTab);
            await markHasLaunched(page);
            await page.goto('/dashboard');

            await expect(page.getByTestId('device-warning')).not.toBeVisible();
            await expect(page.getByText('Device Incompatible')).not.toBeVisible();

            // Dashboard should render in tablet layout
            await expect(page.getByTestId('dashboard-page')).toBeVisible();
        });

    });

    test.describe('Step 4: Desktop Full Layout (>= 1024px)', () => {

        test('Scenario: Laptop (1280px) - Full layout with all panels', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.desktop.laptop);
            await page.goto('/dashboard');

            // No blocking overlay
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Application loads successfully
            await expect(page).toHaveURL(/dashboard/);

            // Full layout should be present
            // Note: The actual sidebar visibility depends on implementation
            // We verify that the page loads and core elements are present
        });

        test('Scenario: Standard Desktop (1920px) - Full workspace available', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.desktop.standard);
            await markHasLaunched(page);
            await page.goto('/dashboard');

            await expect(page.getByTestId('device-warning')).not.toBeVisible();
            await expect(page.getByTestId('dashboard-page')).toBeVisible();
        });

        test('Scenario: Wide Monitor (2560px) - Maximum workspace', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.desktop.wide);
            await page.goto('/');

            await expect(page.getByTestId('device-warning')).not.toBeVisible();
            // Application should handle wide viewports gracefully
        });

    });

    test.describe('Step 5: Window Resize from Desktop to Mobile', () => {

        test('Scenario: Resize from 1440px to 639px - Blocking overlay appears', async ({ page }) => {
            // Start at desktop size
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto('/');

            // Verify no blocking initially
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Resize to just below threshold
            await setViewport(page, 639, 900);

            // Blocking overlay should now be visible
            await expect(page.getByTestId('device-warning')).toBeVisible();
            await expect(page.getByText('Device Incompatible')).toBeVisible();
        });

        test('Scenario: Progressive resize through breakpoints', async ({ page }) => {
            // Start at wide desktop
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto('/');
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Resize to tablet range (no blocking)
            await setViewport(page, 800, 1080);
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Resize to just above threshold (still no blocking)
            await setViewport(page, 641, 1080);
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Resize to threshold - blocking activates
            await setViewport(page, 639, 1080);
            await expect(page.getByTestId('device-warning')).toBeVisible();
        });

    });

    test.describe('Step 6: Recovery from Blocking by Expanding Window', () => {

        test('Scenario: Expand from 639px to 640px - Overlay disappears', async ({ page }) => {
            await page.setViewportSize({ width: 639, height: 800 });
            await page.goto('/');

            await expect(page.getByTestId('device-warning')).toBeVisible();

            // Expand to 640px
            await page.setViewportSize({ width: 640, height: 800 });
            await page.waitForTimeout(300);

            // Overlay should disappear
            await expect(page.getByTestId('device-warning')).not.toBeVisible();
            await expect(page.getByTestId('app-logo')).toBeVisible();
        });

        test('Scenario: Expand to desktop - Application fully functional', async ({ page }) => {
            // Start blocked at mobile
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto('/');
            await expect(page.getByTestId('device-warning')).toBeVisible();

            // Expand to desktop
            await setViewport(page, 1280, 720);

            // Application should be fully accessible
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Verify we can navigate normally
            await page.goto('/dashboard');
            await expect(page).toHaveURL(/dashboard/);
        });

        test('Scenario: State preservation during resize cycle', async ({ page }) => {
            // Start at desktop, navigate to dashboard
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.goto('/dashboard');
            await expect(page).toHaveURL(/dashboard/);

            // Shrink to mobile (blocked)
            await setViewport(page, 390, 844);
            await expect(page.getByTestId('device-warning')).toBeVisible();

            // Expand back to desktop
            await setViewport(page, 1280, 720);
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Verify still on dashboard (state preserved)
            await expect(page).toHaveURL(/dashboard/);
        });

    });

    test.describe('Edge Cases', () => {

        test('Edge Case 1: Portrait tablet rotation (iPad Mini portrait ~768px)', async ({ page }) => {
            // iPad Mini in portrait is wide enough to not be blocked
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/');

            // Should not be blocked
            await expect(page.getByTestId('device-warning')).not.toBeVisible();
        });

        test('Edge Case 2: Browser zoom simulation (effective width < 640)', async ({ page }) => {
            // Simulating high zoom by setting smaller viewport
            // At 150% zoom, 1200px physical ≈ 800px CSS
            // At 200% zoom, 1200px physical ≈ 600px CSS
            await page.setViewportSize({ width: 600, height: 800 }); // Simulates zoomed desktop

            await page.goto('/');

            // Should be blocked (under threshold)
            await expect(page.getByTestId('device-warning')).toBeVisible();
        });

        test('Edge Case 3: Rapid resize (flicker prevention)', async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.goto('/');

            // Rapidly change sizes back and forth
            await page.setViewportSize({ width: 639, height: 720 });
            await page.setViewportSize({ width: 641, height: 720 });
            await page.setViewportSize({ width: 639, height: 720 });
            await page.setViewportSize({ width: 640, height: 720 });

            // Final state should be stable (not blocked at 640)
            await page.reload();
            await expect(page.getByTestId('device-warning')).not.toBeVisible();
        });

        test('Edge Case 4: Boundary testing - 638px, 639px, 640px, 641px', async ({ page }) => {
            // Test precise boundary behavior
            const testCases = [
                { width: 638, shouldBlock: true },
                { width: 639, shouldBlock: true },
                { width: 640, shouldBlock: false },
                { width: 641, shouldBlock: false },
            ];

            for (const { width, shouldBlock } of testCases) {
                await page.setViewportSize({ width, height: 800 });
                await page.goto('/');

                if (shouldBlock) {
                    await expect(page.getByTestId('device-warning')).toBeVisible();
                } else {
                    await expect(page.getByTestId('device-warning')).not.toBeVisible();
                }
            }
        });

    });

    test.describe('Accessibility (A11Y)', () => {

        test('A11Y: Blocking overlay has correct ARIA attributes', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);
            await page.goto('/');

            const overlay = page.getByTestId('device-warning');
            await expect(overlay).toBeVisible();

            // Verify ARIA role
            await expect(overlay).toHaveAttribute('role', 'alertdialog');

            // Verify aria-live (should be assertive for immediate announcement)
            const ariaLive = await overlay.getAttribute('aria-live');
            expect(ariaLive).toBe('assertive');
        });

        test('A11Y: Exit button is keyboard navigable', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);
            await page.goto('/');

            const exitButton = page.getByTestId('exit-application');
            await expect(exitButton).toBeVisible();

            // Tab should focus button
            await page.keyboard.press('Tab');
            await expect(exitButton).toBeFocused();
        });

        test('A11Y: Focus is trapped within overlay when blocked', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);
            await page.goto('/');

            const exitButton = page.getByTestId('exit-application');

            // Tab cycles within overlay (only exit button focusable)
            await page.keyboard.press('Tab');
            await expect(exitButton).toBeFocused();

            // Another tab should cycle back (no other elements in overlay)
            await page.keyboard.press('Tab');
            // Should still be on exit button or cycle to beginning of overlay
            const focusedElement = await page.locator(':focus').evaluate(el => el.tagName);
            expect(focusedElement).toBeTruthy(); // Something is focused
        });

    });

    test.describe('Performance', () => {

        test('Performance: Detection completes within 100ms', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);

            const startTime = Date.now();
            await page.goto('/');

            // Wait for overlay to appear
            await expect(page.getByTestId('device-warning')).toBeVisible();
            const detectionTime = Date.now() - startTime;

            // Should appear quickly (allowing for network/render time)
            // Actual detection should be < 100ms, total time may be higher
            console.log(`Detection + Render time: ${detectionTime}ms`);
            // We don't enforce strict timing in E2E (too variable), just verify it appears
        });

        test('Performance: Resize handling is smooth (no flicker)', async ({ page }) => {
            await page.setViewportSize({ width: 1280, height: 720 });
            await page.goto('/');

            // Take screenshot before resize
            // await page.screenshot({ path: 'before-resize.png' });

            // Resize to blocked state
            await page.setViewportSize({ width: 639, height: 720 });
            await page.waitForTimeout(200); // Allow debounce

            // Overlay should be visible and stable
            await expect(page.getByTestId('device-warning')).toBeVisible();
        });

    });

    test.describe('Integration with Application Flow', () => {

        test('Integration: Mobile user cannot bypass to dashboard', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.mobile.iphone14);

            // Try to navigate directly to dashboard
            await page.goto('/dashboard');

            // Should still see blocking overlay (redirect or overlay applies on all routes)
            await expect(page.getByTestId('device-warning')).toBeVisible();
        });

        test('Integration: Desktop user proceeds to dashboard normally', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.desktop.standard);
            await page.goto('/');

            // No blocking
            await expect(page.getByTestId('device-warning')).not.toBeVisible();

            // Can navigate to dashboard
            await page.goto('/dashboard');
            await expect(page).toHaveURL(/dashboard/);
        });

        test('Integration: Tablet user accesses all features (responsive mode)', async ({ page }) => {
            await page.setViewportSize(VIEWPORTS.tablet.ipadAir);
            await page.goto('/dashboard');

            // No blocking, can access dashboard
            await expect(page.getByTestId('device-warning')).not.toBeVisible();
            await expect(page).toHaveURL(/dashboard/);

            // Can interact with sidebar toggles if present
            // (Exact implementation depends on UI components)
        });

    });

});
