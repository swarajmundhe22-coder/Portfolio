import { describe, expect, it } from 'vitest';
import {
  buildBookingSummary,
  buildCalendarGrid,
  createTimeSlots,
  firstSelectableDate,
  getMonthAvailability,
  stripRichTextToPlainText,
  validateBookingForm,
} from './bookingUtils';

describe('bookingUtils', () => {
  it('returns month availability metadata for all 12 months', () => {
    const availability = getMonthAvailability(2026);

    expect(availability).toHaveLength(12);
    expect(availability.every((month) => month.monthIndex >= 0 && month.monthIndex <= 11)).toBe(true);
    expect(availability.some((month) => month.status === 'available')).toBe(true);
  });

  it('builds a 42-cell calendar grid with past-day detection', () => {
    const today = new Date(2026, 3, 5, 9, 0, 0);
    const grid = buildCalendarGrid(2026, 3, today);

    expect(grid).toHaveLength(42);

    const dayFour = grid.find((cell) => cell.dayNumber === 4);
    const daySix = grid.find((cell) => cell.dayNumber === 6);

    expect(dayFour?.isPast).toBe(true);
    expect(daySix?.isPast).toBe(false);
    expect(firstSelectableDate(grid)).toBe('2026-04-05');
  });

  it('flags weekends correctly in calendar cells', () => {
    const today = new Date(2026, 3, 1, 9, 0, 0);
    const grid = buildCalendarGrid(2026, 3, today);
    const weekendCells = grid.filter((cell) => cell.isWeekend && cell.dayNumber !== null);

    expect(weekendCells.length).toBeGreaterThan(0);
  });

  it('creates 30-minute slots between 9:00 and 18:00', () => {
    const slots = createTimeSlots('2026-04-12', 'Asia/Kolkata');

    expect(slots).toHaveLength(19);
    expect(slots[0]?.value).toBe('09:00');
    expect(slots[slots.length - 1]?.value).toBe('18:00');
    expect(slots.some((slot) => slot.isAvailable)).toBe(true);
  });

  it('converts formatted rich text into plain text bullets', () => {
    const plain = stripRichTextToPlainText('<p>Hello <strong>there</strong></p><ul><li>Alpha</li><li>Beta</li></ul>');

    expect(plain).toContain('Hello there');
    expect(plain).toContain('• Alpha');
    expect(plain).toContain('• Beta');
  });

  it('validates booking form inputs and accepts valid payloads', () => {
    const invalid = validateBookingForm({
      name: '',
      email: 'bad-email',
      selectedDateIso: null,
      selectedTime: null,
      messageText: 'short',
      timezone: '',
    });

    expect(invalid.name).toBeTruthy();
    expect(invalid.email).toBeTruthy();
    expect(invalid.selectedDateIso).toBeTruthy();
    expect(invalid.selectedTime).toBeTruthy();
    expect(invalid.messageText).toBeTruthy();
    expect(invalid.timezone).toBeTruthy();

    const valid = validateBookingForm({
      name: 'Swaraj',
      email: 'swaraj@example.com',
      selectedDateIso: '2026-04-12',
      selectedTime: '10:30',
      messageText: 'Need a production-ready design system and booking workflow implementation.',
      timezone: 'Asia/Kolkata',
    });

    expect(valid).toEqual({});
    expect(buildBookingSummary('2026-04-12', '10:30', 'Asia/Kolkata')).toContain('April 12, 2026');
  });
});
