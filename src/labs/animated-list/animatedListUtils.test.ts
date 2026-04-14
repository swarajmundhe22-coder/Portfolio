import { describe, expect, test } from 'vitest';
import {
  buildExponentialStagger,
  getContrastRatio,
  reorderByIndex,
} from './animatedListUtils';

describe('animatedListUtils', () => {
  test('buildExponentialStagger follows 40-60ms increments and caps total under 700ms', () => {
    const stagger = buildExponentialStagger(20);

    expect(stagger).toHaveLength(20);
    expect(stagger[0]).toBe(0);

    for (let index = 1; index < stagger.length; index += 1) {
      const delta = stagger[index] - stagger[index - 1];
      const isWithinStaggerRange = delta >= 40 && delta <= 60;
      const isCapped = delta === 0;
      expect(isWithinStaggerRange || isCapped).toBe(true);
    }

    expect(stagger[stagger.length - 1]).toBeLessThanOrEqual(700);
  });

  test('getContrastRatio validates wcag contrast targets', () => {
    const passRatio = getContrastRatio('#f8faff', '#0d1324');
    const failRatio = getContrastRatio('#707c9d', '#556086');

    expect(passRatio).toBeGreaterThanOrEqual(4.5);
    expect(failRatio).toBeLessThan(4.5);
  });

  test('reorderByIndex preserves all items while reordering', () => {
    const source = ['a', 'b', 'c', 'd'];
    const reordered = reorderByIndex(source, 0, 2);

    expect(reordered).toEqual(['b', 'c', 'a', 'd']);
    expect(source).toEqual(['a', 'b', 'c', 'd']);
  });
});
