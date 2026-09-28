import { test, expect } from '@playwright/test';

test('loads the image gallery app', async ({ page }) => {
  await page.goto('./');

  await expect(page).toHaveTitle('TDD Frontend Example');
  await expect(page.getByPlaceholder('Image Title')).toBeVisible();
  await expect(page.getByPlaceholder('https://img.com/erick.png')).toBeVisible();
  await expect(page.locator('#card-list')).toBeVisible();
});
