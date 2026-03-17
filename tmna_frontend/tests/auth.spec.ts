import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('user can register successfully', async ({ page }) => {
    await page.click('text=Register');
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const uniqueUsername = `user_${Date.now()}`;

    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[placeholder="Username"]', uniqueUsername);
    await page.fill('input[placeholder="First Name"]', 'Test');
    await page.fill('input[placeholder="Last Name"]', 'User');
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/login/);
  });

  test('user can login with valid credentials', async ({ page }) => {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123';

    await page.fill('[data-testid="login-email"]', testEmail);
    await page.fill('[data-testid="login-password"]', testPassword);
    await page.click('[data-testid="login-submit"]');

    await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible({ timeout: 5000 });
  });

  test('user cannot login with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="login-email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="login-password"]', 'WrongPassword123');
    await page.click('[data-testid="login-submit"]');

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
  });

  test('user can logout successfully', async ({ page }) => {
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123');
    await page.click('[data-testid="login-submit"]');
    await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible({ timeout: 5000 });

    await page.click('[data-testid="logout-btn"]');
    await expect(page).toHaveURL(/login/);
  });
});
