import { expect, test } from '@playwright/test';

test.describe('Portfolio replica smoke checks', () => {
  test('core sections and cards render', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1.hero-title')).toBeVisible();
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('#about')).toBeVisible();
    await expect(page.locator('#work')).toBeVisible();
    await expect(page.locator('#blogs')).toBeVisible();
    await expect(page.locator('#more')).toBeVisible();
    await expect(page.locator('#contact')).toBeVisible();

    await expect(page.locator('.work-card')).toHaveCount(4);
    await expect(page.locator('.blog-card')).toHaveCount(6);
    await expect(page.locator('.voice-card')).toHaveCount(3);
  });

  test('navigation controls scroll and menu interaction', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'About' }).click();
    await expect(page.locator('#about')).toBeInViewport();

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await expect(page.locator('.more-menu.is-open')).toBeVisible();

    await page.getByRole('button', { name: 'Book a Call' }).first().click();
    await expect(page.locator('#contact')).toBeInViewport();
  });
});
