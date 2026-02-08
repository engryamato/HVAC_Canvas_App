import { Page } from '@playwright/test';

export type Theme = 'light' | 'dark';

/**
 * Sets the application theme to light mode
 */
export async function setLightMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  });
}

/**
 * Sets the application theme to dark mode
 */
export async function setDarkMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  });
}

/**
 * Helper to run visual tests in both light and dark modes
 */
export async function withThemeVariants(
  page: Page,
  testFn: (theme: Theme) => Promise<void>
): Promise<void> {
  // Test Light Mode
  await setLightMode(page);
  await testFn('light');

  // Test Dark Mode
  await setDarkMode(page);
  await testFn('dark');
}

/**
 * Verifies the current theme application
 */
export async function verifyTheme(page: Page, expectedTheme: Theme): Promise<boolean> {
  return await page.evaluate((theme) => {
    return document.documentElement.classList.contains(theme);
  }, expectedTheme);
}

/**
 * Gets the current active theme
 */
export async function getCurrentTheme(page: Page): Promise<Theme> {
  return await page.evaluate(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
}
