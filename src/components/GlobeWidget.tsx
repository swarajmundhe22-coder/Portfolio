import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  geoDistance,
  geoGraticule10,
  geoInterpolate,
  geoOrthographic,
  geoPath,
} from 'd3-geo';
import { interpolateNumber, interpolateRgb } from 'd3-interpolate';
import { KEY_COUNTRY_CODES, fetchCountryMetrics, type CountryMetric } from '../lib/globeData';

interface GlobeWidgetProps {
  className?: string;
  visualRegressionMode?: boolean;
}

type RegionCode = 'GBR' | 'IND' | 'USA' | 'JPN' | 'FRA';

interface RegionPoint {
  code: RegionCode;
  label: string;
  coordinates: [number, number];
}

interface RegionProjectionSnapshot extends RegionPoint {
  x: number;
  y: number;
  frontFactor: number;
  labelOpacity: number;
  visibleOnGlobe: boolean;
  renderOrder: number;
  xPercent: number;
  yPercent: number;
}

const WIDTH = 560;
const HEIGHT = 560;

const REGION_POINTS: RegionPoint[] = [
  { code: 'GBR', label: 'United Kingdom', coordinates: [-2.0, 54.0] },
  { code: 'IND', label: 'India', coordinates: [78.0, 20.0] },
  { code: 'USA', label: 'United States', coordinates: [-95.0, 38.0] },
  { code: 'JPN', label: 'Japan', coordinates: [138.0, 36.0] },
  { code: 'FRA', label: 'France', coordinates: [2.2, 46.0] },
];

const BASE_FEED: Record<RegionCode, { name: string; value: number }> = {
  GBR: { name: 'United Kingdom', value: 62 },
  IND: { name: 'India', value: 88 },
  USA: { name: 'United States', value: 94 },
  JPN: { name: 'Japan', value: 51 },
  FRA: { name: 'France', value: 46 },
};

const BASE_VALUES: Record<RegionCode, number> = {
  GBR: BASE_FEED.GBR.value,
  IND: BASE_FEED.IND.value,
  USA: BASE_FEED.USA.value,
  JPN: BASE_FEED.JPN.value,
  FRA: BASE_FEED.FRA.value,
};

const isRegionCode = (code: string): code is RegionCode =>
  code === 'GBR' || code === 'IND' || code === 'USA' || code === 'JPN' || code === 'FRA';

const metricColor = (value: number): string => {
  const normalized = Math.max(0, Math.min(1, value / 100));
  return interpolateRgb('#11203f', '#5ca6ff')(normalized);
};

const toMetricsMap = (rows: CountryMetric[]): Record<RegionCode, { name: string; value: number }> => {
  const next: Record<RegionCode, { name: string; value: number }> = {
    GBR: { ...BASE_FEED.GBR },
    IND: { ...BASE_FEED.IND },
    USA: { ...BASE_FEED.USA },
    JPN: { ...BASE_FEED.JPN },
    FRA: { ...BASE_FEED.FRA },
  };

  rows.forEach((row) => {
    if (isRegionCode(row.code) && KEY_COUNTRY_CODES.has(row.code)) {
      next[row.code] = {
        name: row.name,
        value: row.value,
      };
    }
  });

  return next;
};

const GlobeWidget = ({ className, visualRegressionMode }: GlobeWidgetProps) => {
  const [metrics, setMetrics] = useState<Record<RegionCode, { name: string; value: number }>>(() => ({
    GBR: { ...BASE_FEED.GBR },
    IND: { ...BASE_FEED.IND },
    USA: { ...BASE_FEED.USA },
    JPN: { ...BASE_FEED.JPN },
    FRA: { ...BASE_FEED.FRA },
  }));
  const [displayValues, setDisplayValues] = useState<Record<RegionCode, number>>(() => ({ ...BASE_VALUES }));
  const [rotation, setRotation] = useState(-16);
  const [selectedCode, setSelectedCode] = useState<RegionCode>('IND');
  const [hoveredCode, setHoveredCode] = useState<RegionCode | null>(null);
  const [, setTooltipCode] = useState<RegionCode | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [targetRotation, setTargetRotation] = useState(-16);
  const displayRef = useRef(displayValues);

  useEffect(() => {
    displayRef.current = displayValues;
  }, [displayValues]);

  useEffect(() => {
    if (visualRegressionMode) {
      return;
    }

    let disposed = false;

    const load = async () => {
      const rows = await fetchCountryMetrics();
      if (!disposed) {
        setMetrics(toMetricsMap(rows));
      }
    };

    load();
    const poll = window.setInterval(load, 60_000);

    return () => {
      disposed = true;
      window.clearInterval(poll);
    };
  }, [visualRegressionMode]);

  useEffect(() => {
    const sourceMetrics = visualRegressionMode ? BASE_FEED : metrics;
    const targetValues: Record<RegionCode, number> = {
      GBR: sourceMetrics.GBR.value,
      IND: sourceMetrics.IND.value,
      USA: sourceMetrics.USA.value,
      JPN: sourceMetrics.JPN.value,
      FRA: sourceMetrics.FRA.value,
    };

    if (visualRegressionMode) {
      displayRef.current = targetValues;
      return;
    }

    const startValues = displayRef.current;
    const start = performance.now();
    const duration = 850;
    let frameId = 0;

    const tick = (time: number) => {
      const progress = Math.max(0, Math.min(1, (time - start) / duration));
      const nextValues: Record<RegionCode, number> = {
        GBR: interpolateNumber(startValues.GBR, targetValues.GBR)(progress),
        IND: interpolateNumber(startValues.IND, targetValues.IND)(progress),
        USA: interpolateNumber(startValues.USA, targetValues.USA)(progress),
        JPN: interpolateNumber(startValues.JPN, targetValues.JPN)(progress),
        FRA: interpolateNumber(startValues.FRA, targetValues.FRA)(progress),
      };

      setDisplayValues(nextValues);
      displayRef.current = nextValues;

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [metrics, visualRegressionMode]);

  useEffect(() => {
    if (visualRegressionMode) {
      return;
    }

    let last = performance.now();
    let frameId = 0;

    const tick = (time: number) => {
      const delta = time - last;
      last = time;
      setRotation((current) => {
        const diff = targetRotation - current;
        if (Math.abs(diff) < 0.1) {
          return targetRotation;
        }
        return current + diff * 0.08;
      });
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [visualRegressionMode, targetRotation]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([WIDTH / 2, HEIGHT / 2])
        .scale(WIDTH * (zoomed ? 0.47 : 0.43))
        .clipAngle(90)
        .rotate([rotation, -18, 0]),
    [rotation, zoomed],
  );

  const calculateLabelPosition = (point: RegionProjectionSnapshot) => {
    const offsetDistance = 35;
    const angle = Math.atan2(point.y - HEIGHT / 2, point.x - WIDTH / 2);
    const offsetX = Math.cos(angle) * offsetDistance;
    const offsetY = Math.sin(angle) * offsetDistance;
    
    return {
      x: point.x + offsetX,
      y: point.y + offsetY,
      angle: angle * (180 / Math.PI),
    };
  };

  const centerCoords = projection.invert
    ? (projection.invert([WIDTH / 2, HEIGHT / 2]) as [number, number] | null)
    : null;

  const projectionSnapshots = useMemo(() => {
    return REGION_POINTS.map((point) => {
      const projected = projection(point.coordinates);
      if (!projected) {
        return null;
      }

      const depthAngle = centerCoords ? geoDistance(centerCoords, point.coordinates) : 0;
      const normalizedFrontFactor = centerCoords
        ? Math.max(0, 1 - depthAngle / (Math.PI / 2))
        : 1;
      const labelOpacity = 0.8 + Math.min(1, normalizedFrontFactor) * 0.2;
      const visibleOnGlobe = !centerCoords || depthAngle <= Math.PI / 2;
      const renderOrder = 1000 + Math.round(normalizedFrontFactor * 100);
      const xPercent = Math.max(8, Math.min(92, (projected[0] / WIDTH) * 100));
      const yPercent = Math.max(8, Math.min(92, (projected[1] / HEIGHT) * 100));

      return {
        ...point,
        x: projected[0],
        y: projected[1],
        frontFactor: normalizedFrontFactor,
        labelOpacity,
        visibleOnGlobe,
        renderOrder,
        xPercent,
        yPercent,
      } as RegionProjectionSnapshot;
    }).filter((point): point is RegionProjectionSnapshot => point !== null);
  }, [centerCoords, projection]);

  const visiblePoints = useMemo(
    () => projectionSnapshots.filter((point) => point.visibleOnGlobe),
    [projectionSnapshots],
  );

  const labelAnchors = useMemo(
    () =>
      projectionSnapshots
        .slice()
        .sort((left, right) => right.frontFactor - left.frontFactor),
    [projectionSnapshots],
  );

  const pathBuilder = useMemo(() => geoPath(projection), [projection]);

  const graticulePath = useMemo(() => pathBuilder(geoGraticule10()) || '', [pathBuilder]);

  const arcs = useMemo(() => {
    const origin = REGION_POINTS.find((point) => point.code === selectedCode) ?? REGION_POINTS[1];

    return REGION_POINTS.filter((point) => point.code !== origin.code)
      .map((target) => {
        const interpolate = geoInterpolate(origin.coordinates, target.coordinates);
        const projected = Array.from({ length: 24 }, (_, index) => interpolate(index / 23))
          .map((geoPoint) => projection(geoPoint as [number, number]))
          .filter((point): point is [number, number] => point !== null);

        if (projected.length < 2) {
          return null;
        }

        const d = projected
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0].toFixed(2)},${point[1].toFixed(2)}`)
          .join(' ');

        return {
          id: `${origin.code}-${target.code}`,
          d,
        };
      })
      .filter((item): item is { id: string; d: string } => item !== null);
  }, [projection, selectedCode]);


  const effectiveValues = visualRegressionMode ? BASE_VALUES : displayValues;   

  const selectedDisplayValue = Math.round(effectiveValues[selectedCode]);       

  return (
    <div className={`globe-widget ${className || ''}`.trim()}>
      <div className="globe-stage">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="globe-svg"
          role="img"
          aria-label="Interactive globe feed"
        >
        <defs>
          {/* Realistic spherical gradient with topographic shading */}
          <radialGradient id="globeSphere" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#3d6b99" stopOpacity="1" />
            <stop offset="20%" stopColor="#2d5a88" stopOpacity="1" />
            <stop offset="50%" stopColor="#1d4a78" stopOpacity="1" />
            <stop offset="75%" stopColor="#0d2a48" stopOpacity="1" />
            <stop offset="100%" stopColor="#051020" stopOpacity="1" />
          </radialGradient>
          <radialGradient id="globeGlow" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#0a1428" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id="realisticGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="dotGlow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.6" floodColor="#64b5f6" />
          </filter>
          <filter id="labelRealisticGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={WIDTH / 2}
          cy={HEIGHT / 2}
          r={WIDTH * 0.43}
          fill="url(#globeSphere)"
          stroke="#5a8ec4"
          strokeOpacity={0.35}
          strokeWidth={1.2}
          filter="url(#realisticGlow)"
        />

        <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={WIDTH * 0.48} fill="url(#globeGlow)" aria-hidden="true" />

        <path d={graticulePath} fill="none" stroke="#3a5a8a" strokeOpacity={0.25} strokeWidth={0.6} />

        {arcs.map((arc) => (
          <g key={arc.id}>
            <path d={arc.d} className="globe-route-professional" />
          </g>
        ))}

        {visiblePoints.map((point) => {
          const value = Math.round(effectiveValues[point.code]);
          const isActive = selectedCode === point.code;
          const labelPos = calculateLabelPosition(point);

          return (
            <g key={point.code}>
              {/* Professional data point dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 5.5 : 4}
                fill="#5a9ddf"
                stroke="#e8f4ff"
                strokeOpacity={0.9}
                strokeWidth={1.2}
                filter="url(#dotGlow)"
                style={{
                  cursor: 'pointer',
                  transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onPointerEnter={() => setTooltipCode(point.code)}
                onPointerLeave={() => setTooltipCode(null)}
                onClick={() => {
                  setSelectedCode(point.code);
                  setZoomed(true);
                  setTargetRotation(-point.coordinates[0]);
                }}
              />
              {/* Subtle outer ring for active state */}
              {isActive && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={7.5}
                  fill="none"
                  stroke="#5a9ddf"
                  strokeOpacity={0.25}
                  strokeWidth={1}
                  style={{
                    animation: 'pulse-subtle 2s ease-in-out infinite',
                  }}
                />
              )}
              {/* Connection line from dot to label */}
              {isActive && (
                <line
                  x1={point.x}
                  y1={point.y}
                  x2={labelPos.x}
                  y2={labelPos.y}
                  stroke="#5a9ddf"
                  strokeWidth={0.7}
                  strokeOpacity={0.3}
                  strokeDasharray="2,3"
                />
              )}
              {/* Professional label box with smart positioning */}
              <g className="globe-label-group" style={{ pointerEvents: 'none' }}>
                <rect
                  x={labelPos.x - 50}
                  y={labelPos.y - 14}
                  width={100}
                  height={22}
                  rx={4}
                  fill="rgba(10, 20, 40, 0.92)"
                  stroke={isActive ? '#5a9ddf' : '#3a5a8a'}
                  strokeWidth={isActive ? 1.2 : 0.8}
                  strokeOpacity={isActive ? 0.8 : 0.5}
                  filter="url(#labelRealisticGlow)"
                  style={{
                    transition: 'all 250ms ease-out',
                  }}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y + 2}
                  fill={isActive ? '#a8d4ff' : '#8ab8e6'}
                  fontSize="12"
                  fontWeight={isActive ? '700' : '600'}
                  textAnchor="middle"
                  pointerEvents="none"
                  style={{
                    transition: 'fill 250ms ease, font-weight 250ms ease',
                    fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                    letterSpacing: '0.4px',
                  }}
                >
                  {point.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <div className="globe-label-layer" aria-hidden="true">
        {labelAnchors.map((anchor) => (
          <div
            key={`label-${anchor.code}`}
            className="globe-label-chip"
            data-render-order={anchor.renderOrder}
            style={{
              left: `${anchor.xPercent}%`,
              top: `${anchor.yPercent}%`,
              opacity: anchor.labelOpacity,
              zIndex: anchor.renderOrder,
            }}
          >
            {anchor.label}
          </div>
        ))}
      </div>
    </div>
    
    <aside className="globe-sidebar">
      <div className="globe-country-pills" role="tablist" aria-label="Region focus">
        {REGION_POINTS.map((point) => (
          <button
            key={point.code}
            type="button"
            role="tab"
            aria-selected={selectedCode === point.code}
            className={`globe-pill ${selectedCode === point.code ? 'is-active' : ''} ${hoveredCode === point.code ? 'is-hovered' : ''}`}
            onMouseEnter={() => setHoveredCode(point.code)}
            onMouseLeave={() => setHoveredCode(null)}
            onClick={() => {
              setSelectedCode(point.code);
              setZoomed(true);
              setTargetRotation(-point.coordinates[0]);
            }}
          >
            {point.code === 'GBR' ? 'GB UK' : point.code === 'IND' ? 'IN India' : point.code === 'USA' ? 'US USA' : point.label}
          </button>
        ))}
      </div>
    </aside>
    </div>
  );
};

export default memo(GlobeWidget);
