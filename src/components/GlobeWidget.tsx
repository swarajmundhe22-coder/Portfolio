import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnhancedThreeGlobeManager } from './globe/EnhancedThreeGlobeManager';
import type { GlobeRegion, RegionCode, RenderLabel, RegionCluster } from './globe/types';
import { fetchCountryMetrics } from '../lib/globeData';

interface GlobeWidgetProps {
  className?: string;
  visualRegressionMode?: boolean;
}

const REGION_POINTS: Record<RegionCode, { lat: number; lng: number }> = {
  GBR: { lat: 54.0, lng: -2.0 },
  IND: { lat: 20.0, lng: 78.0 },
  USA: { lat: 38.0, lng: -95.0 },
  JPN: { lat: 36.0, lng: 138.0 },
  FRA: { lat: 46.0, lng: 2.2 },
};

const BASE_FEED: Record<RegionCode, { name: string; value: number }> = {
  GBR: { name: 'United Kingdom', value: 62 },
  IND: { name: 'India', value: 88 },
  USA: { name: 'United States', value: 94 },
  JPN: { name: 'Japan', value: 51 },
  FRA: { name: 'France', value: 46 },
};

const GlobeWidget = ({ className = '', visualRegressionMode }: GlobeWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<EnhancedThreeGlobeManager | null>(null);
  const navigate = useNavigate();
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  const [metrics, setMetrics] = useState(BASE_FEED);
  const [labels, setLabels] = useState<RenderLabel[]>([]);
  const [hoveredCode, setHoveredCode] = useState<RegionCode | null>(null);
  const [selectedCode, setSelectedCode] = useState<RegionCode | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch metrics on mount
  useEffect(() => {
    if (!visualRegressionMode) {
      fetchCountryMetrics().then(rows => {
        const next = { ...BASE_FEED };
        rows.forEach(r => {
          if (next[r.code as RegionCode]) {
            next[r.code as RegionCode].value = r.value;
          }
        });
        setMetrics(next);
      }).catch(e => console.error('GlobeWidget: Metrics fetch error', e));
    }
  }, [visualRegressionMode]);

  // Handle region click with smooth transition
  const handleRegionClick = useCallback((code: RegionCode, cluster?: RegionCluster) => {
    setSelectedCode(code);
    setIsNavigating(true);

    // Trigger smooth transition before navigation
    navigationTimeoutRef.current = setTimeout(() => {
      navigate(`/work/${code.toLowerCase()}`, {
        state: { sourceRegion: code, clusterInfo: cluster }
      });
    }, 300);
  }, [navigate]);

  // Handle error with user feedback
  const handleError = useCallback((error: Error) => {
    console.error('GlobeWidget Error:', error);
    // TODO: Show toast or error boundary
  }, []);

  // Initialize globe manager
  useEffect(() => {
    if (!containerRef.current) return;

    if (!managerRef.current) {
      try {
        managerRef.current = new EnhancedThreeGlobeManager(
          containerRef.current,
          (code) => setHoveredCode(code),
          handleRegionClick,
          (labelData) => setLabels(labelData),
          {
            accessibilityConfig: { ariaLabels: true, keyboardNavigation: true },
            performanceConfig: { targetFPS: 60, maxPixelRatio: 2 }
          },
          handleError
        );

        const initialData: GlobeRegion[] = Object.keys(REGION_POINTS).map((code) => ({
          code: code as RegionCode,
          label: BASE_FEED[code as RegionCode].name,
          lat: REGION_POINTS[code as RegionCode].lat,
          lng: REGION_POINTS[code as RegionCode].lng,
          value: BASE_FEED[code as RegionCode].value,
        }));
        managerRef.current.updateData(initialData);
      } catch (error) {
        handleError(error as Error);
      }
    }

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [handleRegionClick, handleError]);

  // Update globe data when metrics change
  useEffect(() => {
    if (managerRef.current) {
      const data: GlobeRegion[] = Object.keys(REGION_POINTS).map((code) => ({
        code: code as RegionCode,
        label: metrics[code as RegionCode].name,
        lat: REGION_POINTS[code as RegionCode].lat,
        lng: REGION_POINTS[code as RegionCode].lng,
        value: metrics[code as RegionCode].value,
        description: `Services available in ${metrics[code as RegionCode].name}`
      }));
      managerRef.current.updateData(data);
    }
  }, [metrics]);

  const getCursor = () => {
    if (isNavigating) return 'wait';
    if (hoveredCode) return 'pointer';
    return 'grab';
  };

  // Get country code abbreviations
  const getCountryCode = (code: RegionCode): string => {
    const codes: Record<RegionCode, string> = {
      GBR: 'GB',
      IND: 'IN',
      USA: 'US',
      JPN: 'JP',
      FRA: 'FR'
    };
    return codes[code];
  };

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: '100%', 
        height: '560px', 
        overflow: 'hidden',
        opacity: isNavigating ? 0.95 : 1,
        transition: 'opacity 300ms ease-out',
        display: 'flex',
        gap: '1.5rem',
        padding: '1.5rem'
      }}
    >
      {/* Globe Container - Left Side */}
      <div 
        ref={containerRef} 
        style={{ 
          flex: 1,
          cursor: getCursor(),
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 100, 200, 0.2)'
        }} 
        role="application"
        aria-label="Interactive globe widget"
      />
      
      {/* Right Side Panel - Countries & Labels */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '140px',
          zIndex: 15,
          justifyContent: 'center'
        }}
      >
        {/* Country Pills */}
        <div 
          className="globe-country-pills"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            pointerEvents: 'auto'
          }}
        >
          {Object.entries(BASE_FEED).map(([code, { name }]) => (
            <button
              key={code}
              onClick={() => handleRegionClick(code as RegionCode)}
              onMouseEnter={() => setHoveredCode(code as RegionCode)}
              onMouseLeave={() => setHoveredCode(null)}
              className={`globe-country-badge ${
                selectedCode === code ? 'is-active' : ''
              } ${hoveredCode === code ? 'is-hovered' : ''}`}
              aria-label={`Navigate to ${name}`}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(100, 200, 255, 0.2)',
                background: selectedCode === code 
                  ? 'rgba(160, 88, 40, 0.3)' 
                  : hoveredCode === code
                  ? 'rgba(100, 200, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                color: selectedCode === code 
                  ? '#d99763'
                  : hoveredCode === code
                  ? '#58a6ff'
                  : '#9097a3',
                fontSize: '0.75rem',
                fontWeight: selectedCode === code ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                textAlign: 'left',
                boxShadow: hoveredCode === code 
                  ? '0 0 16px rgba(100, 200, 255, 0.3)'
                  : 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                {getCountryCode(code as RegionCode)}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                {name}
              </div>
            </button>
          ))}
        </div>

        {/* Remote Location Info */}
        {selectedCode && (
          <div 
            style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.7rem',
              color: '#9097a3',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginBottom: '0.3rem' }}>
              <span>📍</span>
              <span>REMOTE</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b0c4df', fontWeight: 500 }}>
              {BASE_FEED[selectedCode as RegionCode]?.name}
            </div>
          </div>
        )}
      </div>

      {/* Animated Labels Layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ padding: '1.5rem' }}
      >
        {labels.map(l => (
          <div
            key={l.code}
            className="absolute transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${l.x}px`, 
              top: `${l.y}px`,
              opacity: l.visible ? l.textOpacity : 0,
              scale: l.scale,
              fontSize: `${l.fontSize}px`,
              zIndex: l.hovered ? 20 : 10,
              textShadow: l.hovered 
                ? '0 0 12px rgba(88, 166, 255, 0.6)' 
                : '0 2px 8px rgba(0,0,0,0.8)',
              color: l.hovered ? '#58a6ff' : '#b0c4df',
              fontWeight: l.hovered ? 700 : 500,
              fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
              letterSpacing: l.hovered ? '0.5px' : '0px',
              textTransform: 'capitalize',
              whiteSpace: 'nowrap'
            }}
          >
            {l.label}
          </div>
        ))}
      </div>

      {/* Loading Indicator */}
      {isNavigating && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          aria-live="polite"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-blue-500" />
        </div>
      )}
    </div>
  );
};

export default memo(GlobeWidget);
