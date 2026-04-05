import { expect, test } from '@playwright/test';

test('code-splitting boundaries load independent chunks', async ({ page }) => {
  const scriptRequests: string[] = [];

  page.on('requestfinished', (request) => {
    if (request.resourceType() === 'script') {
      scriptRequests.push(request.url());
    }
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForSelector('.portfolio-app');
  await page.waitForTimeout(900);

  const geometry = await page.evaluate(() => {
    const section = document.getElementById('blogs');
    if (!section) {
      return {
        canAssertDeferred: false,
      };
    }

    const rect = section.getBoundingClientRect();
    return {
      canAssertDeferred: rect.top > window.innerHeight,
    };
  });

  const initialScripts = [...new Set(scriptRequests)];
  const initialResources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => entry.name),
  );

  expect(initialScripts.some((url) => url.includes('/assets/framework-'))).toBeTruthy();
  expect(initialScripts.some((url) => url.includes('/assets/vendor-'))).toBeTruthy();
  expect(initialScripts.some((url) => url.includes('/assets/ui-motion-'))).toBeTruthy();
  if (geometry.canAssertDeferred) {
    expect(initialScripts.some((url) => url.includes('/assets/DynamicBlogCards-'))).toBeFalsy();
    expect(initialResources.some((url) => url.includes('/assets/DynamicBlogCards-'))).toBeFalsy();
  }

  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Insights', exact: true }).click();

  await expect
    .poll(
      async () =>
        page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .map((entry) => entry.name)
            .some((url) => url.includes('/assets/DynamicBlogCards-')),
        ),
      { timeout: 20_000 },
    )
    .toBeTruthy();

  const postInteractionScripts = [...new Set(scriptRequests)];
  const postInteractionResources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => entry.name),
  );

  expect(postInteractionScripts.some((url) => url.includes('/assets/DynamicBlogCards-'))).toBeTruthy();
  expect(postInteractionResources.some((url) => url.includes('/assets/DynamicBlogCards-'))).toBeTruthy();
  expect(postInteractionScripts.some((url) => url.includes('/assets/GlobeWidget-'))).toBeTruthy();
  expect(postInteractionScripts.some((url) => url.includes('/assets/TimezoneClockWidget-'))).toBeTruthy();
});
