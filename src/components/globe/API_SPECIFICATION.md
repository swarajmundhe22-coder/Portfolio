# Enhanced Globe Component - API Specification

## Core Manager API

### EnhancedThreeGlobeManager

Enterprise-grade Three.js globe manager with integrated systems for rendering, interaction, and accessibility.

```typescript
class EnhancedThreeGlobeManager {
  constructor(
    container: HTMLElement,
    onPick: PickCallback,
    onClick: ClickCallback,
    onLabelsUpdate: LabelsUpdateCallback,
    options?: EnhancedGlobeOptions,
    onError?: ErrorCallback
  )
  
  // Public Methods
  public updateData(data: GlobeRegion[]): void
  public getHoveredCode(): RegionCode | null
  public getSelectedCode(): RegionCode | null
  public getPerformanceMetrics(): PerformanceMetrics
  public getErrorLog(): Array<ErrorLogEntry>
  public dispose(): void
}
```

#### Constructor Parameters

- **container**: HTMLElement - DOM element to render into
- **onPick**: PickCallback - Called when region is hovered
- **onClick**: ClickCallback - Called when region is clicked
- **onLabelsUpdate**: LabelsUpdateCallback - Called with updated label positions each frame
- **options**: EnhancedGlobeOptions - Configuration object (optional)
- **onError**: ErrorCallback - Error handler callback (optional)

#### Methods

##### updateData(data: GlobeRegion[]): void
Updates the globe with new region data. Triggers re-clustering and re-rendering.

```typescript
manager.updateData([
  {
    code: 'GBR',
    label: 'United Kingdom',
    lat: 54.0,
    lng: -2.0,
    value: 62,
    description: 'Primary hub'
  }
]);
```

##### getHoveredCode(): RegionCode | null
Returns the currently hovered region code, or null if no region is hovered.

```typescript
const hovered = manager.getHoveredCode();
if (hovered) console.log(`Hovering over ${hovered}`);
```

##### getSelectedCode(): RegionCode | null
Returns the last clicked region code.

```typescript
const selected = manager.getSelectedCode();
```

##### getPerformanceMetrics(): PerformanceMetrics
Returns current performance metrics.

```typescript
const metrics = manager.getPerformanceMetrics();
console.log(`FPS: ${metrics.fps}, Render: ${metrics.renderTime}ms`);
```

Returns:
```typescript
{
  fps: number;              // Current frames per second
  renderTime: number;       // Time per frame in milliseconds
  memoryUsage: number;      // Estimated memory in bytes
  drawCalls: number;        // WebGL draw calls
}
```

##### getErrorLog(): Array<ErrorLogEntry>
Returns array of logged errors with timestamps and context.

```typescript
manager.getErrorLog().forEach(entry => {
  console.log(`[${entry.timestamp}] ${entry.context}: ${entry.error.message}`);
});
```

##### dispose(): void
Cleans up all resources and removes event listeners. Call before unmounting.

```typescript
useEffect(() => {
  return () => manager.dispose();
}, []);
```

---

## System APIs

### TextureManager

Handles asynchronous texture loading with LRU caching and memory management.

```typescript
class TextureManager {
  loadTexture(url: string): Promise<THREE.Texture>
  loadGlobeTextures(config: Partial<TextureConfig>): Promise<GlobeTextures>
  releaseTexture(url: string): void
  clearCache(): void
  getCacheStats(): { size: number; count: number; maxSize: number }
  dispose(): void
}
```

#### loadTexture(url: string): Promise<THREE.Texture>
Load a single texture from URL with caching.

```typescript
const texture = await textureManager.loadTexture('https://cdn.com/texture.jpg');
```

#### loadGlobeTextures(config: Partial<TextureConfig>): Promise
Load all globe-specific textures.

```typescript
const textures = await textureManager.loadGlobeTextures({
  earthTexture: 'https://custom-cdn.com/earth.jpg',
  bumpMap: 'https://custom-cdn.com/bump.jpg'
});
// Returns: { earthTexture, bumpMap?, specularMap?, cloudMap? }
```

#### getCacheStats(): CacheStats
Get current cache state.

```typescript
const stats = textureManager.getCacheStats();
console.log(`Cache: ${stats.size} bytes / ${stats.maxSize} (${stats.count} items)`);
```

---

### HitDetection

Advanced raycasting with proximity detection and clustering support.

```typescript
class HitDetection {
  detectHit(
    event: MouseEvent,
    container: HTMLElement,
    camera: THREE.Camera,
    points: THREE.Mesh[],
    regionData: Map<THREE.Object3D, RegionCode>
  ): HitResult | null
  
  resolveProximityConflict(
    candidates: HitResult[],
    camera: THREE.Camera
  ): HitResult | null
  
  getNearbyRegions(
    regionCode: RegionCode,
    allRegions: Map<RegionCode, LatLng>,
    threshold?: number
  ): RegionCode[]
  
  setProximityThreshold(threshold: number): void
  updateClusters(clusters: Map<RegionCode, RegionCluster>): void
  getLastHitCode(): RegionCode | null
  setLastHitCode(code: RegionCode | null): void
  dispose(): void
}
```

#### detectHit(...): HitResult | null
Perform hit detection on mouse position.

Returns:
```typescript
interface HitResult {
  code: RegionCode;
  distance: number;
  confidence: number;      // 0-1, higher = more confident
  isClusteredRegion: boolean;
}
```

#### getNearbyRegions(...): RegionCode[]
Get regions within proximity threshold.

```typescript
const nearby = hitDetection.getNearbyRegions('GBR', allRegions, 20);
// Returns: ['FRA', 'DEU'] (if within 20 degrees)
```

---

### RegionClusteringSystem

Automatic clustering for resolving proximity issues.

```typescript
class RegionClusteringSystem {
  initializeClusters(regions: GlobeRegion[]): void
  getCluster(code: RegionCode): RegionCluster | undefined
  getAllClusters(): Map<RegionCode, RegionCluster>
  isClusteredRegion(code: RegionCode): boolean
  getClusterMembers(code: RegionCode): RegionCode[]
  getClusterRadius(code: RegionCode): number
  setClusterRadius(radius: number): void
  dispose(): void
}
```

#### Data Structures

```typescript
interface RegionCluster {
  primary: RegionCode;        // Primary region in cluster
  members: RegionCode[];      // All region codes
  centerLat: number;          // Cluster center latitude
  centerLng: number;          // Cluster center longitude
  radius: number;             // Cluster radius in degrees
}
```

#### setClusterRadius(radius: number): void
Adjust clustering threshold (default: 15°).

```typescript
clusteringSystem.setClusterRadius(10);  // Tighter clustering
clusteringSystem.setClusterRadius(20);  // Looser clustering
```

---

### LabelRenderingSystem

Smart label positioning with collision avoidance.

```typescript
class LabelRenderingSystem {
  computeRenderLabels(
    points: THREE.Mesh[],
    regionData: GlobeRegion[],
    camera: THREE.Camera,
    container: HTMLElement,
    hoveredCode: RegionCode | null,
    earthMesh: THREE.Mesh
  ): RenderLabel[]
  
  dispose(): void
}
```

#### Data Structures

```typescript
interface RenderLabel {
  code: RegionCode;
  label: string;
  x: number;              // Screen X position
  y: number;              // Screen Y position
  visible: boolean;
  scale: number;          // Visual scale factor
  depth: number;          // Z-depth for sorting
  hovered: boolean;
  textOpacity: number;    // 0-1
  fontSize: number;       // Responsive font size (px)
}
```

---

### AccessibilityManager

WCAG 2.1 compliance and keyboard navigation.

```typescript
class AccessibilityManager {
  setup(container: HTMLElement): void
  announceRegionSelection(code: RegionCode, label: string, cluster?: RegionCluster): void
  announceRegionHover(code: RegionCode, label: string, metric?: number): void
  getKeyboardHandler(
    regionCodes: RegionCode[],
    onRegionSelect: (code: RegionCode) => void
  ): (e: KeyboardEvent) => void
  setHighContrast(enabled: boolean): void
  isReduceMotionEnabled(): boolean
  getConfig(): AccessibilityConfig
  dispose(): void
}
```

#### Keyboard Events Handled
- **Arrow Left**: Previous region
- **Arrow Right**: Next region
- **Enter**: Select and navigate

#### announceRegionSelection(...)
Announce region selection to screen readers.

```typescript
accessibilityManager.announceRegionSelection(
  'GBR',
  'United Kingdom',
  cluster
);
// Announces: "United Kingdom selected" or "United Kingdom cluster selected, contains 3 regions"
```

---

### ErrorHandler

Comprehensive error logging and management.

```typescript
class ErrorHandler {
  handle(error: Error | string, context?: string): void
  getLog(): Array<ErrorLogEntry>
  clearLog(): void
  getLastError(): ErrorLogEntry | null
  hasErrors(): boolean
  exportReport(): string
  dispose(): void
}
```

#### Data Structures

```typescript
interface ErrorLogEntry {
  timestamp: Date;
  error: Error;
  context?: string;
}
```

#### exportReport(): string
Export formatted error report.

```typescript
const report = errorHandler.exportReport();
// Can be sent to error tracking service
sendToSentry(report);
```

---

## Type Definitions

```typescript
export type RegionCode = 'GBR' | 'IND' | 'USA' | 'JPN' | 'FRA';

export interface GlobeRegion {
  code: RegionCode;
  label: string;
  lat: number;
  lng: number;
  value: number;
  description?: string;
}

export interface TextureConfig {
  earthTexture?: string;
  bumpMap?: string;
  specularMap?: string;
  cloudMap?: string;
  nocTexture?: string;
}

export interface AccessibilityConfig {
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface PerformanceConfig {
  targetFPS?: number;
  maxPixelRatio?: number;
  usePostProcessing?: boolean;
}

export interface EnhancedGlobeOptions {
  textureConfig?: Partial<TextureConfig>;
  accessibilityConfig?: Partial<AccessibilityConfig>;
  performanceConfig?: PerformanceConfig;
}

export type PickCallback = (code: RegionCode | null, cluster?: RegionCluster) => void;
export type ClickCallback = (code: RegionCode, cluster?: RegionCluster) => void;
export type LabelsUpdateCallback = (labels: RenderLabel[]) => void;
export type ErrorCallback = (error: Error, context?: string) => void;
```

---

## React Component API

### GlobeWidget

```typescript
interface GlobeWidgetProps {
  className?: string;
  visualRegressionMode?: boolean;
}

<GlobeWidget 
  className="custom-class"
  visualRegressionMode={false}
/>
```

#### Feature: Route Transition
- 300ms opacity transition on navigation
- Loading spinner displayed during transition
- Route state includes sourceRegion and clusterInfo
- Smooth navigation via React Router

#### Feature: Dynamic Labels
- Real-time position updates
- Collision-free rendering
- Hover effects
- Responsive scaling

---

## Callback Signatures

### PickCallback
```typescript
(code: RegionCode | null, cluster?: RegionCluster) => void
```
Called when region hover state changes.

### ClickCallback
```typescript
(code: RegionCode, cluster?: RegionCluster) => void
```
Called when region is clicked.

### LabelsUpdateCallback
```typescript
(labels: RenderLabel[]) => void
```
Called every frame with updated label positions.

### ErrorCallback
```typescript
(error: Error, context?: string) => void
```
Called when an error occurs with descriptive context.

---

## Configuration Examples

### Example 1: High-Performance Configuration
```typescript
{
  performanceConfig: {
    targetFPS: 60,
    maxPixelRatio: 1,
    usePostProcessing: false
  }
}
```

### Example 2: Accessibility-First Configuration
```typescript
{
  accessibilityConfig: {
    ariaLabels: true,
    keyboardNavigation: true,
    highContrast: true,
    reduceMotion: true
  }
}
```

### Example 3: Custom Textures Configuration
```typescript
{
  textureConfig: {
    earthTexture: 'https://my-cdn.com/earth-high-res.jpg',
    bumpMap: 'https://my-cdn.com/earth-bump-hd.jpg',
    specularMap: 'https://my-cdn.com/earth-specular.jpg'
  }
}
```

---

## Best Practices

### Memory Management
```typescript
// Always dispose when done
useEffect(() => {
  return () => manager.dispose();
}, []);
```

### Error Handling
```typescript
const manager = new EnhancedThreeGlobeManager(
  container,
  onPick,
  onClick,
  onLabelsUpdate,
  {},
  (error, context) => {
    logToMonitoring(error, context);
    showUserError('Globe rendering issue');
  }
);
```

### Performance Monitoring
```typescript
setInterval(() => {
  const metrics = manager.getPerformanceMetrics();
  if (metrics.fps < 50) {
    console.warn('Performance degradation detected');
  }
}, 5000);
```

### Accessibility Testing
```typescript
// Test keyboard navigation
container.focus();
fireEvent.keyDown(container, { key: 'ArrowRight' });

// Test with screen reader
container.getAttribute('aria-label');
```
