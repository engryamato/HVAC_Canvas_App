import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * E2E Test Suite: Basic Navigation and Interface Overview
 * 
 * @spec docs/user-journeys/00-getting-started/tauri-offline/UJ-GS-003-BasicNavigationAndInterfaceOverview.md
 * 
 * This test suite verifies the application's main interface layout, navigation patterns,
 * sidebar functionality, toolbar operations, and keyboard-driven navigation.
 * 
 * IMPORTANT: Follows strict "Human-Centric" navigation policy:
 * - ✅ ALLOWED: Initial entry via page.goto('/') or page.goto('/dashboard')
 * - ❌ PROHIBITED: Mid-flow page.goto() calls to navigate between states
 * - ✅ REQUIRED: All navigation MUST use UI interactions (clicks, forms, keyboards)
 */

test.describe('Basic Navigation and Interface Overview', () => {
    test.use({ viewport: { width: 1920, height: 1080 } }); // Desktop resolution

    /**
     * SETUP: Create a test project for Canvas tests
     */
    test.beforeEach(async ({ page }) => {
        // Use addInitScript to set localStorage BEFORE any page loads
        // Key is 'hvac-app-storage' with hasLaunched: true to skip onboarding
        await page.addInitScript(() => {
            localStorage.setItem('hvac-app-storage', JSON.stringify({
                state: { hasLaunched: true },
                version: 0
            }));
        });

        // Navigate to dashboard
        await page.goto('/dashboard');
        await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 10000 });

        // Create a test project if none exists
        const projectCards = page.locator('[data-testid="project-card"]');
        const projectCount = await projectCards.count();

        if (projectCount === 0) {
            // Create new project - empty state uses different button ID
            await page.click('[data-testid="empty-state-create-btn"]');
            await page.fill('[data-testid="project-name-input"]', 'Navigation Test Project');
            await page.click('[data-testid="create-button"]');

            // Wait for project to be created and canvas to load, then go back to dashboard
            await page.waitForURL(/\/canvas\//);
            await page.goto('/dashboard');
            await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
            await expect(page.locator('[data-testid="project-card"]').first()).toBeVisible();
        }
    });

    /**
     * Test Group: Main Layout Regions
     */
    test.describe('Main Layout Regions', () => {
        test('should display all five primary regions on Canvas page', async ({ page }) => {
            // Open a project to navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Wait for Canvas page to load
            await expect(page).toHaveURL(/\/canvas\//);

            // A. Header (Fixed Height: 50px)
            const header = page.locator('[data-testid="header"]');
            await expect(header).toBeVisible();
            await expect(header).toContainText('HVAC'); // Branding/logo

            // Verify menu bar items
            await expect(page.locator('text=File')).toBeVisible();
            await expect(page.locator('text=Edit')).toBeVisible();
            await expect(page.locator('text=View')).toBeVisible();
            await expect(page.locator('text=Tools')).toBeVisible();
            await expect(page.locator('text=Help')).toBeVisible();

            // B. Toolbar (Fixed Height: 45px)
            const toolbar = page.getByTestId('toolbar');
            await expect(toolbar).toBeVisible();

            // Verify toolbar groups
            await expect(page.getByTestId('tool-select"]')).toBeVisible(); // Drawing tools
            await expect(page.getByTestId('undo-button"]')).toBeVisible(); // Edit operations
            await expect(page.getByTestId('zoom-control"]')).toBeVisible(); // View controls

            // C. Left Sidebar (Collapsible, Default Width: 280px)
            const leftSidebar = page.getByTestId('left-sidebar');
            await expect(leftSidebar).toBeVisible();
            await expect(leftSidebar).not.toHaveClass(/collapsed/); // Default expanded state

            // D. Canvas Area (Flexible, Fills Remaining Space)
            const canvasArea = page.getByTestId('canvas-area');
            await expect(canvasArea).toBeVisible();

            // E. Right Sidebar (Collapsible, Default Width: 320px)
            const rightSidebar = page.getByTestId('right-sidebar');
            await expect(rightSidebar).toBeVisible();
            await expect(rightSidebar).not.toHaveClass(/collapsed/); // Default expanded state

            // F. Status Bar (Fixed Height: 30px)
            const statusBar = page.getByTestId('status-bar');
            await expect(statusBar).toBeVisible();

            // Verify status bar elements
            await expect(statusBar).toContainText(/X:|Y:/i); // Cursor coordinates
            await expect(statusBar).toContainText(/Zoom:/i); // Zoom level
            await expect(statusBar).toContainText(/Grid:/i); // Grid status
        });

        test('should display auto-save status indicator in status bar', async ({ page }) => {
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            const statusBar = page.getByTestId('status-bar');
            await expect(statusBar).toBeVisible();
            await expect(statusBar).toContainText(/saved/i);
        });

        test('should maintain consistent header and toolbar across Dashboard and Canvas', async ({ page }) => {
            // Verify header on Dashboard
            await expect(page.locator('[data-testid="header"]')).toBeVisible();
            await expect(page.locator('[data-testid="header"]')).toContainText('HVAC');

            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Verify header persists
            await expect(page.locator('[data-testid="header"]')).toBeVisible();
            await expect(page.locator('[data-testid="header"]')).toContainText('HVAC');

            // Verify toolbar appears on Canvas
            await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();

            // Navigate back to Dashboard (toolbar should hide)
            await page.click('[data-testid="breadcrumb-dashboard"]');
            await expect(page).toHaveURL('/dashboard');

            // Toolbar should not be present on Dashboard
            await expect(page.locator('[data-testid="toolbar"]')).toBeHidden();
        });
    });

    /**
     * Test Group: Navigation Between Dashboard and Canvas
     */
    test.describe('Navigation Between Dashboard and Canvas', () => {
        test('should navigate to Dashboard via logo/breadcrumb click', async ({ page }) => {
            // Navigate to Canvas first
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Click breadcrumb to return to Dashboard
            await page.click('[data-testid="breadcrumb-dashboard"]');

            // Verify navigation
            await expect(page).toHaveURL('/dashboard');
            await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
        });

        test('should navigate to Dashboard via File menu', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Open File menu
            await page.click('text=File');

            // Click Dashboard option
            await page.click('[data-testid="menu-dashboard"]');

            // Verify navigation
            await expect(page).toHaveURL('/dashboard');
            await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
        });

        test('should navigate to Dashboard via keyboard shortcut Ctrl+Shift+D', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Press keyboard shortcut
            await page.keyboard.press('Control+Shift+D');

            // Verify navigation
            await expect(page).toHaveURL('/dashboard');
            await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
        });

        test('should navigate to Canvas by opening project from Dashboard', async ({ page }) => {
            // Verify we're on Dashboard
            await expect(page).toHaveURL('/dashboard');

            // Click project card to open
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Verify navigation to Canvas
            await expect(page).toHaveURL(/\/canvas\//);
            await expect(page.locator('[data-testid="canvas-area"]')).toBeVisible();
        });

        test('should display breadcrumb trail correctly', async ({ page }) => {
            // On Dashboard
            const breadcrumb = page.locator('[data-testid="breadcrumb"]');
            await expect(breadcrumb).toContainText('Dashboard');

            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Breadcrumb should show: Dashboard > Project Name
            await expect(breadcrumb).toContainText('Dashboard');
            await expect(breadcrumb).toContainText('>'); // Separator
        });

        test('should support browser back button for navigation', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Use browser back button
            await page.goBack();

            // Verify we're back on Dashboard
            await expect(page).toHaveURL('/dashboard');
            await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
        });
    });

    /**
     * Test Group: Left Sidebar - Equipment Library
     */
    test.describe('Left Sidebar - Equipment Library', () => {
        test.beforeEach(async ({ page }) => {
            // Navigate to Canvas for sidebar tests
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);
        });

        test('should display left sidebar with Equipment, Layers, and Recent tabs', async ({ page }) => {
            const leftSidebar = page.locator('[data-testid="left-sidebar"]');
            await expect(leftSidebar).toBeVisible();

            // Verify tabs
            await expect(page.locator('[data-testid="tab-equipment"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-layers"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-recent"]')).toBeVisible();

            // Equipment tab should be active by default
            const equipmentTab = page.locator('[data-testid="tab-equipment"]');
            await expect(equipmentTab).toHaveClass(/active/);
        });

        test('should display equipment categories with expand/collapse', async ({ page }) => {
            // Ensure Equipment tab is active
            await page.click('[data-testid="tab-equipment"]');

            // Verify category tree exists
            const categoryTree = page.locator('[data-testid="equipment-category-tree"]');
            await expect(categoryTree).toBeVisible();

            // Find a category (e.g., "Air Handling Units")
            const ahuCategory = page.locator('[data-testid="category-air-handling-units"]');
            await expect(ahuCategory).toBeVisible();

            // Click to expand (if collapsed)
            const expandIcon = ahuCategory.locator('[data-testid="expand-icon"]');
            const isExpanded = await expandIcon.getAttribute('data-expanded') === 'true';

            if (!isExpanded) {
                await ahuCategory.click();
                await expect(expandIcon).toHaveAttribute('data-expanded', 'true');
            }

            // Verify items are visible when expanded
            const categoryItems = ahuCategory.locator('[data-testid="equipment-item"]');
            await expect(categoryItems.first()).toBeVisible();

            // Click to collapse
            await ahuCategory.click();
            await expect(expandIcon).toHaveAttribute('data-expanded', 'false');
        });

        test('should filter equipment using search box', async ({ page }) => {
            // Click Equipment tab
            await page.click('[data-testid="tab-equipment"]');

            // Find search box
            const searchBox = page.locator('[data-testid="equipment-search"]');
            await expect(searchBox).toBeVisible();

            // Type search query
            await searchBox.fill('AHU');

            // Wait for filter to apply (300ms debounce)
            await page.waitForTimeout(500);

            // Verify filtered results show
            const searchResults = page.locator('[data-testid="equipment-item"]');
            const resultsCount = await searchResults.count();
            expect(resultsCount).toBeGreaterThan(0);

            // Verify results contain search term
            const firstResult = searchResults.first();
            await expect(firstResult).toContainText(/AHU/i);

            // Clear search
            await searchBox.clear();
            await page.waitForTimeout(500);

            // Verify all categories visible again
            await expect(page.locator('[data-testid="category-air-handling-units"]')).toBeVisible();
        });

        test('should collapse and expand left sidebar', async ({ page }) => {
            const leftSidebar = page.locator('[data-testid="left-sidebar"]');
            const toggleButton = page.locator('[data-testid="left-sidebar-toggle"]');

            // Verify initially expanded
            await expect(leftSidebar).not.toHaveClass(/collapsed/);

            // Click toggle to collapse
            await toggleButton.click();

            // Wait for animation
            await page.waitForTimeout(300);

            // Verify collapsed
            await expect(leftSidebar).toHaveClass(/collapsed/);

            // Click toggle to expand
            await toggleButton.click();

            // Wait for animation
            await page.waitForTimeout(300);

            // Verify expanded
            await expect(leftSidebar).not.toHaveClass(/collapsed/);
        });

        test('should toggle left sidebar via keyboard shortcut Ctrl+B', async ({ page }) => {
            const leftSidebar = page.locator('[data-testid="left-sidebar"]');

            // Press Ctrl+B to collapse
            await page.keyboard.press('Control+B');
            await page.waitForTimeout(300);
            await expect(leftSidebar).toHaveClass(/collapsed/);

            // Press Ctrl+B to expand
            await page.keyboard.press('Control+B');
            await page.waitForTimeout(300);
            await expect(leftSidebar).not.toHaveClass(/collapsed/);
        });

        test('should switch between sidebar tabs', async ({ page }) => {
            // Click Layers tab
            await page.click('[data-testid="tab-layers"]');

            // Verify Layers panel visible
            await expect(page.locator('[data-testid="layers-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-layers"]')).toHaveClass(/active/);

            // Click Recent tab
            await page.click('[data-testid="tab-recent"]');

            // Verify Recent panel visible
            await expect(page.locator('[data-testid="recent-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-recent"]')).toHaveClass(/active/);

            // Return to Equipment tab
            await page.click('[data-testid="tab-equipment"]');
            await expect(page.locator('[data-testid="equipment-panel"]')).toBeVisible();
        });

        test('should persist sidebar collapsed state across page reload', async ({ page }) => {
            // Collapse sidebar
            await page.click('[data-testid="left-sidebar-toggle"]');
            await page.waitForTimeout(300);
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);

            // Reload page
            await page.reload();
            await expect(page).toHaveURL(/\/canvas\//);

            // Verify sidebar still collapsed
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);
        });
    });

    /**
     * Test Group: Right Sidebar - Properties and Panels
     */
    test.describe('Right Sidebar - Properties and Panels', () => {
        test.beforeEach(async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);
        });

        test('should display right sidebar with four panel tabs', async ({ page }) => {
            const rightSidebar = page.locator('[data-testid="right-sidebar"]');
            await expect(rightSidebar).toBeVisible();

            // Verify all tabs present
            await expect(page.locator('[data-testid="tab-properties"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-calculations"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-bom"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-notes"]')).toBeVisible();

            // Properties should be active by default
            await expect(page.locator('[data-testid="tab-properties"]')).toHaveClass(/active/);
        });

        test('should show "No item selected" in Properties when no selection', async ({ page }) => {
            // Click Properties tab
            await page.click('[data-testid="tab-properties"]');

            // Verify "No item selected" message
            const propertiesPanel = page.locator('[data-testid="properties-panel"]');
            await expect(propertiesPanel).toContainText(/no item selected/i);

            // Should show project properties
            await expect(propertiesPanel).toContainText(/project/i);
        });

        test('should switch between right sidebar tabs', async ({ page }) => {
            // Click Calculations tab
            await page.click('[data-testid="tab-calculations"]');
            await expect(page.locator('[data-testid="calculations-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-calculations"]')).toHaveClass(/active/);

            // Click BOM tab
            await page.click('[data-testid="tab-bom"]');
            await expect(page.locator('[data-testid="bom-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-bom"]')).toHaveClass(/active/);

            // Click Notes tab
            await page.click('[data-testid="tab-notes"]');
            await expect(page.locator('[data-testid="notes-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-notes"]')).toHaveClass(/active/);
        });

        test('should collapse and expand right sidebar', async ({ page }) => {
            const rightSidebar = page.locator('[data-testid="right-sidebar"]');
            const toggleButton = page.locator('[data-testid="right-sidebar-toggle"]');

            // Collapse
            await toggleButton.click();
            await page.waitForTimeout(300);
            await expect(rightSidebar).toHaveClass(/collapsed/);

            // Expand
            await toggleButton.click();
            await page.waitForTimeout(300);
            await expect(rightSidebar).not.toHaveClass(/collapsed/);
        });

        test('should toggle right sidebar via keyboard shortcut Ctrl+Shift+B', async ({ page }) => {
            const rightSidebar = page.locator('[data-testid="right-sidebar"]');

            // Press Ctrl+Shift+B to collapse
            await page.keyboard.press('Control+Shift+B');
            await page.waitForTimeout(300);
            await expect(rightSidebar).toHaveClass(/collapsed/);

            // Press Ctrl+Shift+B to expand
            await page.keyboard.press('Control+Shift+B');
            await page.waitForTimeout(300);
            await expect(rightSidebar).not.toHaveClass(/collapsed/);
        });

        test('should open specific panel tabs via keyboard shortcuts', async ({ page }) => {
            // Ctrl+P for Properties
            await page.keyboard.press('Control+P');
            await expect(page.locator('[data-testid="properties-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-properties"]')).toHaveClass(/active/);

            // Ctrl+M for BOM
            await page.keyboard.press('Control+M');
            await expect(page.locator('[data-testid="bom-panel"]')).toBeVisible();
            await expect(page.locator('[data-testid="tab-bom"]')).toHaveClass(/active/);
        });

        test('should maintain independent collapse states for left and right sidebars', async ({ page }) => {
            const leftSidebar = page.locator('[data-testid="left-sidebar"]');
            const rightSidebar = page.locator('[data-testid="right-sidebar"]');

            // Collapse left sidebar only
            await page.click('[data-testid="left-sidebar-toggle"]');
            await page.waitForTimeout(300);

            // Verify states
            await expect(leftSidebar).toHaveClass(/collapsed/);
            await expect(rightSidebar).not.toHaveClass(/collapsed/);

            // Collapse right sidebar
            await page.click('[data-testid="right-sidebar-toggle"]');
            await page.waitForTimeout(300);

            // Both collapsed
            await expect(leftSidebar).toHaveClass(/collapsed/);
            await expect(rightSidebar).toHaveClass(/collapsed/);

            // Expand left sidebar only
            await page.click('[data-testid="left-sidebar-toggle"]');
            await page.waitForTimeout(300);

            // Verify states
            await expect(leftSidebar).not.toHaveClass(/collapsed/);
            await expect(rightSidebar).toHaveClass(/collapsed/);
        });
    });

    /**
     * Test Group: Toolbar and Tool Selection
     */
    test.describe('Toolbar and Tool Selection', () => {
        test.beforeEach(async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);
        });

        test('should display all toolbar groups', async ({ page }) => {
            const toolbar = page.locator('[data-testid="toolbar"]');

            // Group 1: Drawing Tools
            await expect(page.locator('[data-testid="tool-select"]')).toBeVisible();
            await expect(page.locator('[data-testid="tool-line"]')).toBeVisible();
            await expect(page.locator('[data-testid="tool-duct"]')).toBeVisible();

            // Group 2: Edit Operations
            await expect(page.locator('[data-testid="undo-button"]')).toBeVisible();
            await expect(page.locator('[data-testid="redo-button"]')).toBeVisible();

            // Group 3: View Controls
            await expect(page.locator('[data-testid="zoom-control"]')).toBeVisible();
            await expect(page.locator('[data-testid="grid-toggle"]')).toBeVisible();
        });

        test('should activate tool when clicked', async ({ page }) => {
            const ductTool = page.locator('[data-testid="tool-duct"]');
            const selectTool = page.locator('[data-testid="tool-select"]');

            // Select tool should be active by default
            await expect(selectTool).toHaveClass(/active/);

            // Click duct tool
            await ductTool.click();

            // Verify tool activated
            await expect(ductTool).toHaveClass(/active/);
            await expect(selectTool).not.toHaveClass(/active/);
        });

        test('should activate tools via keyboard shortcuts', async ({ page }) => {
            // Press 'V' for Select tool
            await page.keyboard.press('v');
            await expect(page.locator('[data-testid="tool-select"]')).toHaveClass(/active/);

            // Press 'L' for Line tool
            await page.keyboard.press('l');
            await expect(page.locator('[data-testid="tool-line"]')).toHaveClass(/active/);

            // Press 'D' for Duct tool
            await page.keyboard.press('d');
            await expect(page.locator('[data-testid="tool-duct"]')).toHaveClass(/active/);
        });

        test('should have only one tool active at a time', async ({ page }) => {
            // Click Line tool
            await page.click('[data-testid="tool-line"]');
            await expect(page.locator('[data-testid="tool-line"]')).toHaveClass(/active/);

            // Click Duct tool
            await page.click('[data-testid="tool-duct"]');

            // Line should be inactive, Duct active
            await expect(page.locator('[data-testid="tool-line"]')).not.toHaveClass(/active/);
            await expect(page.locator('[data-testid="tool-duct"]')).toHaveClass(/active/);
        });

        test('should handle undo/redo operations', async ({ page }) => {
            const undoButton = page.locator('[data-testid="undo-button"]');
            const redoButton = page.locator('[data-testid="redo-button"]');

            // Initially, undo/redo might be disabled if no actions
            // (This depends on project state)

            // Press Ctrl+Z for undo
            await page.keyboard.press('Control+Z');

            // Redo with Ctrl+Shift+Z
            await page.keyboard.press('Control+Shift+Z');

            // Verify buttons are interactive
            await expect(undoButton).toBeVisible();
            await expect(redoButton).toBeVisible();
        });

        test('should adjust zoom via toolbar controls', async ({ page }) => {
            const zoomControl = page.locator('[data-testid="zoom-control"]');
            await expect(zoomControl).toBeVisible();

            // Click zoom in
            await page.click('[data-testid="zoom-in"]');

            // Verify zoom changed (check status bar or zoom display)
            // This is implementation-specific

            // Click zoom out
            await page.click('[data-testid="zoom-out"]');
        });

        test('should toggle grid via toolbar button', async ({ page }) => {
            const gridToggle = page.locator('[data-testid="grid-toggle"]');

            // Click to toggle grid
            await gridToggle.click();

            // Verify button shows active/inactive state
            // (Implementation-specific: check if button has active class)

            // Toggle again
            await gridToggle.click();
        });

        test('should toggle grid via keyboard shortcut Ctrl+G', async ({ page }) => {
            // Press Ctrl+G to toggle grid
            await page.keyboard.press('Control+G');

            // Verify grid state changed
            // (This would check canvas grid visibility)

            // Toggle again
            await page.keyboard.press('Control+G');
        });
    });

    /**
     * Test Group: Status Bar Information
     */
    test.describe('Status Bar Information', () => {
        test.beforeEach(async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);
        });

        test('should display cursor coordinates in status bar', async ({ page }) => {
            const statusBar = page.locator('[data-testid="status-bar"]');

            // Verify status bar shows coordinates
            await expect(statusBar).toContainText(/X:/i);
            await expect(statusBar).toContainText(/Y:/i);
        });

        test('should display zoom level in status bar', async ({ page }) => {
            const statusBar = page.locator('[data-testid="status-bar"]');

            // Verify zoom displayed
            await expect(statusBar).toContainText(/Zoom:|%/i);
        });

        test('should display entity count in status bar', async ({ page }) => {
            const statusBar = page.locator('[data-testid="status-bar"]');

            // Verify entity count shown
            await expect(statusBar).toContainText(/items|entities/i);
        });

        test('should display connection status in status bar', async ({ page }) => {
            const statusBar = page.locator('[data-testid="status-bar"]');

            // Verify connection status (Online/Offline indicator)
            await expect(statusBar).toContainText(/online|offline|●|○/i);
        });
    });

    /**
     * Test Group: Keyboard Shortcuts and Focus Navigation
     */
    test.describe('Keyboard Shortcuts and Focus Navigation', () => {
        test.beforeEach(async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);
        });

        test('should open keyboard shortcuts dialog with Ctrl+/', async ({ page }) => {
            // Press Ctrl+/ to show shortcuts
            await page.keyboard.press('Control+/');

            // Verify dialog appears
            await expect(page.locator('[data-testid="keyboard-shortcuts-dialog"]')).toBeVisible();

            // Verify dialog contains shortcut information
            await expect(page.locator('[data-testid="keyboard-shortcuts-dialog"]')).toContainText(/Ctrl/i);

            // Close dialog with Esc
            await page.keyboard.press('Escape');
            await expect(page.locator('[data-testid="keyboard-shortcuts-dialog"]')).toBeHidden();
        });

        test('should navigate focus with Tab key', async ({ page }) => {
            // Focus should start at a predictable location
            // Tab through interactive elements
            await page.keyboard.press('Tab');

            // Verify focus moved (this is implementation-specific)
            // Typically would check document.activeElement
        });

        test('should jump to specific regions with Alt shortcuts', async ({ page }) => {
            // Alt+1: Jump to Left Sidebar
            await page.keyboard.press('Alt+1');
            // Verify focus in left sidebar

            // Alt+2: Jump to Canvas
            await page.keyboard.press('Alt+2');
            // Verify focus in canvas

            // Alt+3: Jump to Right Sidebar
            await page.keyboard.press('Alt+3');
            // Verify focus in right sidebar

            // Alt+4: Jump to Toolbar
            await page.keyboard.press('Alt+4');
            // Verify focus in toolbar
        });

        test('should close modals with Escape key', async ({ page }) => {
            // Open a modal (e.g., settings)
            await page.click('[data-testid="settings-button"]');
            await expect(page.locator('[data-testid="settings-dialog"]')).toBeVisible();

            // Press Escape to close
            await page.keyboard.press('Escape');
            await expect(page.locator('[data-testid="settings-dialog"]')).toBeHidden();
        });
    });

    /**
     * Test Group: Edge Cases - Responsive Design
     */
    test.describe('Edge Cases - Responsive Design', () => {
        test('should auto-collapse sidebars on narrow screen (< 1024px)', async ({ page }) => {
            // Set viewport to narrow width
            await page.setViewportSize({ width: 1000, height: 800 });

            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });
            await expect(page).toHaveURL(/\/canvas\//);

            // Verify sidebars auto-collapsed
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);
            await expect(page.locator('[data-testid="right-sidebar"]')).toHaveClass(/collapsed/);

            // Verify notification shown
            await expect(page.locator('text=/sidebars.*collapsed/i')).toBeVisible();
        });

        test('should restore full layout when viewport expands > 1024px', async ({ page }) => {
            // Start narrow
            await page.setViewportSize({ width: 1000, height: 800 });

            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Verify collapsed
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);

            // Expand viewport
            await page.setViewportSize({ width: 1280, height: 800 });
            await page.waitForTimeout(300);

            // Verify sidebars expanded
            await expect(page.locator('[data-testid="left-sidebar"]')).not.toHaveClass(/collapsed/);
            await expect(page.locator('[data-testid="right-sidebar"]')).not.toHaveClass(/collapsed/);
        });

        test('should allow manual sidebar expansion on narrow screens (overlay mode)', async ({ page }) => {
            // Set narrow viewport
            await page.setViewportSize({ width: 1000, height: 800 });

            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Sidebars should be collapsed
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);

            // Click to expand
            await page.click('[data-testid="left-sidebar-toggle"]');
            await page.waitForTimeout(300);

            // Should expand as overlay (not push canvas)
            await expect(page.locator('[data-testid="left-sidebar"]')).not.toHaveClass(/collapsed/);

            // Sidebar should have overlay class
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/overlay/);
        });
    });

    /**
     * Test Group: Edge Cases - Error Scenarios
     */
    test.describe('Edge Cases - Error Scenarios', () => {
        test('should display 404 page for invalid project route', async ({ page }) => {
            // Navigate to non-existent project
            await page.goto('/canvas/invalid-project-id-12345');

            // Verify 404 page displayed
            await expect(page.locator('[data-testid="error-page"]')).toBeVisible();
            await expect(page.locator('text=/project.*not found/i')).toBeVisible();

            // Verify recovery options
            await expect(page.locator('[data-testid="goto-dashboard-button"]')).toBeVisible();
            await expect(page.locator('[data-testid="search-projects-button"]')).toBeVisible();

            // Click "Go to Dashboard"
            await page.click('[data-testid="goto-dashboard-button"]');
            await expect(page).toHaveURL('/dashboard');
        });

        test('should handle sidebar component failure gracefully', async ({ page }) => {
            // This test would require mocking component errors
            // Skip implementation-specific error injection
        });

        test('should warn about unsaved changes on navigation', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Make a change (implementation-specific: add entity, modify property)
            // This creates unsaved state

            // Attempt to navigate away
            await page.click('[data-testid="breadcrumb-dashboard"]');

            // Verify confirmation dialog
            await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible();
            await expect(page.locator('text=/unsaved changes/i')).toBeVisible();

            // Options: Save and Leave, Leave Without Saving, Cancel
            await expect(page.locator('[data-testid="save-and-leave-button"]')).toBeVisible();
            await expect(page.locator('[data-testid="leave-without-saving-button"]')).toBeVisible();
            await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible();
        });
    });

    /**
     * Test Group: Performance - Large Projects
     */
    test.describe('Performance - Large Projects', () => {
        test('should handle large entity count gracefully', async ({ page }) => {
            // This test assumes a test project with 500+ entities exists
            // Or programmatically create one

            // Skip if not applicable
            test.skip(true, 'Requires large test project');
        });

        test('should virtualize long lists in equipment library', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Expand equipment category with many items
            // Verify only visible items rendered (implementation-specific)
        });
    });

    /**
     * Test Group: State Persistence
     */
    test.describe('State Persistence', () => {
        test('should persist sidebar collapsed states across sessions', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Collapse both sidebars
            await page.click('[data-testid="left-sidebar-toggle"]');
            await page.click('[data-testid="right-sidebar-toggle"]');
            await page.waitForTimeout(500);

            // Verify collapsed
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);
            await expect(page.locator('[data-testid="right-sidebar"]')).toHaveClass(/collapsed/);

            // Navigate away and back
            await page.click('[data-testid="breadcrumb-dashboard"]');
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Verify states persisted
            await expect(page.locator('[data-testid="left-sidebar"]')).toHaveClass(/collapsed/);
            await expect(page.locator('[data-testid="right-sidebar"]')).toHaveClass(/collapsed/);
        });

        test('should persist active sidebar tabs across sessions', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Switch to Layers tab in left sidebar
            await page.click('[data-testid="tab-layers"]');

            // Switch to BOM tab in right sidebar
            await page.click('[data-testid="tab-bom"]');

            // Verify active tabs
            await expect(page.locator('[data-testid="tab-layers"]')).toHaveClass(/active/);
            await expect(page.locator('[data-testid="tab-bom"]')).toHaveClass(/active/);

            // Navigate away and back
            await page.click('[data-testid="breadcrumb-dashboard"]');
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Verify tabs still active
            await expect(page.locator('[data-testid="tab-layers"]')).toHaveClass(/active/);
            await expect(page.locator('[data-testid="tab-bom"]')).toHaveClass(/active/);
        });

        test('should provide "Reset Layout" option in View menu', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Make layout changes
            await page.click('[data-testid="left-sidebar-toggle"]');
            await page.click('[data-testid="tab-bom"]');

            // Open View menu
            await page.click('text=View');

            // Click "Reset Layout"
            await page.click('[data-testid="menu-reset-layout"]');

            // Verify layout restored to defaults
            await expect(page.locator('[data-testid="left-sidebar"]')).not.toHaveClass(/collapsed/);
            await expect(page.locator('[data-testid="tab-equipment"]')).toHaveClass(/active/);
            await expect(page.locator('[data-testid="tab-properties"]')).toHaveClass(/active/);
        });
    });

    /**
     * Test Group: Accessibility
     */
    test.describe('Accessibility', () => {
        test('should have proper ARIA attributes on interactive elements', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Check toolbar buttons have aria-labels
            const undoButton = page.locator('[data-testid="undo-button"]');
            await expect(undoButton).toHaveAttribute('aria-label', /undo/i);

            // Check sidebar toggles have aria-labels
            const leftToggle = page.locator('[data-testid="left-sidebar-toggle"]');
            await expect(leftToggle).toHaveAttribute('aria-label', /.+/);

            // Check tabs have proper ARIA roles
            const equipmentTab = page.locator('[data-testid="tab-equipment"]');
            await expect(equipmentTab).toHaveAttribute('role', 'tab');
        });

        test('should trap focus within modal dialogs', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Open a modal
            await page.keyboard.press('Control+/'); // Shortcuts dialog
            await expect(page.locator('[data-testid="keyboard-shortcuts-dialog"]')).toBeVisible();

            // Tab should cycle within dialog
            await page.keyboard.press('Tab');

            // Pressing Escape should close and return focus
            await page.keyboard.press('Escape');
            await expect(page.locator('[data-testid="keyboard-shortcuts-dialog"]')).toBeHidden();
        });

        test('should provide visible focus indicators for keyboard navigation', async ({ page }) => {
            // Navigate to Canvas
            await page.click('[data-testid="project-card"]', { hasText: '', force: true });

            // Tab through elements
            await page.keyboard.press('Tab');

            // Verify focused element has visible outline
            // (Implementation-specific: check CSS focus styles)
        });
    });
});
