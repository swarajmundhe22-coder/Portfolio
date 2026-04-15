/**
 * Advanced Label Rendering System
 * Handles animated label rendering with collision avoidance and responsive sizing
 */

import type { RegionCode, GlobeRegion, RenderLabel } from './types';
import * as THREE from 'three';

interface LabelPreferenceItem {
  code: RegionCode;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number;
}

export class LabelRenderingSystem {
  private baseFontSize = 14;
  private minFontSize = 10;
  private maxFontSize = 24;
  private labelPadding = 8;
  private collisionMargin = 20;

  /**
   * Compute render labels with collision avoidance
   */
  public computeRenderLabels(
    points: THREE.Mesh[],
    regionData: GlobeRegion[],
    camera: THREE.Camera,
    container: HTMLElement,
    hoveredCode: RegionCode | null,
    earthMesh: THREE.Mesh
  ): RenderLabel[] {
    const width = container.clientWidth || 100;
    const height = container.clientHeight || 100;

    // First pass: compute all label positions
    const labelCandidates: LabelPreferenceItem[] = points.map((point, i) => {
      const region = regionData[i];
      const pos = point.position.clone();
      pos.applyMatrix4(earthMesh.matrixWorld);

      const distance = camera.position.distanceTo(pos);
      const isVisible = distance < camera.position.length() + 50;

      pos.project(camera);
      const screenX = (pos.x * 0.5 + 0.5) * width;
      const screenY = -(pos.y * 0.5 - 0.5) * height;

      const labelWidth = this.estimateLabelWidth(region.label);
      const labelHeight = this.baseFontSize + this.labelPadding * 2;
      const priority = hoveredCode === region.code ? 1000 : (1 - Math.abs(pos.z));

      return {
        code: region.code,
        x: screenX,
        y: screenY,
        width: labelWidth,
        height: labelHeight,
        priority
      };
    }).filter((_, i) => {
      const pos = points[i].position.clone();
      pos.applyMatrix4(earthMesh.matrixWorld);
      const distance = camera.position.distanceTo(pos);
      return distance < camera.position.length() + 50;
    });

    // Create region lookup map before processing
    const indexByCode = new Map(regionData.map(r => [r.code, r]));

    // Second pass: resolve collisions with priority
    labelCandidates.sort((a, b) => b.priority - a.priority);
    const placed = new Set<RegionCode>();
    const occupiedSpaces: Array<{ x: number; y: number; width: number; height: number }> = [];

    const renderLabels: RenderLabel[] = [];

    labelCandidates.forEach(candidate => {
      let label = candidate;
      let canPlace = !this.checkCollision(candidate, occupiedSpaces);

      // Try offset positions if collision detected
      if (!canPlace) {
        const offsets = [
          { x: 0, y: -30 }, // above
          { x: 30, y: 0 },  // right
          { x: 0, y: 30 },  // below
          { x: -30, y: 0 }  // left
        ];

        for (const offset of offsets) {
          const testLabel = {
            ...candidate,
            x: candidate.x + offset.x,
            y: candidate.y + offset.y
          };

          if (!this.checkCollision(testLabel, occupiedSpaces)) {
            label = testLabel;
            canPlace = true;
            break;
          }
        }
      }

      if (canPlace) {
        placed.add(candidate.code);
        occupiedSpaces.push({
          x: label.x - label.width / 2 - this.collisionMargin,
          y: label.y - label.height / 2 - this.collisionMargin,
          width: label.width + this.collisionMargin * 2,
          height: label.height + this.collisionMargin * 2
        });

        const region = indexByCode.get(candidate.code);
        if (region) {
          const fontSize = this.computeFontSize(camera.position.z);

          renderLabels.push({
            code: candidate.code,
            label: region.label,
            x: label.x,
            y: label.y,
            visible: true,
            scale: this.computeScale(camera.position.z, hoveredCode === candidate.code),
            depth: 0, // Will be updated by caller
            hovered: hoveredCode === candidate.code,
            textOpacity: hoveredCode === candidate.code ? 1 : 0.8,
            fontSize
          });
        }
      }
    });

    return renderLabels;
  }

  /**
   * Check if label collides with occupied spaces
   */
  private checkCollision(
    label: LabelPreferenceItem,
    occupiedSpaces: Array<{ x: number; y: number; width: number; height: number }>
  ): boolean {
    const labelRect = {
      x: label.x - label.width / 2,
      y: label.y - label.height / 2,
      width: label.width,
      height: label.height
    };

    return occupiedSpaces.some(space => this.rectsIntersect(labelRect, space));
  }

  /**
   * Check if two rectangles intersect
   */
  private rectsIntersect(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * Compute responsive font size based on zoom
   */
  private computeFontSize(zoomLevel: number): number {
    // Zoom level: 150 (close) to 250 (far)
    const normalized = (zoomLevel - 150) / (250 - 150);
    return this.baseFontSize + (this.maxFontSize - this.baseFontSize) * (1 - normalized);
  }

  /**
   * Compute label scale with hover effect
   */
  private computeScale(zoomLevel: number, hovered: boolean): number {
    const zoomScale = zoomLevel < 200 ? 1.1 : 1;
    const hoverScale = hovered ? 1.2 : 1;
    return zoomScale * hoverScale;
  }

  /**
   * Estimate label width for collision detection
   */
  private estimateLabelWidth(text: string): number {
    return text.length * 8 + this.labelPadding * 2;
  }

  public dispose(): void {
    // Cleanup
  }
}
