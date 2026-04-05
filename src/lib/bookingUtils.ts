export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type MonthStatus = 'available' | 'limited' | 'unavailable';

export interface MonthAvailability {
  monthIndex: number;
  label: (typeof MONTH_NAMES)[number];
  status: MonthStatus;
  availableSlots: number;
}

export interface CalendarDayCell {
  key: string;
  isoDate: string | null;
  dayNumber: number | null;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isPast: boolean;
  isDisabled: boolean;
}

export interface TimeSlot {
  key: string;
  value: string;
  label: string;
  isAvailable: boolean;
}

export interface BookingFormInput {
  name: string;
  email: string;
  selectedDateIso: string | null;
  selectedTime: string | null;
  messageText: string;
  timezone: string;
}

export interface BookingValidationErrors {
  name?: string;
  email?: string;
  selectedDateIso?: string;
  selectedTime?: string;
  messageText?: string;
  timezone?: string;
}

const stableHash = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfLocalDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const formatSlotLabel = (minutesSinceMidnight: number): string => {
  const hours24 = Math.floor(minutesSinceMidnight / 60);
  const minutes = minutesSinceMidnight % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
};

export const getMonthAvailability = (year: number): MonthAvailability[] =>
  MONTH_NAMES.map((label, monthIndex) => {
    const score = stableHash(`${year}-${monthIndex}`) % 100;

    if (score >= 86) {
      return {
        monthIndex,
        label,
        status: 'unavailable',
        availableSlots: 0,
      };
    }

    if (score >= 60) {
      return {
        monthIndex,
        label,
        status: 'limited',
        availableSlots: 40 + (score % 20),
      };
    }

    return {
      monthIndex,
      label,
      status: 'available',
      availableSlots: 70 + (score % 30),
    };
  });

export const buildCalendarGrid = (
  year: number,
  monthIndex: number,
  today: Date = new Date(),
): CalendarDayCell[] => {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const firstWeekdayIndex = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const currentDayStamp = startOfLocalDay(today);

  return Array.from({ length: 42 }, (_, cellIndex) => {
    const dayNumber = cellIndex - firstWeekdayIndex + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return {
        key: `blank-${cellIndex}`,
        isoDate: null,
        dayNumber: null,
        isCurrentMonth: false,
        isWeekend: false,
        isPast: false,
        isDisabled: true,
      };
    }

    const date = new Date(year, monthIndex, dayNumber);
    const weekday = date.getDay();
    const isPast = startOfLocalDay(date) < currentDayStamp;

    return {
      key: toIsoDate(date),
      isoDate: toIsoDate(date),
      dayNumber,
      isCurrentMonth: true,
      isWeekend: weekday === 0 || weekday === 6,
      isPast,
      isDisabled: isPast,
    };
  });
};

export const firstSelectableDate = (cells: CalendarDayCell[]): string | null =>
  cells.find((cell) => cell.isoDate && !cell.isDisabled)?.isoDate ?? null;

export const createTimeSlots = (isoDate: string, timezone: string): TimeSlot[] => {
  const slots = Array.from({ length: 19 }, (_, index) => {
    const minutesSinceMidnight = 9 * 60 + index * 30;
    const hours24 = Math.floor(minutesSinceMidnight / 60);
    const minutes = minutesSinceMidnight % 60;
    const value = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const isAvailable = stableHash(`${isoDate}-${timezone}-${value}`) % 6 !== 0;

    return {
      key: `${isoDate}-${value}`,
      value,
      label: formatSlotLabel(minutesSinceMidnight),
      isAvailable,
    };
  });

  if (slots.some((slot) => slot.isAvailable)) {
    return slots;
  }

  return slots.map((slot, index) => ({
    ...slot,
    isAvailable: index % 2 === 0,
  }));
};

export const stripRichTextToPlainText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const validateBookingForm = (input: BookingFormInput): BookingValidationErrors => {
  const nextErrors: BookingValidationErrors = {};

  if (!input.name.trim()) {
    nextErrors.name = 'Please enter your name.';
  } else if (input.name.trim().length < 2) {
    nextErrors.name = 'Name must have at least 2 characters.';
  }

  if (!input.email.trim()) {
    nextErrors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    nextErrors.email = 'Please enter a valid email address.';
  }

  if (!input.selectedDateIso) {
    nextErrors.selectedDateIso = 'Please select a day.';
  }

  if (!input.selectedTime) {
    nextErrors.selectedTime = 'Please select a time slot.';
  }

  const messageLength = input.messageText.trim().length;
  if (!messageLength) {
    nextErrors.messageText = 'Please share your project context.';
  } else if (messageLength < 20) {
    nextErrors.messageText = 'Please provide at least 20 characters.';
  } else if (messageLength > 500) {
    nextErrors.messageText = 'Message cannot exceed 500 characters.';
  }

  if (!input.timezone.trim()) {
    nextErrors.timezone = 'Timezone could not be detected.';
  }

  return nextErrors;
};

export const buildBookingSummary = (
  selectedDateIso: string,
  selectedTime: string,
  timezone: string,
): string => {
  const date = new Date(`${selectedDateIso}T00:00:00`);
  const monthLabel = MONTH_NAMES[date.getMonth()];
  const dayLabel = String(date.getDate()).padStart(2, '0');

  return `Booking request: ${monthLabel} ${dayLabel}, ${date.getFullYear()} at ${selectedTime} (${timezone}).`;
};
