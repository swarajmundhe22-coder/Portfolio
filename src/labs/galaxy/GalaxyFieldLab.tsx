import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildGalaxyPreset, GALAXY_PRESETS } from './galaxyPresets';
import type { GalaxyPresetBuffers, GalaxyPresetName } from './galaxyPresets';
import { createProgram, getWebGL2Context } from '../shared/webglGuards';
import { useDebouncedResizeObserver } from '../shared/useDebouncedResizeObserver';
import { reportRuntimeIssue } from '../shared/runtimeTelemetry';

type RendererKind = 'webgl2' | 'fallback';
type XRState = 'unknown' | 'checking' | 'supported' | 'unsupported';

interface GalaxyWebGLResources {
  program: WebGLProgram;
  fromBuffer: WebGLBuffer;
  toBuffer: WebGLBuffer;
  lumaBuffer: WebGLBuffer;
  fromLocation: number;
  toLocation: number;
  lumaLocation: number;
  mixLocation: WebGLUniformLocation;
  zoomLocation: WebGLUniformLocation;
  aspectLocation: WebGLUniformLocation;
  rotationLocation: WebGLUniformLocation;
  brightnessLocation: WebGLUniformLocation;
  temperatureLocation: WebGLUniformLocation;
  timeLocation: WebGLUniformLocation;
}

interface RuntimeParams {
  zoom: number;
  rotationSpeed: number;
  brightness: number;
  temperature: number;
}

const GALAXY_PARTICLE_COUNT = 125_000;
const GALAXY_TRANSITION_MS = 280;

const GALAXY_VERTEX_SHADER = `#version 300 es
precision highp float;
in vec3 a_from;
in vec3 a_to;
in float a_luma;
uniform float u_mix;
uniform float u_zoom;
uniform float u_aspect;
uniform float u_rotation;
uniform float u_brightness;
uniform float u_temperature;
uniform float u_time;
out vec3 v_color;

void main() {
  vec3 point = mix(a_from, a_to, u_mix);
  float angle = u_rotation * u_time;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  point.xy = rot * point.xy;

  vec2 projected = point.xy;
  projected.x = projected.x / max(0.001, u_aspect);
  projected = projected / max(0.35, u_zoom);

  gl_Position = vec4(projected, point.z * 0.25, 1.0);
  gl_PointSize = 1.0 + a_luma * 2.4;

  float warm = clamp((u_temperature - 2000.0) / 7000.0, 0.0, 1.0);
  vec3 cool = vec3(0.38, 0.62, 1.0);
  vec3 hot = vec3(1.0, 0.75, 0.46);
  v_color = mix(cool, hot, warm) * (0.45 + a_luma * u_brightness);
}
`;

const GALAXY_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float radial = dot(uv, uv);
  if (radial > 1.0) {
    discard;
  }

  float alpha = smoothstep(1.0, 0.0, radial) * 0.85;
  outColor = vec4(v_color, alpha);
}
`;

const parsePreset = (value: string | null): GalaxyPresetName => {
  if (value === 'elliptical' || value === 'starburst' || value === 'spiral') {
    return value;
  }

  return 'spiral';
};

const parseNumber = (value: string | null, fallback: number, min: number, max: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
};

const createWebGLResources = (gl: WebGL2RenderingContext): GalaxyWebGLResources => {
  const program = createProgram(gl, GALAXY_VERTEX_SHADER, GALAXY_FRAGMENT_SHADER);
  const fromBuffer = gl.createBuffer();
  const toBuffer = gl.createBuffer();
  const lumaBuffer = gl.createBuffer();

  if (!fromBuffer || !toBuffer || !lumaBuffer) {
    throw new Error('Failed to allocate galaxy attribute buffers.');
  }

  const fromLocation = gl.getAttribLocation(program, 'a_from');
  const toLocation = gl.getAttribLocation(program, 'a_to');
  const lumaLocation = gl.getAttribLocation(program, 'a_luma');
  const mixLocation = gl.getUniformLocation(program, 'u_mix');
  const zoomLocation = gl.getUniformLocation(program, 'u_zoom');
  const aspectLocation = gl.getUniformLocation(program, 'u_aspect');
  const rotationLocation = gl.getUniformLocation(program, 'u_rotation');
  const brightnessLocation = gl.getUniformLocation(program, 'u_brightness');
  const temperatureLocation = gl.getUniformLocation(program, 'u_temperature');
  const timeLocation = gl.getUniformLocation(program, 'u_time');

  if (
    fromLocation < 0
    || toLocation < 0
    || lumaLocation < 0
    || !mixLocation
    || !zoomLocation
    || !aspectLocation
    || !rotationLocation
    || !brightnessLocation
    || !temperatureLocation
    || !timeLocation
  ) {
    throw new Error('Failed to bind required galaxy shader uniforms/attributes.');
  }

  return {
    program,
    fromBuffer,
    toBuffer,
    lumaBuffer,
    fromLocation,
    toLocation,
    lumaLocation,
    mixLocation,
    zoomLocation,
    aspectLocation,
    rotationLocation,
    brightnessLocation,
    temperatureLocation,
    timeLocation,
  };
};

const uploadGalaxyData = (
  gl: WebGL2RenderingContext,
  resources: GalaxyWebGLResources,
  fromData: GalaxyPresetBuffers,
  toData: GalaxyPresetBuffers,
): void => {
  gl.bindBuffer(gl.ARRAY_BUFFER, resources.fromBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fromData.positions, gl.DYNAMIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, resources.toBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, toData.positions, gl.DYNAMIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, resources.lumaBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, toData.luminosity, gl.DYNAMIC_DRAW);
};

const configureGalaxyAttributes = (gl: WebGL2RenderingContext, resources: GalaxyWebGLResources): void => {
  gl.bindBuffer(gl.ARRAY_BUFFER, resources.fromBuffer);
  gl.enableVertexAttribArray(resources.fromLocation);
  gl.vertexAttribPointer(resources.fromLocation, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(resources.fromLocation, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, resources.toBuffer);
  gl.enableVertexAttribArray(resources.toLocation);
  gl.vertexAttribPointer(resources.toLocation, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(resources.toLocation, 1);

  gl.bindBuffer(gl.ARRAY_BUFFER, resources.lumaBuffer);
  gl.enableVertexAttribArray(resources.lumaLocation);
  gl.vertexAttribPointer(resources.lumaLocation, 1, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(resources.lumaLocation, 1);
};

export default function GalaxyFieldLab() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialSearch = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [preset, setPreset] = useState<GalaxyPresetName>(() => parsePreset(initialSearch.get('preset')));
  const [zoom, setZoom] = useState(() => parseNumber(initialSearch.get('zoom'), 1, 0.6, 2.4));
  const [rotationSpeed, setRotationSpeed] = useState(() => parseNumber(initialSearch.get('rotation'), 0.32, 0, 1.6));
  const [brightness, setBrightness] = useState(() => parseNumber(initialSearch.get('brightness'), 1, 0.5, 1.8));
  const [temperature, setTemperature] = useState(() => parseNumber(initialSearch.get('temperature'), 6000, 2500, 9000));
  const [renderer, setRenderer] = useState<RendererKind>('fallback');
  const [xrState, setXrState] = useState<XRState>('unknown');

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const resourcesRef = useRef<GalaxyWebGLResources | null>(null);
  const rafRef = useRef<number | null>(null);
  const runtimeParamsRef = useRef<RuntimeParams>({
    zoom,
    rotationSpeed,
    brightness,
    temperature,
  });
  const startTimeRef = useRef<number>(0);
  const transitionStartRef = useRef<number>(0);
  const fromDataRef = useRef<GalaxyPresetBuffers>(buildGalaxyPreset(preset, GALAXY_PARTICLE_COUNT, 17));
  const toDataRef = useRef<GalaxyPresetBuffers>(buildGalaxyPreset(preset, GALAXY_PARTICLE_COUNT, 17));

  const { width, height, dpr } = useDebouncedResizeObserver(stageRef, 90);

  useEffect(() => {
    runtimeParamsRef.current = {
      zoom,
      rotationSpeed,
      brightness,
      temperature,
    };
  }, [zoom, rotationSpeed, brightness, temperature]);

  useEffect(() => {
    const urlState = new URLSearchParams(location.search);

    setPreset(parsePreset(urlState.get('preset')));
    setZoom(parseNumber(urlState.get('zoom'), 1, 0.6, 2.4));
    setRotationSpeed(parseNumber(urlState.get('rotation'), 0.32, 0, 1.6));
    setBrightness(parseNumber(urlState.get('brightness'), 1, 0.5, 1.8));
    setTemperature(parseNumber(urlState.get('temperature'), 6000, 2500, 9000));
  }, [location.search]);

  useEffect(() => {
    const nextParams = new URLSearchParams(location.search);
    nextParams.set('preset', preset);
    nextParams.set('zoom', zoom.toFixed(2));
    nextParams.set('rotation', rotationSpeed.toFixed(2));
    nextParams.set('brightness', brightness.toFixed(2));
    nextParams.set('temperature', Math.round(temperature).toString());

    const nextSearch = nextParams.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;

    if (nextSearch !== currentSearch) {
      navigate({ pathname: location.pathname, search: `?${nextSearch}` }, { replace: true });
    }
  }, [preset, zoom, rotationSpeed, brightness, temperature, navigate, location.pathname, location.search]);

  useEffect(() => {
    const gl = glRef.current;
    const resources = resourcesRef.current;

    if (!gl || !resources) {
      return;
    }

    const seedByPreset: Record<GalaxyPresetName, number> = {
      spiral: 17,
      elliptical: 43,
      starburst: 83,
    };

    fromDataRef.current = toDataRef.current;
    toDataRef.current = buildGalaxyPreset(preset, GALAXY_PARTICLE_COUNT, seedByPreset[preset]);
    uploadGalaxyData(gl, resources, fromDataRef.current, toDataRef.current);
    transitionStartRef.current = performance.now();
  }, [preset]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || width <= 1 || height <= 1) {
      return;
    }

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const webglResult = getWebGL2Context(canvas);

    if (!webglResult) {
      setRenderer('fallback');
      void reportRuntimeIssue({
        lab: 'galaxy-field',
        category: 'runtime',
        level: 'info',
        message: 'WebGL2 unavailable; galaxy fallback mode enabled.',
      });
      return;
    }

    try {
      const resources = createWebGLResources(webglResult);
      glRef.current = webglResult;
      resourcesRef.current = resources;
      fromDataRef.current = buildGalaxyPreset(preset, GALAXY_PARTICLE_COUNT, 17);
      toDataRef.current = fromDataRef.current;
      uploadGalaxyData(webglResult, resources, fromDataRef.current, toDataRef.current);
      transitionStartRef.current = performance.now();
      startTimeRef.current = performance.now();
      setRenderer('webgl2');

      const render = (now: number): void => {
        const gl = glRef.current;
        const resources = resourcesRef.current;

        if (!gl || !resources) {
          return;
        }

        const transitionProgress = Math.min(1, (now - transitionStartRef.current) / GALAXY_TRANSITION_MS);
        const elapsed = (now - startTimeRef.current) / 1000;

        gl.viewport(0, 0, Math.floor(width * dpr), Math.floor(height * dpr));
        gl.clearColor(0.01, 0.02, 0.06, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        gl.useProgram(resources.program);
        configureGalaxyAttributes(gl, resources);

        gl.uniform1f(resources.mixLocation, transitionProgress);
        gl.uniform1f(resources.zoomLocation, runtimeParamsRef.current.zoom);
        gl.uniform1f(resources.aspectLocation, width / Math.max(1, height));
        gl.uniform1f(resources.rotationLocation, runtimeParamsRef.current.rotationSpeed);
        gl.uniform1f(resources.brightnessLocation, runtimeParamsRef.current.brightness);
        gl.uniform1f(resources.temperatureLocation, runtimeParamsRef.current.temperature);
        gl.uniform1f(resources.timeLocation, elapsed);

        gl.drawArraysInstanced(gl.POINTS, 0, 1, GALAXY_PARTICLE_COUNT);

        rafRef.current = window.requestAnimationFrame(render);
      };

      rafRef.current = window.requestAnimationFrame(render);
    } catch (error) {
      setRenderer('fallback');
      void reportRuntimeIssue({
        lab: 'galaxy-field',
        category: 'shader-compilation',
        level: 'warn',
        message: 'Galaxy WebGL initialization failed. Fallback mode enabled.',
        extra: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const gl = glRef.current;
      const resources = resourcesRef.current;
      if (gl && resources) {
        gl.deleteBuffer(resources.fromBuffer);
        gl.deleteBuffer(resources.toBuffer);
        gl.deleteBuffer(resources.lumaBuffer);
        gl.deleteProgram(resources.program);
      }

      glRef.current = null;
      resourcesRef.current = null;
    };
  }, [width, height, dpr, preset]);

  const memoryEstimateMb = useMemo(() => {
    const bytes = (GALAXY_PARTICLE_COUNT * 3 * 4 * 2) + (GALAXY_PARTICLE_COUNT * 4);
    return (bytes / (1024 * 1024)).toFixed(1);
  }, []);

  const requestFullscreen = (): void => {
    if (!stageRef.current || !stageRef.current.requestFullscreen) {
      return;
    }

    void stageRef.current.requestFullscreen();
  };

  const requestPointerLock = (): void => {
    stageRef.current?.requestPointerLock?.();
  };

  const detectXR = (): void => {
    const navigatorWithXR = navigator as Navigator & {
      xr?: {
        isSessionSupported: (mode: 'immersive-vr') => Promise<boolean>;
      };
    };

    if (!navigatorWithXR.xr) {
      setXrState('unsupported');
      return;
    }

    setXrState('checking');
    navigatorWithXR.xr
      .isSessionSupported('immersive-vr')
      .then((supported) => {
        setXrState(supported ? 'supported' : 'unsupported');
      })
      .catch(() => {
        setXrState('unsupported');
      });
  };

  return (
    <section className="lab-shell galaxy-shell" aria-label="Galaxy field lab">
      <header className="lab-header">
        <div>
          <p className="lab-kicker">Particle Visualization</p>
          <h2>Galaxy Field</h2>
          <p className="lab-description">
            125k particles with single-call instanced rendering, URL-driven controls, and fallback sprite layers.
          </p>
        </div>
        <div className="lab-metrics">
          <span>Renderer: {renderer}</span>
          <span>Particles: {GALAXY_PARTICLE_COUNT.toLocaleString()}</span>
          <span>Transition: {GALAXY_TRANSITION_MS}ms</span>
          <span>Memory: ~{memoryEstimateMb}MB</span>
        </div>
      </header>

      <div ref={stageRef} className="lab-stage galaxy-stage">
        <canvas ref={canvasRef} aria-label="Galaxy simulation stage" />
        {renderer === 'fallback' ? (
          <div className="galaxy-fallback-layers" aria-hidden="true">
            <div className="galaxy-fallback-layer layer-1" />
            <div className="galaxy-fallback-layer layer-2" />
            <div className="galaxy-fallback-layer layer-3" />
          </div>
        ) : null}
      </div>

      <div className="lab-control-grid">
        <label>
          Preset
          <select value={preset} onChange={(event) => setPreset(parsePreset(event.target.value))}>
            {GALAXY_PRESETS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <label>
          Zoom
          <input
            type="range"
            min={0.6}
            max={2.4}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        <label>
          Rotation Velocity
          <input
            type="range"
            min={0}
            max={1.6}
            step={0.02}
            value={rotationSpeed}
            onChange={(event) => setRotationSpeed(Number(event.target.value))}
          />
        </label>

        <label>
          Brightness
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.05}
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
          />
        </label>

        <label>
          Temperature (K)
          <input
            type="range"
            min={2500}
            max={9000}
            step={100}
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="lab-recording">
        <button type="button" onClick={requestFullscreen}>Fullscreen</button>
        <button type="button" onClick={requestPointerLock}>Pointer Lock</button>
        <button type="button" onClick={detectXR}>Check WebXR</button>
        <span>WebXR: {xrState}</span>
      </div>
    </section>
  );
}
