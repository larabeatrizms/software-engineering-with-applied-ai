import { test, expect } from '@playwright/test';

test.describe('image gallery form', () => {
  test('submits the form and adds an image to the list', async ({ page }) => {
    await page.goto('./');

    const title = `E2E Image ${Date.now()}`;
    const imageUrl = 'https://example.com/e2e-image.png';

    const articles = page.getByRole('article');
    const initialCount = await articles.count();

    await page.getByRole('textbox', { name: 'Image Title' }).fill(title);
    await page.getByRole('textbox', { name: 'Image URL' }).fill(imageUrl);
    await page.getByRole('button', { name: 'Submit Form' }).click();

    await expect(articles).toHaveCount(initialCount + 1);
    await expect(page.getByRole('heading', { name: title, level: 4 })).toBeVisible();
    await expect(page.getByRole('img', { name: `Image of an ${title}` })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Image Title' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Image URL' })).toHaveValue('');
  });

  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await page.goto('./');

    const articles = page.getByRole('article');
    const initialCount = await articles.count();

    await page.getByRole('button', { name: 'Submit Form' }).click();

    await expect(page.getByText('Please type a title for the image.')).toBeVisible();
    await expect(page.getByText('Please type a valid URL')).toBeVisible();
    await expect(articles).toHaveCount(initialCount);
  });

  test('shows URL validation when title is filled but URL is missing', async ({ page }) => {
    await page.goto('./');

    const articles = page.getByRole('article');
    const initialCount = await articles.count();

    await page.getByRole('textbox', { name: 'Image Title' }).fill('Title without URL');
    await page.getByRole('button', { name: 'Submit Form' }).click();

    await expect(page.getByText('Please type a valid URL')).toBeVisible();
    await expect(page.getByText('Please type a title for the image.')).toBeHidden();
    await expect(articles).toHaveCount(initialCount);
  });
});
