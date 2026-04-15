/**
 * Enhanced Three.js Globe Manager
 * Enterprise-grade 3D globe rendering with advanced features
 */

import * as THREE from 'three';
import { interpolateRgb } from 'd3-interpolate';
import { TextureManager } from './TextureManager';
import { HitDetection } from './HitDetection';
import { RegionClusteringSystem } from './RegionClusteringSystem';
import { LabelRenderingSystem } from './LabelRenderingSystem';
import { AccessibilityManager } from './AccessibilityManager';
import { ErrorHandler } from './ErrorHandler';
import type {
  RegionCode,
  GlobeRegion,
  PickCallback,
  ClickCallback,
  LabelsUpdateCallback,
  ErrorCallback,
  RenderLabel,
  TextureConfig,
  AccessibilityConfig,
  PerformanceMetrics
} from './types';

interface EnhancedGlobeOptions {
  textureConfig?: Partial<TextureConfig>;
  accessibilityConfig?: Partial<AccessibilityConfig>;
  performanceConfig?: {
    targetFPS?: number;
    maxPixelRatio?: number;
    usePostProcessing?: boolean;
  };
}

export class EnhancedThreeGlobeManager {
  // Three.js core
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private earthMesh: THREE.Mesh;
  private glowMesh: THREE.Mesh;
  private atmosphereMesh: THREE.Mesh;
  private points: THREE.Mesh[] = [];
  private pointData: GlobeRegion[] = [];

  // Systems
  private textureManager: TextureManager;
  private hitDetection: HitDetection;
  private clusteringSystem: RegionClusteringSystem;
  private labelRenderingSystem: LabelRenderingSystem;
  private accessibilityManager: AccessibilityManager;
  private errorHandler: ErrorHandler;

  // State
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private regionDataMap: Map<THREE.Object3D, RegionCode> = new Map();
  private hoveredCode: RegionCode | null = null;
  private selectedCode: RegionCode | null = null;

  // Animation
  private animationId = 0;
  private targetZoom = 250;
  private currentZoom = 250;
  private baseRotationSpeed = 0.0003;
  private rotationPausedUntil = 0;
  private isInitialized = false;

  // Performance monitoring
  private frameCount = 0;
  private lastFPSCheck = 0;
  private currentFPS = 60;
  private performanceMetrics: PerformanceMetrics = {
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    drawCalls: 0
  };

  // Callbacks
  private onPick: PickCallback;
  private onClick: ClickCallback;
  private onLabelsUpdate: LabelsUpdateCallback;
  private onError?: ErrorCallback;

  // Options
  private options: EnhancedGlobeOptions;

  constructor(
    container: HTMLElement,
    onPick: PickCallback,
    onClick: ClickCallback,
    onLabelsUpdate: LabelsUpdateCallback,
    options: EnhancedGlobeOptions = {},
    onError?: ErrorCallback
  ) {
    this.container = container;
    this.onPick = onPick;
    this.onClick = onClick;
    this.onLabelsUpdate = onLabelsUpdate;
    this.onError = onError;
    this.options = options;

    // Initialize systems
    this.textureManager = new TextureManager();
    this.errorHandler = new ErrorHandler(onError);
    this.accessibilityManager = new AccessibilityManager(options.accessibilityConfig);
    this.clusteringSystem = new RegionClusteringSystem();
    this.hitDetection = new HitDetection(this.clusteringSystem.getAllClusters());
    this.labelRenderingSystem = new LabelRenderingSystem();

    try {
      this.initializeRenderer();
      // Initialize scene asynchronously
      this.initializeScene()
        .then(() => {
          this.isInitialized = true;
          this.initializeAccessibility();
          this.setupEventListeners();
          // If we have pending data, render it now
          if (this.pointData.length > 0) {
            this.renderPointData();
          }
        })
        .catch(error => {
          this.errorHandler.handle(error as Error, 'Scene Initialization');
        });
      // Start animation loop immediately - it will wait for initialization
      this.animate();
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Initialization');
      throw error;
    }
  }

  /**
   * Initialize WebGL renderer
   */
  private initializeRenderer(): void {
    const width = this.container.clientWidth || 100;
    const height = this.container.clientHeight || 100;

    // Create a fresh canvas element to avoid context conflicts
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance',
        stencil: true,
        depth: true
      });
    } catch (error) {
      // Fallback without explicit canvas
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance'
      });
    }

    const maxPixelRatio = this.options.performanceConfig?.maxPixelRatio ?? 2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMappingExposure = 1;

    // Clear container and add renderer
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize 3D scene
   */
  private async initializeScene(): Promise<void> {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 400, 1000);

    const width = this.container.clientWidth || 100;
    const height = this.container.clientHeight || 100;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.z = this.currentZoom;

    // Enhanced lighting setup
    this.setupLighting();

    // Load and create Earth sphere
    await this.createEarthSphere();

    // Create atmospheric effects
    this.createAtmosphere();

    this.scene.add(this.earthMesh);
    this.scene.add(this.glowMesh);
    this.scene.add(this.atmosphereMesh);
  }

  /**
   * Setup advanced lighting for realism
   */
  private setupLighting(): void {
    // Ambient light - increased for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Main directional light (simulating sun) - enhanced brightness
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.8);
    dirLight.position.set(100, 50, 150);
    dirLight.target.position.set(0, 0, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Secondary fill light - increased intensity
    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.9);
    fillLight.position.set(-50, -50, -100);
    this.scene.add(fillLight);

    // Hemisphere light for natural appearance - increased intensity
    const hemiLight = new THREE.HemisphereLight(0xaaddff, 0x333333, 0.6);
    this.scene.add(hemiLight);
  }

  /**
   * Create high-fidelity Earth sphere
   */
  private async createEarthSphere(): Promise<void> {
    try {
      const textures = await this.textureManager.loadGlobeTextures(
        this.options.textureConfig || {}
      );

      const geometry = new THREE.SphereGeometry(100, 128, 128);
      const material = new THREE.MeshPhongMaterial({
        color: 0x2a5a7a,
        map: textures.earthTexture,
        bumpMap: textures.bumpMap,
        bumpScale: 3.5,
        specularMap: textures.specularMap,
        specular: new THREE.Color(0x555555),
        shininess: 35,
        emissive: new THREE.Color(0x334455),
        flatShading: false
      });

      this.earthMesh = new THREE.Mesh(geometry, material);
      this.earthMesh.castShadow = true;
      this.earthMesh.receiveShadow = true;
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Earth Sphere Creation');
      // Fallback to simple sphere
      const geometry = new THREE.SphereGeometry(100, 64, 64);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x2a5a7a,
        emissive: 0x334455,
        shininess: 35
      });
      this.earthMesh = new THREE.Mesh(geometry, material);
    }
  }

  /**
   * Create atmospheric glow effects
   */
  private createAtmosphere(): void {
    // Glow layer - enhanced brightness
    const glowGeometry = new THREE.SphereGeometry(108, 64, 64);
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0x5599ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      emissive: new THREE.Color(0x3366ff),
      emissiveIntensity: 0.6
    });
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);

    // Atmosphere with gradient - enhanced visibility
    const atmosphereGeometry = new THREE.SphereGeometry(110, 32, 32);
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4477ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      wireframe: false
    });
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  }

  /**
   * Initialize accessibility features
   */
  private initializeAccessibility(): void {
    this.accessibilityManager.setup(this.container);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('click', this.onMouseClick.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));
  }

  /**
   * Update globe with region data
   */
  public updateData(data: GlobeRegion[]): void {
    try {
      this.pointData = data;
      this.clusteringSystem.initializeClusters(data);
      this.hitDetection.updateClusters(this.clusteringSystem.getAllClusters());

      // Skip rendering if not initialized yet
      if (!this.isInitialized) {
        return;
      }

      this.renderPointData();
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Update Data');
    }
  }

  /**
   * Render point data on the globe
   */
  private renderPointData(): void {
    // Clear existing points
    this.points.forEach(p => this.earthMesh.remove(p));
    this.points = [];
    this.regionDataMap.clear();

    // Create enhanced point meshes with glow effect
    this.pointData.forEach(region => {
      // Main point
      const geometry = new THREE.SphereGeometry(3.5, 32, 32);
      const color = interpolateRgb('#0f1e3f', '#5ca6ff')(region.value / 100);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.5,
        shininess: 120,
        wireframe: false
      });
      const mesh = new THREE.Mesh(geometry, material);

      const pos = this.latLngToVector3(region.lat, region.lng, 100);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.earthMesh.add(mesh);
      this.points.push(mesh);
      this.regionDataMap.set(mesh, region.code);

      // Add glow halo effect
      const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
      const glowMaterial = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.2,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(pos);
      this.earthMesh.add(glowMesh);

      // Add subtle pulsing animation
      const animate = () => {
        const time = Date.now() * 0.0005;
        const pulse = Math.sin(time + region.value) * 0.3 + 0.7;
        glowMaterial.opacity = 0.2 * pulse;
        glowMesh.scale.setScalar(1 + Math.sin(time) * 0.1);
      };
      this.scene.addEventListener('update', animate as any);
    });
  }

  /**
   * Convert lat/lng to 3D position
   */
  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  /**
   * Mouse move handler
   */
  private onMouseMove(e: MouseEvent): void {
    try {
      const hit = this.hitDetection.detectHit(
        e,
        this.container,
        this.camera,
        this.points,
        this.regionDataMap
      );

      if (hit) {
        const cluster = this.clusteringSystem.getCluster(hit.code);
        if (this.hoveredCode !== hit.code) {
          this.hoveredCode = hit.code;
          this.onPick(hit.code, cluster);
          this.accessibilityManager.announceRegionHover(
            hit.code,
            this.pointData.find(r => r.code === hit.code)?.label || hit.code,
            this.pointData.find(r => r.code === hit.code)?.value
          );

          // Zoom on hover for clustered regions
          if (this.clusteringSystem.isClusteredRegion(hit.code)) {
            this.targetZoom = 140;
          } else {
            this.targetZoom = 220;
          }

          this.rotationPausedUntil = Date.now() + 500;
        }
      } else {
        if (this.hoveredCode !== null) {
          this.hoveredCode = null;
          this.onPick(null);
          this.targetZoom = 250;
        }
      }
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Mouse Move');
    }
  }

  /**
   * Mouse click handler
   */
  private onMouseClick(): void {
    try {
      if (this.hoveredCode) {
        this.selectedCode = this.hoveredCode;
        const cluster = this.clusteringSystem.getCluster(this.hoveredCode);
        this.onClick(this.hoveredCode, cluster);
        this.accessibilityManager.announceRegionSelection(
          this.hoveredCode,
          this.pointData.find(r => r.code === this.hoveredCode)?.label || this.hoveredCode,
          cluster
        );
      }
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Mouse Click');
    }
  }

  /**
   * Resize handler
   */
  private onResize(): void {
    try {
      const width = this.container.clientWidth || 100;
      const height = this.container.clientHeight || 100;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Resize');
    }
  }

  /**
   * Update render labels with collision avoidance
   */
  private updateLabels(): void {
    try {
      const labels = this.labelRenderingSystem.computeRenderLabels(
        this.points,
        this.pointData,
        this.camera,
        this.container,
        this.hoveredCode,
        this.earthMesh
      );

      this.onLabelsUpdate(labels);
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Update Labels');
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    try {
      this.animationId = requestAnimationFrame(this.animate);

      // Skip rendering until scene is initialized
      if (!this.isInitialized) {
        return;
      }

      const startTime = performance.now();

      // Smooth zoom interpolation
      this.currentZoom += (this.targetZoom - this.currentZoom) * 0.08;
      this.camera.position.z = this.currentZoom;

      // Rotation with pause on interaction
      if (Date.now() > this.rotationPausedUntil) {
        this.earthMesh.rotation.y += this.baseRotationSpeed;
      }

      this.updateLabels();
      this.renderer.render(this.scene, this.camera);

      // Performance monitoring
      const renderTime = performance.now() - startTime;
      this.performanceMetrics.renderTime = renderTime;
      this.frameCount++;

      if (Date.now() - this.lastFPSCheck > 1000) {
        this.currentFPS = this.frameCount;
        this.performanceMetrics.fps = this.currentFPS;
        this.frameCount = 0;
        this.lastFPSCheck = Date.now();
      }
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Animation Loop');
    }
  };

  /**
   * Get hovered region code
   */
  public getHoveredCode(): RegionCode | null {
    return this.hoveredCode;
  }

  /**
   * Get selected region code
   */
  public getSelectedCode(): RegionCode | null {
    return this.selectedCode;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get error log
   */
  public getErrorLog(): Array<{ timestamp: Date; error: Error; context?: string }> {
    return this.errorHandler.getLog();
  }

  /**
   * Cleanup and dispose
   */
  public dispose(): void {
    try {
      cancelAnimationFrame(this.animationId);
      this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
      this.container.removeEventListener('click', this.onMouseClick.bind(this));
      window.removeEventListener('resize', this.onResize.bind(this));

      this.textureManager.dispose();
      this.clusteringSystem.dispose();
      this.labelRenderingSystem.dispose();
      this.hitDetection.dispose();
      this.accessibilityManager.dispose();

      this.points.forEach(p => p.geometry.dispose());
      (this.earthMesh.material as THREE.Material).dispose();
      this.earthMesh.geometry.dispose();

      if (this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }

      this.renderer.dispose();
    } catch (error) {
      this.errorHandler.handle(error as Error, 'Dispose');
    }
  }
}

// Export for backward compatibility
export { EnhancedThreeGlobeManager as ThreeGlobeManager };
