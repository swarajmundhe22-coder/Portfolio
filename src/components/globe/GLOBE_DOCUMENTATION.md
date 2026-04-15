# Interactive Globe Component Documentation

## Overview

The Enhanced Interactive Globe Component is an enterprise-grade 3D visualization system built with Three.js and React. It provides a high-fidelity, interactive globe displaying regional services availability with advanced features including click routing, proximity clustering, accessibility compliance, and performance optimization.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Installation](#installation)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Advanced Configuration](#advanced-configuration)
7. [Performance](#performance)
8. [Accessibility](#accessibility)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## Architecture

### System Components

The globe system is built with a modular architecture:

```
GlobeWidget (React Component)
├── EnhancedThreeGlobeManager (Core 3D Engine)
│   ├── TextureManager (Asset Loading & Caching)
│   ├── HitDetection (Raycasting & Proximity)
│   ├── RegionClusteringSystem (UK/France Disambiguation)
│   ├── LabelRenderingSystem (Text Rendering & Collision)
│   ├── AccessibilityManager (WCAG 2.1 Compliance)
│   └── ErrorHandler (Error Logging & Management)
└── React State Management
    ├── Labels (Position & Animation State)
    ├── Hover State
    └── Navigation State
```

### Data Flow

```
User Interaction
  ↓
HitDetection.detectHit()
  ↓
RegionClusteringSystem (Resolve Proximity)
  ↓
AccessibilityManager (Announce Selection)
  ↓
Navigation Transition (300ms)
  ↓
React Router Navigation
```

---

## Features

### 1. **High-Fidelity 3D Rendering**
- Realistic Earth textures with bump mapping
- Multiple light sources (sun simulation, fill light, hemisphere light)
- Atmospheric glow effects
- Real-time shadow rendering
- Anti-aliased geometry (128x128 sphere segments)

### 2. **Advanced Hit Detection**
- Refined raycasting with configurable precision
- Great circle distance calculations
- Proximity conflict resolution
- Clustering for densely packed regions
- Confidence scoring for hit results

### 3. **Region Clustering**
- Automatic detection of nearby regions
- Configurable proximity threshold (default: 15°)
- Zoom-on-hover for clustered regions
- Smart member resolution

### 4. **Label Management**
- Collision avoidance algorithm
- Responsive font scaling based on zoom level
- Animated reveal effects
- Smart positioning with offset calculation
- High opacity for hovered states

### 5. **Route Navigation**
- Smooth 300ms transitions
- Loading indicator feedback
- Route state preservation (sourceRegion, clusterInfo)
- Clean URL routing to `/work/{regionCode}`

### 6. **Accessibility (WCAG 2.1 Level AA)**
- Screen reader support with ARIA labels
- Keyboard navigation (Arrow keys, Enter)
- High contrast mode
- Reduced motion support
- Semantic HTML structure

### 7. **Texture Management**
- Asynchronous texture loading
- LRU cache eviction
- Memory-efficient management (50MB default)
- Fallback rendering on load failure

### 8. **Performance Optimization**
- Vertical sync (VSync) enabled rendering
- Configurable pixel ratio (2x max)
- Performance metrics tracking (FPS, render time)
- Frame rate monitoring
- Efficient update cycles

### 9. **Error Handling**
- Comprehensive error logging
- Error context tracking
- Graceful degradation
- User-friendly error callbacks

---

## Installation

### Prerequisites
- React 16.8+ (hooks support)
- Three.js 0.137+
- D3-interpolate 2.0+

### Setup

```bash
npm install three d3-interpolate
```

### File Structure
```
src/components/
├── GlobeWidget.tsx (React Component)
└── globe/
    ├── types.ts (Type Definitions)
    ├── ThreeGlobeManager.ts (Backward Compatibility)
    ├── EnhancedThreeGlobeManager.ts (Core Implementation)
    ├── TextureManager.ts (Asset Management)
    ├── HitDetection.ts (Raycasting)
    ├── RegionClusteringSystem.ts (Clustering)
    ├── LabelRenderingSystem.ts (Label Management)
    ├── AccessibilityManager.ts (Accessibility)
    └── ErrorHandler.ts (Error Management)
```

---

## API Reference

### GlobeWidget Component

```typescript
interface GlobeWidgetProps {
  className?: string;
  visualRegressionMode?: boolean;
}

<GlobeWidget 
  className="globe-container"
  visualRegressionMode={false}
/>
```

**Props:**
- `className` - Additional CSS classes for styling
- `visualRegressionMode` - Disable metrics fetching for testing

### EnhancedThreeGlobeManager

```typescript
const manager = new EnhancedThreeGlobeManager(
  container: HTMLElement,
  onPick: (code: RegionCode, cluster?: RegionCluster) => void,
  onClick: (code: RegionCode, cluster?: RegionCluster) => void,
  onLabelsUpdate: (labels: RenderLabel[]) => void,
  options?: EnhancedGlobeOptions,
  onError?: (error: Error, context?: string) => void
);
```

**Methods:**
- `updateData(data: GlobeRegion[])` - Update globe data
- `getHoveredCode(): RegionCode | null` - Get current hover state
- `getSelectedCode(): RegionCode | null` - Get selected region
- `getPerformanceMetrics(): PerformanceMetrics` - Get FPS and render metrics
- `getErrorLog()` - Get error history
- `dispose()` - Cleanup resources

### Types

```typescript
type RegionCode = 'GBR' | 'IND' | 'USA' | 'JPN' | 'FRA';

interface GlobeRegion {
  code: RegionCode;
  label: string;
  lat: number;
  lng: number;
  value: number;
  description?: string;
}

interface RenderLabel {
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

interface RegionCluster {
  primary: RegionCode;
  members: RegionCode[];
  centerLat: number;
  centerLng: number;
  radius: number;
}

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage: number;
  drawCalls: number;
}
```

---

## Usage Examples

### Basic Implementation

```typescript
import GlobeWidget from '@/components/GlobeWidget';

export default function Home() {
  return (
    <div className="w-full h-screen">
      <GlobeWidget className="globe-container" />
    </div>
  );
}
```

### With Custom Configuration

```typescript
import { EnhancedThreeGlobeManager } from '@/components/globe/EnhancedThreeGlobeManager';

const container = document.getElementById('globe');

const manager = new EnhancedThreeGlobeManager(
  container,
  (code, cluster) => {
    console.log(`Hovered: ${code}`);
    if (cluster) {
      console.log(`Cluster members: ${cluster.members.join(', ')}`);
    }
  },
  (code, cluster) => {
    console.log(`Clicked: ${code}`);
    window.location.href = `/work/${code.toLowerCase()}`;
  },
  (labels) => {
    console.log(`Rendered ${labels.length} labels`);
  },
  {
    textureConfig: {
      earthTexture: 'https://custom-cdn.com/earth.jpg',
      bumpMap: 'https://custom-cdn.com/bump.jpg'
    },
    accessibilityConfig: {
      ariaLabels: true,
      keyboardNavigation: true,
      highContrast: false,
      reduceMotion: false
    },
    performanceConfig: {
      targetFPS: 60,
      maxPixelRatio: 2
    }
  }
);

// Update with data
const data = [
  {
    code: 'GBR',
    label: 'United Kingdom',
    lat: 54.0,
    lng: -2.0,
    value: 62,
    description: 'Primary services hub'
  },
  // ... more regions
];

manager.updateData(data);

// Monitor performance
setInterval(() => {
  const metrics = manager.getPerformanceMetrics();
  console.log(`FPS: ${metrics.fps}, Render: ${metrics.renderTime}ms`);
}, 1000);

// Cleanup
window.addEventListener('unload', () => manager.dispose());
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
    console.error(`Error in ${context}:`, error);
    // Send to error tracking service
    logErrorToSentry(error, { context });
    // Display user-friendly message
    showToast('An error occurred while rendering the globe');
  }
);
```

---

## Advanced Configuration

### Texture Configuration

```typescript
interface TextureConfig {
  earthTexture?: string;
  bumpMap?: string;
  specularMap?: string;
  cloudMap?: string;
  nocTexture?: string;
}

// Custom textures
const options = {
  textureConfig: {
    earthTexture: 'https://my-cdn.com/earth-texture.jpg',
    bumpMap: 'https://my-cdn.com/earth-bump.jpg',
    specularMap: 'https://my-cdn.com/earth-specular.jpg'
  }
};
```

### Accessibility Configuration

```typescript
interface AccessibilityConfig {
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
}

// Full accessibility support
const options = {
  accessibilityConfig: {
    ariaLabels: true,
    keyboardNavigation: true,
    highContrast: true,
    reduceMotion: true
  }
};
```

### Performance Configuration

```typescript
interface PerformanceConfig {
  targetFPS?: number;
  maxPixelRatio?: number;
  usePostProcessing?: boolean;
}

// High-performance mode
const options = {
  performanceConfig: {
    targetFPS: 60,
    maxPixelRatio: 2,
    usePostProcessing: true
  }
};
```

---

## Performance

### Optimization Strategies

1. **Texture Management**
   - LRU cache with 50MB limit
   - Automatic quality scaling
   - Lazy loading of textures

2. **Rendering**
   - High-performance WebGL context
   - Vertical sync enabled
   - Efficient geometry (128-segment spheres)
   - Shadow mapping at 2048x2048

3. **Update Cycles**
   - Efficient raycasting
   - Batch label updates
   - Smooth animation interpolation (0.08 easing)

### Monitoring Performance

```typescript
const metrics = manager.getPerformanceMetrics();

interface PerformanceMetrics {
  fps: number;              // Current FPS (throttled to target)
  renderTime: number;       // Time per frame (ms)
  memoryUsage: number;      // Estimated memory (bytes)
  drawCalls: number;        // WebGL draw calls
}
```

### Performance Targets
- **FPS**: 60 (compatible with 60Hz displays)
- **Render Time**: < 16ms per frame
- **Initial Load**: < 2s
- **Memory Usage**: < 100MB (with textures)

---

## Accessibility

### WCAG 2.1 Level AA Compliance

#### Screen Reader Support
```html
<div 
  role="application"
  aria-label="Interactive globe showing services availability by region"
  tabindex="0"
/>
```

#### Keyboard Navigation
- **Arrow Keys**: Cycle through regions
- **Enter**: Select current region
- **Tab**: Focus management

#### Color Contrast
- Label text: AAA contrast ratio (7:1+)
- Glowing region: Visible in both light and dark modes
- High contrast mode: Available for vision impairments

#### Reduced Motion
Automatically enabled when `prefers-reduced-motion: reduce` is set:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Testing Accessibility

```typescript
// Enable high contrast mode
accessibilityManager.setHighContrast(true);

// Check reduce motion preference
const reduceMotion = accessibilityManager.isReduceMotionEnabled();

// Get keyboard handler
const keyboardHandler = accessibilityManager.getKeyboardHandler(
  ['GBR', 'FRA', 'USA', 'JPN', 'IND'],
  (code) => console.log(`Selected ${code}`)
);
```

---

## Troubleshooting

### Issue: Globe Not Rendering

**Check:**
1. Container element is in DOM and has dimensions
2. WebGL support is available: `!!document.createElement('canvas').getContext('webgl')`
3. Textures loaded successfully (check network tab)

**Solution:**
```typescript
const isWebGLSupported = !!document.createElement('canvas').getContext('webgl');
if (!isWebGLSupported) {
  console.error('WebGL not supported');
}
```

### Issue: Low FPS / Performance Degradation

**Check:**
1. Reduce `maxPixelRatio` setting
2. Simplify texture resolution
3. Monitor draw calls with DevTools

**Solution:**
```typescript
const options = {
  performanceConfig: {
    maxPixelRatio: 1, // Use device pixel ratio 1x instead of 2x
  }
};
```

### Issue: Labels Overlapping

**Check:**
1. Container has correct dimensions
2. Zoom level appropriate for region density
3. Monitor label collision detection

**Solution:**
```typescript
// Adjust proximity threshold
clusteringSystem.setClusterRadius(10); // Closer clustering
```

### Issue: Texture Load Errors

**Check:**
1. CORS headers on texture server
2. Texture URLs are accessible
3. Network requests not timing out

**Solution:**
```typescript
const options = {
  textureConfig: {
    earthTexture: 'https://trusted-cdn.com/earth.jpg' // Use trusted CDN
  }
};
```

---

## Testing

### Unit Tests
```bash
npm test src/components/globe/Globe.test.ts
```

Includes tests for:
- Region clustering detection
- Hit detection accuracy
- Accessibility features
- Error handling

### Integration Tests
```bash
npm test src/components/GlobeWidget.test.tsx
```

Includes tests for:
- Click redirection flow
- Navigation state management
- Region data updates
- Error scenarios

### Visual Regression Tests
```bash
npm run test:visual
```

Includes tests for:
- Consistent rendering across frames
- Hover animations
- Label positioning
- Cross-browser compatibility

---

## Maintenance

### Regular Tasks

1. **Update Textures** (Monthly)
   - Check texture CDN availability
   - Monitor cache hit rates
   - Verify image quality

2. **Monitor Performance** (Weekly)
   - Track FPS metrics
   - Identify memory leaks
   - Analyze error logs

3. **Test Accessibility** (Monthly)
   - Screen reader validation
   - Keyboard navigation testing
   - High contrast mode verification

4. **Update Dependencies** (Quarterly)
   - Three.js updates
   - Security patches
   - Performance improvements

### Common Updates

**Add New Region:**
```typescript
const newRegion: GlobeRegion = {
  code: 'DEU',
  label: 'Germany',
  lat: 51.165691,
  lng: 10.451526,
  value: 85,
  description: 'Strong EU presence'
};

manager.updateData([...existingData, newRegion]);
```

**Update Region Data:**
```typescript
const updatedData = data.map(region =>
  region.code === 'GBR'
    ? { ...region, value: 70 }
    : region
);

manager.updateData(updatedData);
```

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Full | Slight rendering differences |
| Safari 14+ | ✅ Full | WebGL performance varies |
| Edge 90+ | ✅ Full | Chromium-based |
| IE 11 | ❌ Not Supported | No WebGL |

---

## License

This component is part of the portfolio project and follows the project's license terms.

---

## Support

For issues, questions, or contributions:
1. Check this documentation
2. Review the troubleshooting section
3. Check error logs with `manager.getErrorLog()`
4. Submit issue with error context
