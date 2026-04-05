import { describe, expect, it } from 'vitest';
import { normalizeCountryMetrics } from './globeData';

describe('globeData helpers', () => {
  it('normalizes country records and keeps stable metric codes', () => {
    const normalized = normalizeCountryMetrics([
      { cca2: 'in', cca3: 'ind', name: { common: 'India' } },
      { cca2: 'us', cca3: 'usa', name: { common: 'United States' } },
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized[0].code).toBe('IND');
    expect(normalized[1].id).toBe('US');
    expect(normalized[0].value).toBeGreaterThan(0);
  });

  it('filters records that cannot produce usable identifiers', () => {
    const normalized = normalizeCountryMetrics([{ name: { common: 'No Code' } }]);
    expect(normalized).toHaveLength(0);
  });
});
