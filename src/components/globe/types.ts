/**
 * Globe Component Type Definitions
 * Enterprise-grade type system for globe region data and interactions
 */

export type RegionCode = 'GBR' | 'IND' | 'USA' | 'JPN' | 'FRA';

/**
 * Core region data structure
 */
export interface GlobeRegion {
  code: RegionCode;
  label: string;
  lat: number;
  lng: number;
  value: number;
  description?: string;
}

/**
 * Label rendering state with computed metrics
 */
export interface RenderLabel {
  code: RegionCode;
  label: string;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
  depth: number;
  hovered: boolean;
  textOpacity: number;
  fontSize: number;
}

/**
 * Hit detection result with confidence metrics
 */
export interface HitResult {
  code: RegionCode;
  distance: number;
  confidence: number;
  isClusteredRegion: boolean;
}

/**
 * Region cluster for handling proximity issues
 */
export interface RegionCluster {
  primary: RegionCode;
  members: RegionCode[];
  centerLat: number;
  centerLng: number;
  radius: number;
}

/**
 * Texture configuration for high-fidelity rendering
 */
export interface TextureConfig {
  earthTexture?: string;
  bumpMap?: string;
  specularMap?: string;
  cloudMap?: string;
  nocTexture?: string;
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  drawCalls: number;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
}

/**
 * Callback function types
 */
export type PickCallback = (code: RegionCode | null, cluster?: RegionCluster) => void;
export type ClickCallback = (code: RegionCode, cluster?: RegionCluster) => void;
export type LabelsUpdateCallback = (labels: RenderLabel[]) => void;
export type ErrorCallback = (error: Error) => void;
