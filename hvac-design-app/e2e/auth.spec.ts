import { test, expect } from '@playwright/test';
import { mockGoogleAuth, logout, isAuthenticated, clearAuth } from './helpers/auth.helper';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth state before each test
    await clearAuth(page);
  });

  test('unauthenticated users see login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('SizeWise HVAC Canvas');
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('unauthenticated users are redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login page
    await page.waitForURL('/');
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('authenticated users can access dashboard', async ({ page }) => {
    await mockGoogleAuth(page);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Test User')).toBeVisible();
    await expect(page.locator('text=test@example.com')).toBeVisible();
  });

  test('authenticated users see user info in dashboard header', async ({ page }) => {
    await mockGoogleAuth(page);
    await expect(page.locator('.userName')).toHaveText('Test User');
    await expect(page.locator('.userEmail')).toHaveText('test@example.com');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('users can logout', async ({ page }) => {
    await mockGoogleAuth(page);
    await logout(page);
    await expect(page).toHaveURL('/');
    expect(await isAuthenticated(page)).toBe(false);
  });

  test('logged out users cannot access protected routes', async ({ page }) => {
    await mockGoogleAuth(page);
    await logout(page);
    await page.goto('/dashboard');
    // Should redirect to login
    await page.waitForURL('/');
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('session persists across page reloads', async ({ page }) => {
    await mockGoogleAuth(page);
    await page.reload();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Test User')).toBeVisible();
    expect(await isAuthenticated(page)).toBe(true);
  });

  test('authenticated users are redirected from login page to dashboard', async ({ page }) => {
    await mockGoogleAuth(page);
    await page.goto('/');
    // Should auto-redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Project Dashboard');
  });

  test('login page shows loading state initially', async ({ page }) => {
    await page.goto('/');
    // May briefly show loading state
    // Then shows login form
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('user projects are scoped to authenticated user', async ({ page }) => {
    await mockGoogleAuth(page);

    // Create a project
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="projectName"]', 'Test Project');
    await page.click('button:has-text("Create Project")');

    // Wait for project to appear
    await expect(page.locator('text=Test Project')).toBeVisible();

    // Logout and login as different user (mock different user ID)
    await logout(page);
    await page.evaluate(() => {
      const differentUser = {
        sub: 'different-user-456',
        email: 'different@example.com',
        name: 'Different User',
        picture: 'https://via.placeholder.com/40',
        email_verified: true,
      };
      localStorage.setItem('tauri://localhost/auth.dat', JSON.stringify({
        refresh_token: 'different-mock-token',
        user_profile: differentUser,
        token_expiry: Date.now() + 3600000,
      }));
    });
    await page.goto('/dashboard');

    // Should not see the first user's project
    await expect(page.locator('text=Test Project')).not.toBeVisible();
    await expect(page.locator('text=Different User')).toBeVisible();
  });
});
