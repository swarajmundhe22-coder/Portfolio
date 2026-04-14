import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  buildLayerAttributes,
  galaxyLayerVelocities,
  generatePresetPositions,
  kelvinToRgb,
  totalGalaxyParticleCount,
} from './galaxyPresets';
import type { GalaxyPresetName } from './galaxyPresets';
import { useDebouncedResizeObserver } from '../shared/useDebouncedResizeObserver';
import { createProgram, getWebGL2Context, supportsWebGL2 } from '../shared/webglGuards';
import { isTelemetryOptIn, reportRuntimeIssue, setTelemetryOptIn } from '../shared/runtimeTelemetry';

interface GalaxyRenderer {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  currentBuffer: WebGLBuffer;
  targetBuffer: WebGLBuffer;
  layerBuffer: WebGLBuffer;
  particleCount: number;
  uniforms: {
    transition: WebGLUniformLocation;
    timeMs: WebGLUniformLocation;
    zoom: WebGLUniformLocation;
    rotationVelocity: WebGLUniformLocation;
    brightness: WebGLUniformLocation;
    aspect: WebGLUniformLocation;
    temperatureColor: WebGLUniformLocation;
    parallax: WebGLUniformLocation;
    layerVisibility: WebGLUniformLocation;
  };
}

const transitionDurationMs = 280;

const galaxyVertexShaderSource = `#version 300 es
precision highp float;

in vec4 aCurrent;
in vec4 aTarget;
in vec4 aLayer;

uniform float uTransition;
uniform float uTimeMs;
uniform float uZoom;
uniform float uRotationVelocity;
uniform float uBrightness;
uniform float uAspect;
uniform float uParallax[5];
uniform float uLayerVisibility[5];

out vec3 vColorWeight;
out float vAlpha;

void main() {
  vec4 particle = mix(aCurrent, aTarget, uTransition);
  int layerIndex = int(aLayer.x + 0.5);

  float parallax = uParallax[layerIndex];
  float layerVisible = uLayerVisibility[layerIndex];

  float angularVelocity = radians(uRotationVelocity) * 0.001 * uTimeMs * parallax;
  mat2 rotationMatrix = mat2(
    cos(angularVelocity),
    -sin(angularVelocity),
    sin(angularVelocity),
    cos(angularVelocity)
  );

  vec2 rotated = rotationMatrix * particle.xy;
  float z = particle.z;

  float perspective = 1.0 / (1.0 + abs(z) * 0.55);
  vec2 projected = rotated * perspective * uZoom;
  projected.x /= max(0.1, uAspect);

  gl_Position = vec4(projected, clamp(z / 6.0, -1.0, 1.0), 1.0);
  gl_PointSize = max(1.0, particle.w * perspective * (1.0 + parallax * 0.25));

  float alphaDepth = clamp((1.0 / (1.0 + abs(z))) * (0.75 + parallax * 0.2), 0.05, 1.0);
  vAlpha = alphaDepth * layerVisible * uBrightness;
  vColorWeight = vec3(aLayer.y, aLayer.z, aLayer.w);
}`;

const galaxyFragmentShaderSource = `#version 300 es
precision highp float;

uniform vec3 uTemperatureColor;

in vec3 vColorWeight;
in float vAlpha;

out vec4 outColor;

void main() {
  vec2 centered = gl_PointCoord * 2.0 - 1.0;
  float distanceSq = dot(centered, centered);
  if (distanceSq > 1.0) {
    discard;
  }

  float softCore = exp(-distanceSq * 3.5);
  float twinkle = 0.88 + vColorWeight.z * 0.2;
  vec3 color = mix(uTemperatureColor, vec3(0.92, 0.95, 1.0), vColorWeight.y * 0.25);

  outColor = vec4(color * twinkle, softCore * vAlpha);
}`;

const initializeGalaxyRenderer = (
  canvas: HTMLCanvasElement,
  particleCount: number,
): GalaxyRenderer => {
  const gl = getWebGL2Context(canvas, {
    antialias: true,
    alpha: true,
    depth: true,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    throw new Error('WebGL2 context unavailable for galaxy simulation.');
  }

  const program = createProgram(gl, galaxyVertexShaderSource, galaxyFragmentShaderSource);

  const currentBuffer = gl.createBuffer();
  const targetBuffer = gl.createBuffer();
  const layerBuffer = gl.createBuffer();
  const vao = gl.createVertexArray();

  if (!currentBuffer || !targetBuffer || !layerBuffer || !vao) {
    throw new Error('Unable to allocate galaxy renderer buffers.');
  }

  const currentLocation = gl.getAttribLocation(program, 'aCurrent');
  const targetLocation = gl.getAttribLocation(program, 'aTarget');
  const layerLocation = gl.getAttribLocation(program, 'aLayer');

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, currentBuffer);
  gl.enableVertexAttribArray(currentLocation);
  gl.vertexAttribPointer(currentLocation, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(currentLocation, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer);
  gl.enableVertexAttribArray(targetLocation);
  gl.vertexAttribPointer(targetLocation, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(targetLocation, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, layerBuffer);
  gl.enableVertexAttribArray(layerLocation);
  gl.vertexAttribPointer(layerLocation, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(layerLocation, 1);

  gl.bindVertexArray(null);

  const transition = gl.getUniformLocation(program, 'uTransition');
  const timeMs = gl.getUniformLocation(program, 'uTimeMs');
  const zoom = gl.getUniformLocation(program, 'uZoom');
  const rotationVelocity = gl.getUniformLocation(program, 'uRotationVelocity');
  const brightness = gl.getUniformLocation(program, 'uBrightness');
  const aspect = gl.getUniformLocation(program, 'uAspect');
  const temperatureColor = gl.getUniformLocation(program, 'uTemperatureColor');
  const parallax = gl.getUniformLocation(program, 'uParallax');
  const layerVisibility = gl.getUniformLocation(program, 'uLayerVisibility');

  if (
    !transition ||
    !timeMs ||
    !zoom ||
    !rotationVelocity ||
    !brightness ||
    !aspect ||
    !temperatureColor ||
    !parallax ||
    !layerVisibility
  ) {
    throw new Error('Missing one or more galaxy uniform locations.');
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.01, 0.02, 0.06, 1);

  return {
    gl,
    program,
    vao,
    currentBuffer,
    targetBuffer,
    layerBuffer,
    particleCount,
    uniforms: {
      transition,
      timeMs,
      zoom,
      rotationVelocity,
      brightness,
      aspect,
      temperatureColor,
      parallax,
      layerVisibility,
    },
  };
};

const resizeGalaxyRenderer = (
  renderer: GalaxyRenderer,
  width: number,
  height: number,
  dpr: number,
): void => {
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  renderer.gl.canvas.width = pixelWidth;
  renderer.gl.canvas.height = pixelHeight;
  renderer.gl.viewport(0, 0, pixelWidth, pixelHeight);
};

const destroyGalaxyRenderer = (renderer: GalaxyRenderer): void => {
  const { gl } = renderer;

  gl.deleteBuffer(renderer.currentBuffer);
  gl.deleteBuffer(renderer.targetBuffer);
  gl.deleteBuffer(renderer.layerBuffer);
  gl.deleteVertexArray(renderer.vao);
  gl.deleteProgram(renderer.program);
};

const pushArrayToBuffer = (
  gl: WebGL2RenderingContext,
  buffer: WebGLBuffer,
  data: Float32Array,
): void => {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
};

const toQueryFloat = (params: URLSearchParams, key: string, fallback: number): number => {
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : fallback;
};

const applyUrlState = (
  preset: GalaxyPresetName,
  zoom: number,
  rotationVelocity: number,
  brightness: number,
  temperature: number,
): void => {
  const params = new URLSearchParams(window.location.search);
  params.set('galaxyPreset', preset);
  params.set('galaxyZoom', zoom.toFixed(2));
  params.set('galaxyRotation', rotationVelocity.toFixed(2));
  params.set('galaxyBrightness', brightness.toFixed(2));
  params.set('galaxyTemperature', String(Math.round(temperature)));

  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState({}, '', next);
};

const GalaxySimulationLab = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [preset, setPreset] = useState<GalaxyPresetName>('spiral');
  const [zoom, setZoom] = useState(1.1);
  const [rotationVelocity, setRotationVelocity] = useState(20);
  const [brightness, setBrightness] = useState(1);
  const [temperature, setTemperature] = useState(5800);
  const [fps, setFps] = useState(0);
  const [transitionMs, setTransitionMs] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [webXrSupported, setWebXrSupported] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(() => supportsWebGL2());

  const size = useDebouncedResizeObserver(containerRef, 110, 2);

  const rendererRef = useRef<GalaxyRenderer | null>(null);
  const currentPositionsRef = useRef<Float32Array>(generatePresetPositions('spiral'));
  const targetPositionsRef = useRef<Float32Array>(generatePresetPositions('spiral'));
  const layerAttributesRef = useRef<Float32Array>(buildLayerAttributes());
  const transitionStartedAtRef = useRef(0);

  const temperatureColor = useMemo(() => kelvinToRgb(temperature), [temperature]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const presetFromQuery = params.get('galaxyPreset');
    if (presetFromQuery === 'spiral' || presetFromQuery === 'elliptical' || presetFromQuery === 'starburst') {
      setPreset(presetFromQuery);
      currentPositionsRef.current = generatePresetPositions(presetFromQuery);
      targetPositionsRef.current = currentPositionsRef.current.slice();
    }

    setZoom(toQueryFloat(params, 'galaxyZoom', 1.1));
    setRotationVelocity(toQueryFloat(params, 'galaxyRotation', 20));
    setBrightness(toQueryFloat(params, 'galaxyBrightness', 1));
    setTemperature(toQueryFloat(params, 'galaxyTemperature', 5800));

    setTelemetryEnabled(isTelemetryOptIn());

    const hasWebXr = typeof navigator !== 'undefined' && 'xr' in navigator;
    setWebXrSupported(hasWebXr);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    applyUrlState(preset, zoom, rotationVelocity, brightness, temperature);
  }, [brightness, preset, rotationVelocity, temperature, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width <= 0 || size.height <= 0) {
      return;
    }

    let disposed = false;
    let frameId = 0;
    let lastTime = performance.now();
    let smoothFps = 60;

    const webglPathEnabled = supportsWebGL2();
    setWebglAvailable(webglPathEnabled);

    if (webglPathEnabled) {
      try {
        const renderer = initializeGalaxyRenderer(canvas, totalGalaxyParticleCount);
        rendererRef.current = renderer;
        resizeGalaxyRenderer(renderer, size.width, size.height, size.dpr);

        pushArrayToBuffer(renderer.gl, renderer.currentBuffer, currentPositionsRef.current);
        pushArrayToBuffer(renderer.gl, renderer.targetBuffer, targetPositionsRef.current);
        pushArrayToBuffer(renderer.gl, renderer.layerBuffer, layerAttributesRef.current);

        const onContextLoss = (event: Event): void => {
          event.preventDefault();
          void reportRuntimeIssue({
            lab: 'galaxy-field',
            category: 'webgl-context-loss',
            level: 'critical',
            message: 'WebGL context lost in Galaxy simulation.',
          });
        };

        canvas.addEventListener('webglcontextlost', onContextLoss, false);
        (canvas as HTMLCanvasElement & { __galaxyCleanup?: () => void }).__galaxyCleanup = () => {
          canvas.removeEventListener('webglcontextlost', onContextLoss, false);
        };
      } catch (error) {
        setWebglAvailable(false);
        const message = error instanceof Error ? error.message : 'Galaxy renderer initialization failed.';
        void reportRuntimeIssue({
          lab: 'galaxy-field',
          category: 'shader-compilation',
          level: 'error',
          message,
        });
      }
    }

    const drawFrame = (time: number): void => {
      if (disposed) {
        return;
      }

      const renderer = rendererRef.current;
      if (renderer) {
        const elapsed = Math.max(1, time - transitionStartedAtRef.current);
        const transition = clampNumber(elapsed / transitionDurationMs, 0, 1);

        const delta = Math.max(1, time - lastTime);
        lastTime = time;
        smoothFps = smoothFps * 0.92 + (1000 / delta) * 0.08;

        const layerVisibility = [1, 1, 1, 1, 1];
        if (zoom > 3.8) {
          layerVisibility[4] = 0;
        }
        if (zoom > 4.5) {
          layerVisibility[3] = 0;
        }

        renderer.gl.useProgram(renderer.program);
        renderer.gl.uniform1f(renderer.uniforms.transition, transition);
        renderer.gl.uniform1f(renderer.uniforms.timeMs, time);
        renderer.gl.uniform1f(renderer.uniforms.zoom, zoom);
        renderer.gl.uniform1f(renderer.uniforms.rotationVelocity, rotationVelocity);
        renderer.gl.uniform1f(renderer.uniforms.brightness, brightness);
        renderer.gl.uniform1f(renderer.uniforms.aspect, renderer.gl.canvas.width / Math.max(1, renderer.gl.canvas.height));
        renderer.gl.uniform3f(
          renderer.uniforms.temperatureColor,
          temperatureColor[0],
          temperatureColor[1],
          temperatureColor[2],
        );
        renderer.gl.uniform1fv(renderer.uniforms.parallax, new Float32Array(galaxyLayerVelocities));
        renderer.gl.uniform1fv(renderer.uniforms.layerVisibility, new Float32Array(layerVisibility));

        renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT | renderer.gl.DEPTH_BUFFER_BIT);
        renderer.gl.bindVertexArray(renderer.vao);
        renderer.gl.drawArraysInstanced(renderer.gl.POINTS, 0, 1, renderer.particleCount);
        renderer.gl.bindVertexArray(null);

        setTransitionMs(elapsed);
        setFps(smoothFps);

        if (renderer.gl.getError() === renderer.gl.OUT_OF_MEMORY) {
          void reportRuntimeIssue({
            lab: 'galaxy-field',
            category: 'out-of-memory',
            level: 'critical',
            message: 'Galaxy simulation reported OUT_OF_MEMORY.',
          });
        }
      }

      frameId = window.requestAnimationFrame(drawFrame);
    };

    frameId = window.requestAnimationFrame(drawFrame);

    const onPointerLockChange = (): void => {
      const isLocked = document.pointerLockElement === canvas;
      setPointerLocked(isLocked);
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('pointerlockchange', onPointerLockChange);

      const cleanup = (canvas as HTMLCanvasElement & { __galaxyCleanup?: () => void }).__galaxyCleanup;
      cleanup?.();
      delete (canvas as HTMLCanvasElement & { __galaxyCleanup?: () => void }).__galaxyCleanup;

      const renderer = rendererRef.current;
      if (renderer) {
        destroyGalaxyRenderer(renderer);
        rendererRef.current = null;
      }
    };
  }, [brightness, rotationVelocity, size.dpr, size.height, size.width, temperatureColor, webglAvailable, zoom]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || size.width <= 0 || size.height <= 0) {
      return;
    }

    resizeGalaxyRenderer(renderer, size.width, size.height, size.dpr);
  }, [size.dpr, size.height, size.width]);

  const onPresetChange = (nextPreset: GalaxyPresetName): void => {
    setPreset(nextPreset);

    currentPositionsRef.current = targetPositionsRef.current.slice();
    targetPositionsRef.current = generatePresetPositions(nextPreset);

    transitionStartedAtRef.current = performance.now();

    const renderer = rendererRef.current;
    if (renderer) {
      pushArrayToBuffer(renderer.gl, renderer.currentBuffer, currentPositionsRef.current);
      pushArrayToBuffer(renderer.gl, renderer.targetBuffer, targetPositionsRef.current);
    }
  };

  const onToggleTelemetry = (event: ChangeEvent<HTMLInputElement>): void => {
    const enabled = event.target.checked;
    setTelemetryOptIn(enabled);
    setTelemetryEnabled(enabled);
  };

  const onEnterImmersiveMode = async (): Promise<void> => {
    const host = containerRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await host.requestFullscreen();
      }

      canvas.requestPointerLock();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Immersive mode failed.';
      void reportRuntimeIssue({
        lab: 'galaxy-field',
        category: 'runtime',
        level: 'warn',
        message,
      });
    }
  };

  const onRequestWebXrPreview = async (): Promise<void> => {
    if (!('xr' in navigator)) {
      return;
    }

    try {
      const xrNavigator = navigator as Navigator & {
        xr: {
          isSessionSupported: (mode: string) => Promise<boolean>;
        };
      };

      const supported = await xrNavigator.xr.isSessionSupported('immersive-vr');
      if (!supported) {
        return;
      }

      setLiveNotice('WebXR immersive-vr is supported on this browser/runtime.');
    } catch {
      setLiveNotice('Unable to initialize WebXR preview check.');
    }
  };

  const [liveNotice, setLiveNotice] = useState('Galaxy renderer initialized.');

  return (
    <section className="lab-shell" aria-label="Galaxy simulation lab">
      <header className="lab-shell-head">
        <div>
          <p>Visualization</p>
          <h2>Galaxy Field</h2>
          <span>
            5 depth layers × 25,000 particles · Instanced draw call · {webglAvailable ? 'WebGL2 active' : 'CSS sprite fallback'}
          </span>
        </div>

        <div className="lab-metrics-grid" aria-live="polite">
          <article>
            <small>FPS</small>
            <strong>{fps.toFixed(1)}</strong>
          </article>
          <article>
            <small>Transition</small>
            <strong>{Math.min(transitionMs, transitionDurationMs).toFixed(0)} ms</strong>
          </article>
          <article>
            <small>Pointer lock</small>
            <strong>{pointerLocked ? 'locked' : 'idle'}</strong>
          </article>
          <article>
            <small>WebXR</small>
            <strong>{webXrSupported ? 'supported' : 'not detected'}</strong>
          </article>
        </div>
      </header>

      <div className="lab-stage galaxy-stage" ref={containerRef}>
        {webglAvailable ? (
          <canvas ref={canvasRef} className="lab-canvas" aria-label="Interactive galaxy simulation" />
        ) : (
          <div className="galaxy-sprite-fallback" aria-hidden="true">
            <span className="galaxy-fallback-layer layer-1" />
            <span className="galaxy-fallback-layer layer-2" />
            <span className="galaxy-fallback-layer layer-3" />
          </div>
        )}
      </div>

      <section className="lab-control-grid" aria-label="Galaxy controls">
        <label>
          <span>Preset</span>
          <select value={preset} onChange={(event) => onPresetChange(event.target.value as GalaxyPresetName)}>
            <option value="spiral">Spiral</option>
            <option value="elliptical">Elliptical</option>
            <option value="starburst">Starburst</option>
          </select>
        </label>

        <label>
          <span>Zoom</span>
          <input
            type="range"
            min={0.3}
            max={5}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <strong>{zoom.toFixed(2)}x</strong>
        </label>

        <label>
          <span>Rotation velocity</span>
          <input
            type="range"
            min={-120}
            max={120}
            step={1}
            value={rotationVelocity}
            onChange={(event) => setRotationVelocity(Number(event.target.value))}
          />
          <strong>{rotationVelocity.toFixed(0)} deg/s</strong>
        </label>

        <label>
          <span>Brightness</span>
          <input
            type="range"
            min={0.3}
            max={2}
            step={0.01}
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
          />
          <strong>{brightness.toFixed(2)}</strong>
        </label>

        <label>
          <span>Temperature</span>
          <input
            type="range"
            min={2000}
            max={10000}
            step={10}
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />
          <strong>{Math.round(temperature)} K</strong>
        </label>

        <label className="telemetry-opt-in">
          <input type="checkbox" checked={telemetryEnabled} onChange={onToggleTelemetry} />
          <span>Telemetry opt-in (GDPR)</span>
        </label>
      </section>

      <section className="lab-recording-panel" aria-label="Galaxy immersive controls">
        <div className="lab-recording-actions">
          <button type="button" onClick={() => void onEnterImmersiveMode()}>
            Fullscreen + Pointer lock
          </button>
          <button type="button" onClick={() => void onRequestWebXrPreview()}>
            Check WebXR layer
          </button>
        </div>
        <small aria-live="polite">{liveNotice}</small>
      </section>
    </section>
  );
};

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export default GalaxySimulationLab;
