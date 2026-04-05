export interface TimeZoneEntry {
  id: string;
  zone: string;
  label: string;
  shortLabel: string;
}

export interface TimeZoneDisplay {
  id: string;
  label: string;
  shortLabel: string;
  value: string;
  meridiem: string;
  dayLabel: string;
  zoneAbbr: string;
}

export const TIME_ZONE_ENTRIES: TimeZoneEntry[] = [
  { id: 'us-eastern', zone: 'America/New_York', label: 'US Eastern', shortLabel: 'ET' },
  { id: 'us-central', zone: 'America/Chicago', label: 'US Central', shortLabel: 'CT' },
  { id: 'us-mountain', zone: 'America/Denver', label: 'US Mountain', shortLabel: 'MT' },
  { id: 'us-pacific', zone: 'America/Los_Angeles', label: 'US Pacific', shortLabel: 'PT' },
  { id: 'india', zone: 'Asia/Kolkata', label: 'India', shortLabel: 'IST' },
  { id: 'uk', zone: 'Europe/London', label: 'UK', shortLabel: 'GMT/BST' },
];

const FORMAT_CACHE = new Map<string, Intl.DateTimeFormat>();

export const supportsIntlTimeZone = (): boolean => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' });
    return formatter.resolvedOptions().timeZone === 'UTC';
  } catch {
    return false;
  }
};

const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
  const cached = FORMAT_CACHE.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'short',
    timeZone,
    timeZoneName: 'short',
  });

  FORMAT_CACHE.set(timeZone, formatter);
  return formatter;
};

export const computeNtpOffsetMs = (serverIso: string, clientCapturedMs: number): number => {
  const parsed = Date.parse(serverIso);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed - clientCapturedMs;
};

export const fetchNtpOffsetMs = async (
  endpoint = 'https://worldtimeapi.org/api/ip',
): Promise<number> => {
  const clientCaptured = Date.now();
  const response = await fetch(endpoint, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch NTP offset (${response.status})`);
  }

  const payload = (await response.json()) as { utc_datetime?: string };
  return computeNtpOffsetMs(payload.utc_datetime ?? '', clientCaptured);
};

export const formatWithIntl = (epochMs: number, entry: TimeZoneEntry): TimeZoneDisplay => {
  const formatter = getFormatter(entry.zone);
  const parts = formatter.formatToParts(new Date(epochMs));

  const partValue = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    id: entry.id,
    label: entry.label,
    shortLabel: entry.shortLabel,
    value: `${partValue('hour')}:${partValue('minute')}:${partValue('second')}`,
    meridiem: partValue('dayPeriod').toUpperCase(),
    dayLabel: partValue('weekday').toUpperCase(),
    zoneAbbr: partValue('timeZoneName').toUpperCase(),
  };
};

export const formatWithMomentFallback = async (
  epochMs: number,
  entry: TimeZoneEntry,
): Promise<TimeZoneDisplay> => {
  const { default: moment } = await import('moment-timezone');
  const zoned = moment.tz(epochMs, entry.zone);

  return {
    id: entry.id,
    label: entry.label,
    shortLabel: entry.shortLabel,
    value: zoned.format('hh:mm:ss'),
    meridiem: zoned.format('A'),
    dayLabel: zoned.format('ddd').toUpperCase(),
    zoneAbbr: zoned.format('z').toUpperCase(),
  };
};
