import { describe, expect, it } from 'vitest';
import { computeNtpOffsetMs, formatWithIntl, TIME_ZONE_ENTRIES } from './timezoneUtils';

describe('timezoneUtils', () => {
  it('returns zero offset for invalid server ISO timestamps', () => {
    expect(computeNtpOffsetMs('invalid-date', 1_000)).toBe(0);
  });

  it('computes client/server offset in milliseconds', () => {
    const offset = computeNtpOffsetMs('2026-04-05T10:00:00.000Z', Date.parse('2026-04-05T09:59:57.500Z'));
    expect(offset).toBe(2_500);
  });

  it('formats timezone values with Intl for stable chip rendering', () => {
    const result = formatWithIntl(Date.parse('2026-04-05T09:30:00.000Z'), TIME_ZONE_ENTRIES[4]);

    expect(result.id).toBe('india');
    expect(result.value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(result.meridiem).toMatch(/AM|PM/);
    expect(result.dayLabel).toHaveLength(3);
    expect(result.zoneAbbr.length).toBeGreaterThan(0);
  });
});
