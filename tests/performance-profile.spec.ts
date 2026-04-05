/// <reference types="node" />

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

interface RuntimeMetrics {
  projectName: string;
  browserName: string;
  phase: string;
  wallClockLoadedMs: number;
  ttfbMs: number | null;
  domInteractiveMs: number | null;
  loadEventEndMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  timestamp: string;
}

test.setTimeout(90_000);

test('collect runtime perf metrics', async ({ page, browserName }, testInfo) => {
  const phase = process.env.PERF_PHASE ?? 'unspecified';
  const projectName = testInfo.project.name;

  await page.addInitScript(() => {
    // @ts-expect-error attach runtime probe data to window
    window.__perfMarks = { lcp: 0 };

    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        // @ts-expect-error attach runtime probe data to window
        window.__perfMarks.lcp = last.startTime;
      }
    });

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        lcpObserver.disconnect();
      }
    });
  });

  const startedAt = Date.now();
  await page.goto('/?vr=1', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.waitForSelector('.portfolio-app');
  await page.waitForTimeout(2_200);
  const wallClockLoadedMs = Date.now() - startedAt;

  const navMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null;

    // @ts-expect-error attach runtime probe data to window
    const lcp = window.__perfMarks?.lcp ?? null;

    if (!navigation) {
      return {
        ttfbMs: null,
        domInteractiveMs: null,
        loadEventEndMs: null,
        fcpMs: fcp,
        lcpMs: lcp,
      };
    }

    return {
      ttfbMs: navigation.responseStart,
      domInteractiveMs: navigation.domInteractive,
      loadEventEndMs: navigation.loadEventEnd,
      fcpMs: fcp,
      lcpMs: lcp,
    };
  });

  const metrics: RuntimeMetrics = {
    projectName,
    browserName,
    phase,
    wallClockLoadedMs,
    ...navMetrics,
    timestamp: new Date().toISOString(),
  };

  const metricsDir = path.join(process.cwd(), 'analysis', 'perf');
  await mkdir(metricsDir, { recursive: true });
  const metricsFile = path.join(metricsDir, `runtime-${phase}-${projectName}.json`);
  await writeFile(metricsFile, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');

  expect(metrics.wallClockLoadedMs).toBeGreaterThan(0);
});
