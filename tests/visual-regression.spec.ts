import { expect, Page, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

const viewports = [
  { label: '320', width: 320, height: 2200 },
  { label: '375', width: 375, height: 2200 },
  { label: '768', width: 768, height: 2200 },
  { label: '1024', width: 1024, height: 2200 },
  { label: '1440', width: 1440, height: 2200 },
];

const snapshotOptions = {
  animations: 'disabled' as const,
  timeout: 15_000,
  maxDiffPixelRatio: 0.001,
  maxDiffPixels: 1,
};

async function gotoVisualState(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'load' });
  await page.evaluate(async () => {
    if (!('fonts' in document)) {
      return;
    }

    const fontSet = document.fonts;
    if (fontSet.status === 'loaded') {
      return;
    }

    await Promise.race([
      fontSet.ready,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 3000);
      }),
    ]);
  });
  await page.waitForTimeout(120);
  await page.evaluate(() => window.scrollTo(0, 0));
}

for (const viewport of viewports) {
  test(`visual baseline capture @${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await gotoVisualState(page, '/?vr=1');
    await expect(page).toHaveScreenshot(`full-page-${viewport.label}.png`, {
      ...snapshotOptions,
      fullPage: true,
    });
    await expect(page.locator('.hero-section')).toHaveScreenshot(`hero-${viewport.label}.png`, snapshotOptions);
    await expect(page.locator('.profile-surface')).toHaveScreenshot(`profile-${viewport.label}.png`, snapshotOptions);
    await expect(page.locator('.floating-header')).toHaveScreenshot(`nav-collapsed-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/work?vr=1');
    await expect(page.locator('.work-grid')).toHaveScreenshot(`project-grid-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/labs/magnetic-blobs?vr=1');
    await expect(page.locator('.lab-shell').first()).toHaveScreenshot(`lab-magnetic-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/labs/animated-list?vr=1');
    await expect(page.locator('.lab-shell').first()).toHaveScreenshot(`lab-animated-list-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/labs/galaxy-field?vr=1');
    await expect(page.locator('.lab-shell').first()).toHaveScreenshot(`lab-galaxy-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/?vr=1&state=nav-expanded');
    await expect(page.locator('.floating-header')).toHaveScreenshot(`nav-expanded-${viewport.label}.png`, snapshotOptions);

    if (viewport.width <= 900) {
      await gotoVisualState(page, '/?vr=1&state=nav-mobile');
      await expect(page.locator('.floating-header')).toHaveScreenshot(`nav-mobile-hamburger-${viewport.label}.png`, snapshotOptions);
    }

    await gotoVisualState(page, '/contact?vr=1&state=button-states');
    await expect(page.locator('.button-state-lab')).toHaveScreenshot(`button-states-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/?vr=1&state=modal');
    await expect(page.locator('.contact-modal-overlay')).toHaveScreenshot(`modal-overlay-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/?vr=1&state=validation');
    await expect(page.locator('.contact-modal')).toHaveScreenshot(`form-validation-${viewport.label}.png`, snapshotOptions);

    await gotoVisualState(page, '/work?vr=1&state=skeleton');
    await expect(page.locator('.work-grid')).toHaveScreenshot(`loading-skeleton-${viewport.label}.png`, snapshotOptions);
  });
}
