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
  { code: 'GBR', label: 'UK', coordinates: [-3.4, 55.3] },
  { code: 'IND', label: 'India', coordinates: [78.9, 22.4] },
  { code: 'USA', label: 'USA', coordinates: [-98.5, 39.8] },
  { code: 'JPN', label: 'Japan', coordinates: [138.2, 36.2] },
  { code: 'FRA', label: 'France', coordinates: [2.6, 46.7] },
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
  const [tooltipCode, setTooltipCode] = useState<RegionCode | null>(null);
  const [zoomed, setZoomed] = useState(false);
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
      setRotation((current) => current + (360 * delta) / 12_000);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [visualRegressionMode]);

  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([WIDTH / 2, HEIGHT / 2])
        .scale(WIDTH * (zoomed ? 0.47 : 0.43))
        .clipAngle(90)
        .rotate([rotation, -18, 0]),
    [rotation, zoomed],
  );

  const pathBuilder = useMemo(() => geoPath(projection), [projection]);

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

  const effectiveMetrics = visualRegressionMode ? BASE_FEED : metrics;
  const effectiveValues = visualRegressionMode ? BASE_VALUES : displayValues;

  const selectedMetric = effectiveMetrics[selectedCode];
  const selectedDisplayValue = Math.round(effectiveValues[selectedCode]);
  const tooltipMetric = tooltipCode ? effectiveMetrics[tooltipCode] : null;

  return (
    <div className={`globe-widget ${className || ''}`.trim()}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="globe-svg"
        role="img"
        aria-label="Interactive globe feed"
      >
        <defs>
          <radialGradient id="globeGlow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#2a4f96" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#090c14" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx={WIDTH / 2}
          cy={HEIGHT / 2}
          r={WIDTH * 0.43}
          fill="#070a11"
          stroke="#e4e9ff"
          strokeOpacity={0.25}
          strokeWidth={2}
        />

        <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={WIDTH * 0.46} fill="url(#globeGlow)" aria-hidden="true" />

        <path d={graticulePath} fill="none" stroke="#1f2f4f" strokeOpacity={0.45} strokeWidth={1} />

        {arcs.map((arc) => (
          <path key={arc.id} d={arc.d} fill="none" stroke="#4e85ff" strokeOpacity={0.68} strokeWidth={2.8} />
        ))}

        {visiblePoints.map((point) => {
          const value = Math.round(effectiveValues[point.code]);
          const isActive = selectedCode === point.code;

          return (
            <g key={point.code}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 8 : 6}
                fill={metricColor(value)}
                stroke="#dbe6ff"
                strokeOpacity={0.9}
                strokeWidth={1.2}
                onPointerEnter={() => setTooltipCode(point.code)}
                onPointerLeave={() => setTooltipCode(null)}
                onClick={() => {
                  setSelectedCode(point.code);
                  setZoomed(true);
                }}
              />
              <text
                x={point.x + 10}
                y={point.y - 8}
                fill="#f4f7ff"
                fontSize={12}
                fontWeight={600}
                pointerEvents="none"
                stroke="rgba(255,255,255,0.78)"
                strokeWidth={2.4}
                paintOrder="stroke"
                data-render-order={point.renderOrder}
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="globe-label-layer" aria-hidden="true">
        {labelAnchors.map((anchor) => (
          <div
            key={`label-${anchor.code}`}
            className="globe-label-panel"
            data-render-order={anchor.renderOrder}
            style={{
              left: `${anchor.xPercent}%`,
              top: `${anchor.yPercent}%`,
              opacity: anchor.labelOpacity,
              zIndex: anchor.renderOrder,
            }}
          >
            <span>{anchor.label}</span>
          </div>
        ))}
      </div>

      {tooltipCode && tooltipMetric ? (
        <div className="globe-tooltip" role="status" aria-live="polite">
          <strong>{tooltipMetric.name}</strong>
          <span>{Math.round(effectiveValues[tooltipCode]).toLocaleString()}</span>
        </div>
      ) : null}

      <div className="globe-country-pills" role="tablist" aria-label="Region focus">
        {REGION_POINTS.map((point) => (
          <button
            key={point.code}
            type="button"
            role="tab"
            aria-selected={selectedCode === point.code}
            className={selectedCode === point.code ? 'is-active' : ''}
            onClick={() => {
              setSelectedCode(point.code);
              setZoomed(true);
            }}
          >
            {point.code === 'GBR' ? 'GB UK' : point.code === 'IND' ? 'IN India' : point.code === 'USA' ? 'US USA' : point.label}
          </button>
        ))}
      </div>

      <aside className="globe-summary" aria-label="Country summary">
        <p>
          <span>LIVE FEED</span>
          {selectedMetric.name}
        </p>
        <strong>{selectedDisplayValue.toLocaleString()}</strong>
        <button type="button" onClick={() => setZoomed((current) => !current)}>
          {zoomed ? 'Reset View' : 'Zoom Region'}
        </button>
      </aside>
    </div>
  );
};

export default memo(GlobeWidget);
