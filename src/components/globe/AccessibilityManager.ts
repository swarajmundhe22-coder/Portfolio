/**
 * Accessibility Utilities
 * WCAG 2.1 Level AA compliance for interactive globe
 */

import type { AccessibilityConfig, RegionCode, RegionCluster } from './types';

export class AccessibilityManager {
  private config: AccessibilityConfig;
  private ariaRegion: HTMLElement | null = null;
  private keyboardState: Map<string, boolean> = new Map();

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      ariaLabels: true,
      keyboardNavigation: true,
      highContrast: false,
      reduceMotion: this.prefersReducedMotion(),
      ...config
    };
  }

  /**
   * Setup accessibility features
   */
  public setup(container: HTMLElement): void {
    if (!this.config.ariaLabels) return;

    this.ariaRegion = container;
    this.ariaRegion.setAttribute('role', 'application');
    this.ariaRegion.setAttribute('aria-label', 'Interactive globe showing services availability');
    this.ariaRegion.setAttribute('tabindex', '0');

    if (this.config.keyboardNavigation) {
      this.setupKeyboardNavigation(container);
    }

    if (this.config.highContrast) {
      this.applyHighContrastMode(container);
    }

    if (this.config.reduceMotion) {
      container.style.setProperty('--reduce-motion', '1');
    }
  }

  /**
   * Announce region selection to screen readers
   */
  public announceRegionSelection(
    code: RegionCode,
    label: string,
    cluster?: RegionCluster
  ): void {
    if (!this.config.ariaLabels) return;

    const message = cluster?.members.length ? 
      `${label} cluster selected, contains ${cluster.members.length} regions` :
      `${label} selected`;

    this.announce(message);
  }

  /**
   * Announce region hover to screen readers
   */
  public announceRegionHover(
    code: RegionCode,
    label: string,
    metric?: number
  ): void {
    if (!this.config.ariaLabels) return;

    const message = metric !== undefined ?
      `${label} region, connectivity: ${metric}%` :
      `${label} region`;

    this.announce(message);
  }

  /**
   * Get keyboard navigation event handler
   */
  public getKeyboardHandler(
    regionCodes: RegionCode[],
    onRegionSelect: (code: RegionCode) => void
  ): (e: KeyboardEvent) => void {
    if (!this.config.keyboardNavigation) return () => {};

    let currentIndex = 0;

    return (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % regionCodes.length;
        onRegionSelect(regionCodes[currentIndex]);
      } else if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + regionCodes.length) % regionCodes.length;
        onRegionSelect(regionCodes[currentIndex]);
      } else if (e.key === 'Enter') {
        if (regionCodes[currentIndex]) {
          onRegionSelect(regionCodes[currentIndex]);
        }
      }
    };
  }

  /**
   * Check if reduce motion is preferred
   */
  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(container: HTMLElement): void {
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  /**
   * Apply high contrast styling
   */
  private applyHighContrastMode(container: HTMLElement): void {
    container.classList.add('high-contrast-mode');
  }

  /**
   * Announce message to screen readers
   */
  private announce(message: string): void {
    if (!this.ariaRegion) {
      this.ariaRegion = document.createElement('div');
      this.ariaRegion.setAttribute('role', 'status');
      this.ariaRegion.setAttribute('aria-live', 'polite');
      this.ariaRegion.style.position = 'absolute';
      this.ariaRegion.style.left = '-10000px';
      document.body.appendChild(this.ariaRegion);
    }

    this.ariaRegion.textContent = message;
  }

  /**
   * Get accessibility config
   */
  public getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable high contrast
   */
  public setHighContrast(enabled: boolean): void {
    this.config.highContrast = enabled;
  }

  /**
   * Is reduce motion enabled
   */
  public isReduceMotionEnabled(): boolean {
    return this.config.reduceMotion;
  }

  public dispose(): void {
    if (this.ariaRegion?.parentElement) {
      this.ariaRegion.parentElement.removeChild(this.ariaRegion);
    }
  }
}
