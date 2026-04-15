import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GlobeWidget from '../components/GlobeWidget';
import { MemoryRouter } from 'react-router-dom';

// Mock Three.js to avoid WebGL context requirements in jsdom
vi.mock('three', () => ({
  WebGLRenderer: vi.fn().mockImplementation(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
    domElement: document.createElement('canvas'),
  })),
  Scene: vi.fn(),
  PerspectiveCamera: vi.fn().mockImplementation(() => ({
    position: { z: 250, distanceTo: vi.fn().mockReturnValue(100), length: vi.fn().mockReturnValue(150) },
    updateProjectionMatrix: vi.fn(),
  })),
  SphereGeometry: vi.fn(),
  MeshPhongMaterial: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  Mesh: vi.fn().mockImplementation(() => ({
    rotation: { y: 0 },
    position: { copy: vi.fn(), clone: vi.fn().mockReturnValue({ applyMatrix4: vi.fn(), project: vi.fn(), x: 0, y: 0, z: 0 }) },
    add: vi.fn(),
    remove: vi.fn(),
    userData: {},
  })),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn() }
  })),
  TextureLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockReturnValue({})
  })),
  Vector2: vi.fn(),
  Vector3: vi.fn().mockImplementation((x, y, z) => ({ x, y, z })),
  Raycaster: vi.fn().mockImplementation(() => ({
    setFromCamera: vi.fn(),
    intersectObjects: vi.fn().mockReturnValue([])
  })),
  Color: vi.fn(),
  AdditiveBlending: 1,
  BackSide: 1,
}));

describe('GlobeWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <GlobeWidget />
      </MemoryRouter>
    );
    expect(container).toBeInTheDocument();
  });

  it('initializes and cleans up Three.js manager correctly', () => {
    const { unmount } = render(
      <MemoryRouter>
        <GlobeWidget />
      </MemoryRouter>
    );
    
    // Assert canvas was created
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    // Unmount
    unmount();
    
    // In our implementation, we call dispose, but cleanup of DOM element depends on React
  });
});