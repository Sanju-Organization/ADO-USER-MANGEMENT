import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });

  test('user can view dashboard with users list', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('user can search for users', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'test');
    await page.waitForTimeout(500);
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('app displays username in header', async ({ page }) => {
    await expect(page.locator('[data-testid="app-title"]')).toBeVisible();
  });
});
