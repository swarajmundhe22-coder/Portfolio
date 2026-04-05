import { memo, useEffect, useMemo, useState } from 'react';
import {
  fetchNtpOffsetMs,
  formatWithIntl,
  formatWithMomentFallback,
  supportsIntlTimeZone,
  TIME_ZONE_ENTRIES,
  type TimeZoneDisplay,
} from '../lib/timezoneUtils';

interface TimezoneClockWidgetProps {
  className?: string;
  visualRegressionMode?: boolean;
}

const FROZEN_EPOCH_MS = Date.parse('2026-04-05T09:30:00.000Z');

const formatOffsetLabel = (offsetMs: number): string => {
  const seconds = Math.round(offsetMs / 1000);
  if (seconds === 0) {
    return 'Clock sync +/-0s';
  }

  const sign = seconds > 0 ? '+' : '';
  return `Clock sync ${sign}${seconds}s`;
};

const TimezoneClockWidget = ({ className, visualRegressionMode }: TimezoneClockWidgetProps) => {
  const [offsetMs, setOffsetMs] = useState(0);
  const [tickEpochMs, setTickEpochMs] = useState(() =>
    visualRegressionMode ? FROZEN_EPOCH_MS : Date.now(),
  );
  const [activeZoneId, setActiveZoneId] = useState('india');
  const [fallbackZones, setFallbackZones] = useState<TimeZoneDisplay[]>(() =>
    TIME_ZONE_ENTRIES.map((entry) => formatWithIntl(FROZEN_EPOCH_MS, entry)),
  );

  const useIntlFormatter = useMemo(() => supportsIntlTimeZone(), []);
  const epochMs = visualRegressionMode ? FROZEN_EPOCH_MS : tickEpochMs + offsetMs;

  const intlZones = useMemo(
    () => TIME_ZONE_ENTRIES.map((entry) => formatWithIntl(epochMs, entry)),
    [epochMs],
  );

  useEffect(() => {
    if (visualRegressionMode) {
      return;
    }

    const timer = window.setInterval(() => {
      setTickEpochMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [visualRegressionMode]);

  useEffect(() => {
    if (visualRegressionMode) {
      return;
    }

    let disposed = false;

    const syncClock = async () => {
      try {
        const nextOffset = await fetchNtpOffsetMs();
        if (!disposed) {
          setOffsetMs(nextOffset);
        }
      } catch {
        if (!disposed) {
          setOffsetMs(0);
        }
      }
    };

    syncClock();
    const poll = window.setInterval(syncClock, 10 * 60_000);

    return () => {
      disposed = true;
      window.clearInterval(poll);
    };
  }, [visualRegressionMode]);

  useEffect(() => {
    if (useIntlFormatter) {
      return;
    }

    let disposed = false;

    const runFallback = async () => {
      const formatted = await Promise.all(
        TIME_ZONE_ENTRIES.map((entry) => formatWithMomentFallback(epochMs, entry)),
      );
      if (!disposed) {
        setFallbackZones(formatted);
      }
    };

    runFallback();
    return () => {
      disposed = true;
    };
  }, [epochMs, useIntlFormatter]);

  const zones = useIntlFormatter ? intlZones : fallbackZones;

  const activeZone = zones.find((zone) => zone.id === activeZoneId) ?? zones[0];

  return (
    <div className={`timezone-widget ${className || ''}`.trim()}>
      <div className="timezone-primary" role="timer" aria-live="off">
        <p>
          {activeZone.dayLabel} / {activeZone.zoneAbbr}
        </p>
        <strong>
          {activeZone.value}
          <small>{activeZone.meridiem}</small>
        </strong>
        <span>{formatOffsetLabel(offsetMs)}</span>
      </div>

      <div className="timezone-chip-list" role="tablist" aria-label="Timezone chips">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            role="tab"
            aria-selected={zone.id === activeZone.id}
            className={zone.id === activeZone.id ? 'is-active' : ''}
            onClick={() => setActiveZoneId(zone.id)}
          >
            <span>
              {zone.shortLabel} {zone.label}
            </span>
            <time>{`${zone.value} ${zone.meridiem}`}</time>
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(TimezoneClockWidget);
