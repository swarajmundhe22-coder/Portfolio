/**
 * Advanced Hit Detection System
 * Refined raycasting with clustering and proximity resolution
 */

import * as THREE from 'three';
import type { RegionCode, HitResult, RegionCluster } from './types';

export class HitDetection {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private clusters: Map<RegionCode, RegionCluster>;
  private proximityThreshold = 15; // degrees
  private lastHitCode: RegionCode | null = null;

  constructor(clusters: Map<RegionCode, RegionCluster> = new Map()) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clusters = clusters;
    
    // Set raycaster precision parameters
    this.raycaster.params.Line!.threshold = 2;
  }

  /**
   * Perform hit detection on mouse position
   */
  public detectHit(
    event: MouseEvent,
    container: HTMLElement,
    camera: THREE.Camera,
    points: THREE.Mesh[],
    regionData: Map<THREE.Object3D, RegionCode>
  ): HitResult | null {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(points);

    if (intersects.length === 0) {
      return null;
    }

    // Get the closest hit
    const firstIntersect = intersects[0];
    const code = regionData.get(firstIntersect.object);

    if (!code) {
      return null;
    }

    // Calculate confidence based on distance and cluster membership
    const distance = firstIntersect.distance;
    const confidence = Math.max(0, 1 - (distance / 1000));

    // Check if part of cluster
    const cluster = this.clusters.get(code);
    const isClusteredRegion = !!cluster;

    return {
      code,
      distance,
      confidence,
      isClusteredRegion
    };
  }

  /**
   * Resolve proximity conflicts between nearby regions
   */
  public resolveProximityConflict(
    candidates: HitResult[],
    camera: THREE.Camera
  ): HitResult | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    // Sort by confidence (closest)
    candidates.sort((a, b) => b.confidence - a.confidence);

    // If clustered regions detected, check if zoom context can disambiguate
    const clusteredCandidates = candidates.filter(c => c.isClusteredRegion);
    if (clusteredCandidates.length > 0) {
      const cluster = this.clusters.get(candidates[0].code);
      if (cluster && cluster.members.length > 1) {
        // Apply zoom-based disambiguation
        const zoomLevel = camera.position.z;
        const shouldZoom = zoomLevel > 200;
        if (shouldZoom) {
          // Already zoomed, return best candidate
          return candidates[0];
        }
      }
    }

    return candidates[0];
  }

  /**
   * Get nearby regions within threshold
   */
  public getNearbyRegions(
    regionCode: RegionCode,
    allRegions: Map<RegionCode, { lat: number; lng: number }>,
    threshold: number = this.proximityThreshold
  ): RegionCode[] {
    const baseRegion = allRegions.get(regionCode);
    if (!baseRegion) return [];

    const nearby: RegionCode[] = [];

    allRegions.forEach((pos, code) => {
      if (code === regionCode) return;

      const distance = this.calculateGreatCircleDistance(
        baseRegion.lat,
        baseRegion.lng,
        pos.lat,
        pos.lng
      );

      if (distance <= threshold) {
        nearby.push(code);
      }
    });

    return nearby;
  }

  /**
   * Calculate great circle distance between two points on Earth
   */
  private calculateGreatCircleDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
  }

  /**
   * Update proximity threshold
   */
  public setProximityThreshold(threshold: number): void {
    this.proximityThreshold = Math.max(0, threshold);
  }

  /**
   * Update clusters used for hit detection
   */
  public updateClusters(clusters: Map<RegionCode, RegionCluster>): void {
    this.clusters = clusters;
  }

  /**
   * Get last hit region code
   */
  public getLastHitCode(): RegionCode | null {
    return this.lastHitCode;
  }

  /**
   * Set last hit region code
   */
  public setLastHitCode(code: RegionCode | null): void {
    this.lastHitCode = code;
  }

  public dispose(): void {
    // Cleanup
  }
}
