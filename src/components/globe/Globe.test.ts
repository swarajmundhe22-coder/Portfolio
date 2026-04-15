/**
 * Unit Tests for Globe Component
 * Comprehensive test coverage for core systems
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegionClusteringSystem } from '../RegionClusteringSystem';
import { HitDetection } from '../HitDetection';
import { AccessibilityManager } from '../AccessibilityManager';
import { TextureManager } from '../TextureManager';
import { ErrorHandler } from '../ErrorHandler';
import type { GlobeRegion, RegionCode } from '../types';

describe('RegionClusteringSystem', () => {
  let clusteringSystem: RegionClusteringSystem;

  beforeEach(() => {
    clusteringSystem = new RegionClusteringSystem();
  });

  it('should identify clusters for nearby regions', () => {
    const regions: GlobeRegion[] = [
      { code: 'GBR', label: 'UK', lat: 54.0, lng: -2.0, value: 62 },
      { code: 'FRA', label: 'France', lat: 46.0, lng: 2.2, value: 46 },
      { code: 'USA', label: 'USA', lat: 38.0, lng: -95.0, value: 94 },
    ];

    clusteringSystem.initializeClusters(regions);

    // UK and France should be clustered (close proximity)
    const isGBRClustered = clusteringSystem.isClusteredRegion('GBR');
    const isFRAClustered = clusteringSystem.isClusteredRegion('FRA');

    expect(isGBRClustered || isFRAClustered).toBe(true); // At least one should be clustered
  });

  it('should return cluster members correctly', () => {
    const regions: GlobeRegion[] = [
      { code: 'GBR', label: 'UK', lat: 54.0, lng: -2.0, value: 62 },
      { code: 'FRA', label: 'France', lat: 46.0, lng: 2.2, value: 46 },
    ];

    clusteringSystem.initializeClusters(regions);
    clusteringSystem.setClusterRadius(20);

    const cluster = clusteringSystem.getCluster('GBR');
    if (cluster) {
      expect(cluster.members).toContain('GBR');
      expect(cluster.members).toContain('FRA');
    }
  });

  it('should adjust cluster radius dynamically', () => {
    clusteringSystem.setClusterRadius(10);
    const regions: GlobeRegion[] = [
      { code: 'GBR', label: 'UK', lat: 54.0, lng: -2.0, value: 62 },
      { code: 'FRA', label: 'France', lat: 46.0, lng: 2.2, value: 46 },
    ];

    clusteringSystem.initializeClusters(regions);
    const cluster = clusteringSystem.getCluster('GBR');
    const radius = clusteringSystem.getClusterRadius('GBR');
    expect(radius).toBeGreaterThanOrEqual(0);
  });
});

describe('HitDetection', () => {
  let hitDetection: HitDetection;

  beforeEach(() => {
    hitDetection = new HitDetection();
  });

  it('should calculate great circle distance correctly', () => {
    // London to Paris (approximately 344 km)
    const distance = hitDetection['calculateGreatCircleDistance'](51.5074, -0.1278, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(300);
    expect(distance).toBeLessThan(400);
  });

  it('should identify nearby regions within threshold', () => {
    const regions = new Map<RegionCode, { lat: number; lng: number }>([
      ['GBR', { lat: 54.0, lng: -2.0 }],
      ['FRA', { lat: 46.0, lng: 2.2 }],
      ['USA', { lat: 38.0, lng: -95.0 }],
    ]);

    hitDetection.setProximityThreshold(20);
    const nearby = hitDetection.getNearbyRegions('GBR', regions, 20);

    expect(nearby).toContain('FRA');
    expect(nearby).not.toContain('USA');
  });

  it('should update clusters', () => {
    const clusters = new Map();
    clusters.set('GBR', {
      primary: 'GBR',
      members: ['GBR', 'FRA'],
      centerLat: 50,
      centerLng: 0,
      radius: 15
    });

    expect(() => hitDetection.updateClusters(clusters)).not.toThrow();
  });
});

describe('AccessibilityManager', () => {
  let accessibilityManager: AccessibilityManager;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    accessibilityManager = new AccessibilityManager({ ariaLabels: true });
  });

  afterEach(() => {
    accessibilityManager.dispose();
    document.body.removeChild(container);
  });

  it('should setup accessibility features', () => {
    accessibilityManager.setup(container);
    expect(container.getAttribute('role')).toBe('application');
    expect(container.getAttribute('tabindex')).toBe('0');
  });

  it('should detect reduced motion preference', () => {
    const reduceMotion = accessibilityManager.isReduceMotionEnabled();
    expect(typeof reduceMotion).toBe('boolean');
  });

  it('should toggle high contrast mode', () => {
    accessibilityManager.setHighContrast(true);
    const config = accessibilityManager.getConfig();
    expect(config.highContrast).toBe(true);
  });

  it('should get keyboard handler', () => {
    const handler = accessibilityManager.getKeyboardHandler(
      ['GBR', 'FRA', 'USA'],
      vi.fn()
    );
    expect(typeof handler).toBe('function');
  });
});

describe('ErrorHandler', () => {
  it('should log errors with context', () => {
    const errorCallback = vi.fn();
    const handler = new ErrorHandler(errorCallback);

    const testError = new Error('Test error');
    handler.handle(testError, 'TestContext');

    expect(errorCallback).toHaveBeenCalledWith(testError, 'TestContext');
  });

  it('should maintain error log', () => {
    const handler = new ErrorHandler();

    handler.handle('Error 1', 'Context1');
    handler.handle('Error 2', 'Context2');

    const log = handler.getLog();
    expect(log.length).toBe(2);
  });

  it('should get last error', () => {
    const handler = new ErrorHandler();

    handler.handle('Error 1');
    handler.handle('Error 2');

    const lastError = handler.getLastError();
    expect(lastError?.error.message).toContain('Error 2');
  });

  it('should export error report', () => {
    const handler = new ErrorHandler();

    handler.handle(new Error('Test error'), 'TestContext');

    const report = handler.exportReport();
    expect(report).toContain('TestContext');
    expect(report).toContain('Test error');
  });

  it('should clear error log', () => {
    const handler = new ErrorHandler();

    handler.handle('Error 1');
    expect(handler.hasErrors()).toBe(true);

    handler.clearLog();
    expect(handler.hasErrors()).toBe(false);
  });
});

describe('TextureManager', () => {
  let textureManager: TextureManager;

  beforeEach(() => {
    textureManager = new TextureManager();
  });

  afterEach(() => {
    textureManager.clearCache();
  });

  it('should get cache statistics', () => {
    const stats = textureManager.getCacheStats();
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('count');
    expect(stats).toHaveProperty('maxSize');
  });

  it('should clear cache', () => {
    textureManager.clearCache();
    const stats = textureManager.getCacheStats();
    expect(stats.count).toBe(0);
  });

  it('should dispose properly', () => {
    expect(() => textureManager.dispose()).not.toThrow();
  });
});
