import { Page } from '@playwright/test';

/**
 * Mock auth helper for testing without real Google OAuth
 * Directly sets auth state in localStorage (simulates Tauri store)
 */
export async function mockGoogleAuth(page: Page) {
  const mockUser = {
    sub: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/40',
    email_verified: true,
  };

  const mockRefreshToken = 'mock-refresh-token-for-testing';

  // Set auth data in localStorage (simulates Tauri store for browser testing)
  await page.evaluate(
    ({ user, token }) => {
      // Simulate Tauri store structure
      localStorage.setItem('tauri://localhost/auth.dat', JSON.stringify({
        refresh_token: token,
        user_profile: user,
        token_expiry: Date.now() + 3600000, // 1 hour from now
      }));
    },
    { user: mockUser, token: mockRefreshToken }
  );

  // Navigate to dashboard (will trigger auth check)
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Login with Google (for full integration tests)
 * Note: This requires real OAuth flow in real browser
 */
export async function loginWithGoogle(page: Page) {
  // Navigate to login page
  await page.goto('/');

  // Wait for login button
  await page.waitForSelector('button:has-text("Sign in with Google")');

  // For full integration tests, you would need to:
  // 1. Click the button
  // 2. Handle the OAuth popup/redirect
  // 3. Enter credentials
  // 4. Wait for redirect back to app

  // For now, we'll use mock auth
  await mockGoogleAuth(page);
}

/**
 * Logout user
 */
export async function logout(page: Page) {
  // Click logout button in dashboard
  await page.click('button:has-text("Logout")');

  // Wait for redirect to login page
  await page.waitForURL('/');
}

/**
 * Check if user is authenticated (helper for assertions)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const authData = await page.evaluate(() => {
    const data = localStorage.getItem('tauri://localhost/auth.dat');
    return data ? JSON.parse(data) : null;
  });

  return authData && authData.refresh_token;
}

/**
 * Clear all auth state (useful for test cleanup)
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('tauri://localhost/auth.dat');
  });
}
