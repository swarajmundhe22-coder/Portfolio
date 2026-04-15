/**
 * Region Clustering System
 * Handles proximity issues for densely packed regions like UK and France
 */

import type { RegionCode, RegionCluster, GlobeRegion } from './types';

export class RegionClusteringSystem {
  private clusters: Map<RegionCode, RegionCluster> = new Map();
  private clusterRadius = 15; // degrees

  /**
   * Initialize clusters from region data
   */
  public initializeClusters(regions: GlobeRegion[]): void {
    this.clusters.clear();
    const regionMap = new Map(regions.map(r => [r.code, r]));

    // Identify proximity groups
    const visited = new Set<RegionCode>();

    regions.forEach(region => {
      if (visited.has(region.code)) return;

      const cluster = this.createCluster(region, regionMap, visited);
      if (cluster) {
        this.clusters.set(region.code, cluster);
      }
      visited.add(region.code);
    });
  }

  /**
   * Get cluster for a region
   */
  public getCluster(code: RegionCode): RegionCluster | undefined {
    return this.clusters.get(code);
  }

  /**
   * Get all clusters
   */
  public getAllClusters(): Map<RegionCode, RegionCluster> {
    return this.clusters;
  }

  /**
   * Check if region is in a cluster with multiple members
   */
  public isClusteredRegion(code: RegionCode): boolean {
    const cluster = this.clusters.get(code);
    return !!cluster && cluster.members.length > 1;
  }

  /**
   * Get cluster members
   */
  public getClusterMembers(code: RegionCode): RegionCode[] {
    const cluster = this.clusters.get(code);
    return cluster ? cluster.members : [code];
  }

  /**
   * Get cluster radius in degrees
   */
  public getClusterRadius(code: RegionCode): number {
    const cluster = this.clusters.get(code);
    return cluster ? cluster.radius : 0;
  }

  /**
   * Set cluster radius threshold
   */
  public setClusterRadius(radius: number): void {
    this.clusterRadius = Math.max(0, radius);
  }

  private createCluster(
    startRegion: GlobeRegion,
    regionMap: Map<RegionCode, GlobeRegion>,
    visited: Set<RegionCode>
  ): RegionCluster | undefined {
    const members: RegionCode[] = [startRegion.code];
    let totalLat = startRegion.lat;
    let totalLng = startRegion.lng;
    let maxRadius = 0;

    // Find nearby regions
    regionMap.forEach((region, code) => {
      if (code === startRegion.code || visited.has(code)) return;

      const distance = this.calculateDistance(startRegion.lat, startRegion.lng, region.lat, region.lng);

      if (distance <= this.clusterRadius) {
        members.push(code);
        totalLat += region.lat;
        totalLng += region.lng;
        maxRadius = Math.max(maxRadius, distance);
      }
    });

    // Only create cluster if multiple members
    if (members.length === 1) {
      return undefined;
    }

    const centerLat = totalLat / members.length;
    const centerLng = totalLng / members.length;

    return {
      primary: startRegion.code,
      members,
      centerLat,
      centerLng,
      radius: maxRadius
    };
  }

  /**
   * Calculate distance between two lat/lng points (simplified)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = Math.abs(lat2 - lat1);
    const dLng = Math.abs(lng2 - lng1);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  public dispose(): void {
    this.clusters.clear();
  }
}
