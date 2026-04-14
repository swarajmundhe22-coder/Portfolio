import { expect, test } from '@playwright/test';

test.describe('Portfolio replica smoke checks', () => {
  test('core route pages and article page render', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1.hero-title')).toBeVisible();
    await expect(page.locator('#home')).toBeVisible();
    await expect(page.locator('.profile-surface')).toBeVisible();
    await expect(page.locator('.focus-surface')).toBeVisible();
    await expect(page.locator('.contact-surface')).toBeVisible();

    await page.getByRole('button', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator('#about')).toBeVisible();

    await page.getByRole('button', { name: 'Work' }).click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator('#work')).toBeVisible();
    await expect(page.locator('.work-card').first()).toBeVisible();

    await page.getByRole('button', { name: 'Blogs' }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.locator('.blogs-section')).toBeVisible();
    await expect(page.locator('.blog-card').first()).toBeVisible();
    await expect(page.locator('.blog-card-link').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('.blog-card-link').first().click();
    await expect(page).toHaveURL(/\/blogs\/.+/);
    await expect(page.locator('.blog-article-page')).toBeVisible();
    await expect(page.locator('.blog-article-shell h1')).toBeVisible();
  });

  test('navigation controls route transitions and more menu interaction', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await expect(page.locator('.more-menu.is-open')).toBeVisible();

    await page.getByRole('button', { name: 'Labs' }).click();
    await expect(page).toHaveURL(/\/labs$/);
    await expect(page.locator('.labs-route-page')).toBeVisible();

    await page.locator('a.lab-route-link[href="/labs/magnetic-blobs"]').first().click();
    await expect(page).toHaveURL(/\/labs\/magnetic-blobs$/);
    await expect(page.locator('.magnetic-route-page')).toBeVisible();
    await expect(page.locator('.lab-shell').first()).toBeVisible();

    await page.getByRole('link', { name: /Back to Labs/i }).click();
    await expect(page).toHaveURL(/\/labs$/);

    await page.locator('a.lab-route-link[href="/labs/animated-list"]').first().click();
    await expect(page).toHaveURL(/\/labs\/animated-list$/);
    await expect(page.locator('.animated-list-surface')).toBeVisible();

    await page.getByRole('link', { name: /Back to Labs/i }).click();
    await expect(page).toHaveURL(/\/labs$/);

    await page.locator('a.lab-route-link[href="/labs/galaxy-field"]').first().click();
    await expect(page).toHaveURL(/\/labs\/galaxy-field$/);
    await expect(page.locator('.lab-shell').first()).toBeVisible();

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('button', { name: 'Uses' }).click();
    await expect(page).toHaveURL(/\/uses$/);
    await expect(page.locator('.uses-route-page')).toBeVisible();

    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('button', { name: 'Guestbook' }).click();
    await expect(page).toHaveURL(/\/guestbook$/);
    await expect(page.locator('.guestbook-route-page')).toBeVisible();

    await page.getByRole('button', { name: 'Book a Call' }).first().click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.locator('#contact')).toBeVisible();

    await page.getByRole('button', { name: /Start a Project/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
