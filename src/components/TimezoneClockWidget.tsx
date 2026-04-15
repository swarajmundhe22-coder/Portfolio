import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
    return 'Synced';
  }
  const sign = seconds > 0 ? '+' : '';
  return `${sign}${seconds}s`;
};

const getTimeOfDayPhase = (hours: number): { phase: string; bgGradient: string; accentColor: string; icon: string } => {
  if (hours >= 5 && hours < 8) return { phase: 'Sunrise', bgGradient: 'linear-gradient(135deg, #FF9500 0%, #FFB84D 100%)', accentColor: '#FF9500', icon: '🌅' };
  if (hours >= 8 && hours < 17) return { phase: 'Day', bgGradient: 'linear-gradient(135deg, #FFD60A 0%, #FFA500 100%)', accentColor: '#FFD60A', icon: '☀️' };
  if (hours >= 17 && hours < 20) return { phase: 'Sunset', bgGradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)', accentColor: '#FF6B35', icon: '🌆' };
  return { phase: 'Night', bgGradient: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)', accentColor: '#818cf8', icon: '🌙' };
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

  const zones = useIntlFormatter ? intlZones : fallbackZones;
  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  // Parse time carefully - activeZone.value is in HH:MM:SS 12-hour format
  const [hoursStr, minutesStr, secondsStr] = activeZone.value.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const seconds = parseInt(secondsStr, 10);
  
  // Get 24-hour format for phase calculation
  let hours24 = hours;
  if (activeZone.meridiem === 'PM' && hours !== 12) hours24 += 12;
  if (activeZone.meridiem === 'AM' && hours === 12) hours24 = 0;
  
  // Convert 12-hour to 0-11 range for clock display
  if (hours === 12) hours = 0; // 12 AM/PM becomes 0 for calculation
  
  const currentPhase = getTimeOfDayPhase(hours24); 
  
  // Clock hand angles (0° = 12 o'clock, increases clockwise)
  const hourAngle = (hours + minutes / 60 + seconds / 3600) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  // Setup NTP sync
  useEffect(() => {
    let syncTimer: number;
    
    const syncNtp = async () => {
      try {
        const offset = await fetchNtpOffsetMs();
        setOffsetMs(offset);
      } catch {
        // Silently fail if NTP unavailable
      }
    };

    syncNtp();
    syncTimer = window.setInterval(syncNtp, 10 * 60 * 1000); // Resync every 10 min

    return () => clearInterval(syncTimer);
  }, []);

  // Setup real-time ticker
  useEffect(() => {
    const tickTimer = window.setInterval(() => {
      setTickEpochMs(visualRegressionMode ? FROZEN_EPOCH_MS : Date.now());
    }, 1000);

    return () => clearInterval(tickTimer);
  }, [visualRegressionMode]);

  // Setup formatter once
  useEffect(() => {
    const loadFallbackZones = async () => {
      if (!useIntlFormatter) {
        const zones = await Promise.all(
          TIME_ZONE_ENTRIES.map((entry) => formatWithMomentFallback(epochMs, entry))
        );
        setFallbackZones(zones);
      }
    };
    loadFallbackZones();
  }, [epochMs, useIntlFormatter]);

  return (
    <motion.div
      className={`timezone-widget-premium ${className || ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* PREMIUM CLOCK CONTAINER */}
      <motion.div
        className="premium-clock-container"
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Animated Gradient Background */}
        <motion.div
          className="clock-gradient-bg"
          style={{ background: currentPhase.bgGradient }}
          animate={{
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Premium Clock SVG */}
        <svg className="premium-clock-svg" viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="premiumClockFace" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(15, 23, 42, 0.3)" />
              <stop offset="70%" stopColor="rgba(12, 15, 22, 0.7)" />
              <stop offset="100%" stopColor="rgba(8, 10, 16, 0.95)" />
            </radialGradient>

            <filter id="premiumGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="intensiveGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="handGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentPhase.accentColor} />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.6)" />
            </linearGradient>
          </defs>

          {/* Decorative Rings */}
          <circle cx="120" cy="120" r="118" fill="none" stroke={currentPhase.accentColor} strokeWidth="1" opacity="0.3" />
          <circle cx="120" cy="120" r="115" fill="none" stroke={currentPhase.accentColor} strokeWidth="0.5" opacity="0.15" />

          {/* Main Clock Face */}
          <circle cx="120" cy="120" r="110" fill="url(#premiumClockFace)" stroke={currentPhase.accentColor} strokeWidth="1.5" opacity="0.6" filter="url(#premiumGlow)" />

          {/* Hour Markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const isMainHour = i % 3 === 0;
            const markerLength = isMainHour ? 12 : 6;
            const markerWidth = isMainHour ? 2 : 1;
            const x1 = 120 + 98 * Math.cos(angle - Math.PI / 2);
            const y1 = 120 + 98 * Math.sin(angle - Math.PI / 2);
            const x2 = 120 + (98 - markerLength) * Math.cos(angle - Math.PI / 2);
            const y2 = 120 + (98 - markerLength) * Math.sin(angle - Math.PI / 2);

            return (
              <line
                key={`marker-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={currentPhase.accentColor}
                strokeWidth={markerWidth}
                opacity={isMainHour ? 0.9 : 0.5}
                filter="url(#premiumGlow)"
              />
            );
          })}

          {/* Hour Hand */}
          <motion.g
            style={{ transformOrigin: '120px 120px', transformBox: 'view-box' }}
            animate={{ rotate: hourAngle }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <line x1="120" y1="120" x2="120" y2="60" stroke={currentPhase.accentColor} strokeWidth="5" strokeLinecap="round" filter="url(#premiumGlow)" opacity="0.9" />
            <line x1="120" y1="120" x2="120" y2="60" stroke="rgba(0, 0, 0, 0.3)" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
          </motion.g>

          {/* Minute Hand */}
          <motion.g
            style={{ transformOrigin: '120px 120px', transformBox: 'view-box' }}
            animate={{ rotate: minuteAngle }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <line x1="120" y1="120" x2="120" y2="35" stroke={currentPhase.accentColor} strokeWidth="3" strokeLinecap="round" filter="url(#premiumGlow)" opacity="0.85" />
            <line x1="120" y1="120" x2="120" y2="35" stroke="rgba(0, 0, 0, 0.2)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </motion.g>

          {/* Second Hand */}
          <motion.g
            style={{ transformOrigin: '120px 120px', transformBox: 'view-box' }}
            animate={{ rotate: secondAngle }}
            transition={{ duration: 0.1, ease: 'linear' }}
          >
            <line x1="120" y1="120" x2="120" y2="25" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </motion.g>

          {/* Center Dot */}
          <circle cx="120" cy="120" r="8" fill={currentPhase.accentColor} filter="url(#intensiveGlow)" opacity="0.95" />
          <circle cx="120" cy="120" r="5" fill="rgba(255, 255, 255, 0.3)" />
          <circle cx="120" cy="120" r="3" fill="rgba(255, 255, 255, 0.8)" />
        </svg>

        {/* Phase Badge */}
        <motion.div
          className="phase-badge-premium"
          style={{ background: currentPhase.bgGradient }}
          animate={{ y: [0, -2, 0], x: '-50%' }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="phase-icon-premium">{currentPhase.icon}</span>
          <span className="phase-text">{currentPhase.phase}</span>
        </motion.div>
      </motion.div>

      {/* PREMIUM DIGITAL TIME DISPLAY */}
      <motion.div
        className="premium-time-display"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.div
          className="time-info-wrapper"
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <p className="time-date-label">{activeZone.dayLabel}</p>
          <p className="time-zone-badge">{activeZone.zoneAbbr}</p>
          <motion.h2
            className="time-large"
            key={`time-${activeZone.value}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {activeZone.value}
            <span className="meridiem">{activeZone.meridiem}</span>
          </motion.h2>
          <motion.p
            className="sync-indicator"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {formatOffsetLabel(offsetMs)}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* PREMIUM INTERACTIVE TABS */}
      <motion.div
        className="premium-timezone-tabs"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {zones.map((zone, idx) => {
          let [zHours] = zone.value.split(':').map((x) => parseInt(x, 10));
          if (zone.meridiem === 'PM' && zHours !== 12) zHours += 12;
          if (zone.meridiem === 'AM' && zHours === 12) zHours = 0;
          
          const zPhase = getTimeOfDayPhase(zHours);
          const isActive = zone.id === activeZone.id;

          return (
            <motion.button
              key={zone.id}
              className={`premium-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveZoneId(zone.id)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="tab-bg"
                animate={isActive ? { opacity: 1 } : { opacity: 0.5 }}
                transition={{ duration: 0.3 }}
                style={{ background: isActive ? zPhase.bgGradient : 'rgba(12, 15, 22, 0.6)' }}
              />

              <div className="tab-inner">
                <div className="tab-left-section">
                  <motion.div
                    className="phase-indicator"
                    style={{ background: zPhase.accentColor }}
                    animate={isActive ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 0.5 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="zone-info">
                    <span className="zone-abbr">{zone.shortLabel}</span>
                    <span className="zone-name">{zone.label}</span>
                  </div>
                </div>

                <div className="tab-right-section">
                  <time className="tab-time-value">{zone.value}</time>
                  <span className="tab-meridiem">{zone.meridiem}</span>
                  <span className="tab-phase" style={{ color: zPhase.accentColor }}>
                    {zPhase.phase}
                  </span>
                </div>
              </div>

              {isActive && (
                <motion.div
                  className="active-indicator"
                  layoutId="tab-active"
                  style={{ background: zPhase.accentColor }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default memo(TimezoneClockWidget);
