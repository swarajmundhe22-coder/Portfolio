import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  PARTICLE_STRIDE,
  createInitialParticleState,
  defaultMagneticConfig,
  ensureForceBuffer,
  stepMagneticSimulation,
} from './magneticPhysics';
import type {
  MagneticBlendMode,
  MagneticPointerState,
  MagneticSimulationConfig,
} from './magneticPhysics';
import { useDebouncedResizeObserver } from '../shared/useDebouncedResizeObserver';
import { createProgram, getWebGL2Context, supportsWebGL2 } from '../shared/webglGuards';
import {
  isTelemetryOptIn,
  reportRuntimeIssue,
  setTelemetryOptIn,
} from '../shared/runtimeTelemetry';

interface InteractionSample {
  t: number;
  x: number;
  y: number;
  active: boolean;
}

interface InteractionSequence {
  version: 1;
  simulation: {
    fieldStrength: number;
    viscosity: number;
    particleCount: number;
    blendMode: MagneticBlendMode;
    gradient: string;
  };
  samples: InteractionSample[];
}

interface GradientPreset {
  id: string;
  label: string;
  colors: [string, string, string];
}

interface RendererHandles {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  indexBuffer: WebGLBuffer;
  motionTextures: [WebGLTexture, WebGLTexture];
  momentsTextures: [WebGLTexture, WebGLTexture];
  uploadMotion: Float32Array;
  uploadMoments: Float32Array;
  textureSize: number;
  activeTextureIndex: number;
  maxParticles: number;
  uniformLocations: {
    motionTexture: WebGLUniformLocation;
    momentsTexture: WebGLUniformLocation;
    textureSize: WebGLUniformLocation;
    particleCount: WebGLUniformLocation;
    pointScale: WebGLUniformLocation;
    blendMode: WebGLUniformLocation;
    gradientA: WebGLUniformLocation;
    gradientB: WebGLUniformLocation;
    gradientC: WebGLUniformLocation;
  };
}

interface SimulationBuffers {
  previous: Float32Array;
  current: Float32Array;
  next: Float32Array;
  render: Float32Array;
  stateCurrent: Float32Array;
  stateNext: Float32Array;
  momentCurrent: Float32Array;
  momentNext: Float32Array;
  forces: Float32Array;
}

const maxParticleCount = 1800;
const minParticleCount = 240;
const defaultParticleCount = 1000;
const fixedStep = 1 / 120;

const gradientPresets: GradientPreset[] = [
  {
    id: 'nebula',
    label: 'Nebula Blue',
    colors: ['#47c4ff', '#3d5afe', '#99b8ff'],
  },
  {
    id: 'ember',
    label: 'Solar Ember',
    colors: ['#ffdb8f', '#ff7a49', '#ff2f75'],
  },
  {
    id: 'mint',
    label: 'Arctic Mint',
    colors: ['#b6ffe4', '#49d6c5', '#16468d'],
  },
  {
    id: 'graphite',
    label: 'Graphite Flux',
    colors: ['#f6f7ff', '#9da8dc', '#293262'],
  },
];

const hexToVec3 = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return [red, green, blue];
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toTextureSize = (particleCount: number): number =>
  Math.max(1, Math.ceil(Math.sqrt(Math.max(1, particleCount))));

const pointerDefaults: MagneticPointerState = {
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
};

const createMotionArray = (particleCount: number): Float32Array => {
  const source = createInitialParticleState(particleCount);
  const output = new Float32Array(particleCount * 4);

  for (let index = 0; index < particleCount; index += 1) {
    const srcOffset = index * PARTICLE_STRIDE;
    const outOffset = index * 4;
    output[outOffset + 0] = source[srcOffset + 0];
    output[outOffset + 1] = source[srcOffset + 1];
    output[outOffset + 2] = source[srcOffset + 2];
    output[outOffset + 3] = source[srcOffset + 3];
  }

  return output;
};

const createMomentsArray = (particleCount: number): Float32Array => {
  const source = createInitialParticleState(particleCount, 9090);
  const output = new Float32Array(particleCount * 4);

  for (let index = 0; index < particleCount; index += 1) {
    const srcOffset = index * PARTICLE_STRIDE;
    const outOffset = index * 4;
    output[outOffset + 0] = source[srcOffset + 4];
    output[outOffset + 1] = source[srcOffset + 5];
    output[outOffset + 2] = source[srcOffset + 6];
    output[outOffset + 3] = source[srcOffset + 7];
  }

  return output;
};

const hydrateParticleState = (
  motion: Float32Array,
  moments: Float32Array,
  particleCount: number,
  target: Float32Array,
): void => {
  for (let index = 0; index < particleCount; index += 1) {
    const stateOffset = index * PARTICLE_STRIDE;
    const motionOffset = index * 4;
    const momentsOffset = index * 4;

    target[stateOffset + 0] = motion[motionOffset + 0];
    target[stateOffset + 1] = motion[motionOffset + 1];
    target[stateOffset + 2] = motion[motionOffset + 2];
    target[stateOffset + 3] = motion[motionOffset + 3];
    target[stateOffset + 4] = moments[momentsOffset + 0];
    target[stateOffset + 5] = moments[momentsOffset + 1];
    target[stateOffset + 6] = moments[momentsOffset + 2];
    target[stateOffset + 7] = moments[momentsOffset + 3];
  }
};

const extractMotionFromParticleState = (
  state: Float32Array,
  target: Float32Array,
  particleCount: number,
): void => {
  for (let index = 0; index < particleCount; index += 1) {
    const stateOffset = index * PARTICLE_STRIDE;
    const targetOffset = index * 4;

    target[targetOffset + 0] = state[stateOffset + 0];
    target[targetOffset + 1] = state[stateOffset + 1];
    target[targetOffset + 2] = state[stateOffset + 2];
    target[targetOffset + 3] = state[stateOffset + 3];
  }
};

const createSimulationBuffers = (particleCount: number): SimulationBuffers => {
  const motion = createMotionArray(particleCount);
  const moments = createMomentsArray(particleCount);

  return {
    previous: motion.slice(),
    current: motion,
    next: motion.slice(),
    render: motion.slice(),
    stateCurrent: new Float32Array(particleCount * PARTICLE_STRIDE),
    stateNext: new Float32Array(particleCount * PARTICLE_STRIDE),
    momentCurrent: moments,
    momentNext: moments.slice(),
    forces: ensureForceBuffer(particleCount),
  };
};

const createFloatTexture = (gl: WebGL2RenderingContext, textureSize: number): WebGLTexture => {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Unable to allocate particle state texture.');
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F,
    textureSize,
    textureSize,
    0,
    gl.RGBA,
    gl.FLOAT,
    null,
  );

  return texture;
};

const makeUploadBuffer = (source: Float32Array, textureSize: number): Float32Array => {
  const padded = new Float32Array(textureSize * textureSize * 4);
  padded.set(source, 0);
  return padded;
};

const uploadParticleTextures = (
  renderer: RendererHandles,
  motion: Float32Array,
  moments: Float32Array,
): void => {
  const { gl, textureSize } = renderer;
  renderer.uploadMotion.fill(0);
  renderer.uploadMoments.fill(0);
  renderer.uploadMotion.set(motion, 0);
  renderer.uploadMoments.set(moments, 0);

  gl.bindTexture(gl.TEXTURE_2D, renderer.motionTextures[renderer.activeTextureIndex]);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    textureSize,
    textureSize,
    gl.RGBA,
    gl.FLOAT,
    renderer.uploadMotion,
  );

  gl.bindTexture(gl.TEXTURE_2D, renderer.momentsTextures[renderer.activeTextureIndex]);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    0,
    0,
    textureSize,
    textureSize,
    gl.RGBA,
    gl.FLOAT,
    renderer.uploadMoments,
  );
};

const magneticVertexShaderSource = `#version 300 es
precision highp float;

in float aIndex;

uniform sampler2D uMotionTexture;
uniform sampler2D uMomentsTexture;
uniform float uTextureSize;
uniform int uParticleCount;
uniform float uPointScale;

out vec2 vVelocity;
out float vRadius;
out float vMagneticPhase;

void main() {
  int index = int(aIndex);
  if (index >= uParticleCount) {
    gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }

  float tx = mod(float(index), uTextureSize);
  float ty = floor(float(index) / uTextureSize);
  vec2 uv = (vec2(tx, ty) + 0.5) / uTextureSize;

  vec4 motion = texture(uMotionTexture, uv);
  vec4 moments = texture(uMomentsTexture, uv);

  vec2 position = motion.xy;
  vec2 velocity = motion.zw;

  vVelocity = velocity;
  vRadius = moments.z;
  vMagneticPhase = atan(moments.y, moments.x);

  gl_Position = vec4(position.xy, 0.0, 1.0);
  gl_PointSize = max(1.2, vRadius * uPointScale);
}`;

const magneticFragmentShaderSource = `#version 300 es
precision highp float;

uniform int uBlendMode;
uniform vec3 uGradientA;
uniform vec3 uGradientB;
uniform vec3 uGradientC;

in vec2 vVelocity;
in float vRadius;
in float vMagneticPhase;

out vec4 outColor;

float calculateMask(int blendMode, vec2 centered) {
  if (blendMode == 0) {
    float d = length(centered);
    return smoothstep(1.0, 0.0, d);
  }

  if (blendMode == 1) {
    vec2 ellipsoid = vec2(centered.x * 0.74, centered.y * 1.28);
    float d = length(ellipsoid);
    return smoothstep(1.0, 0.0, d);
  }

  float metaballA = exp(-dot(centered, centered) * 3.8);
  float metaballB = exp(-dot(centered + vec2(0.18, -0.14), centered + vec2(0.18, -0.14)) * 6.0);
  float metaballC = exp(-dot(centered + vec2(-0.15, 0.11), centered + vec2(-0.15, 0.11)) * 5.2);
  return clamp((metaballA + metaballB + metaballC) * 0.72, 0.0, 1.0);
}

void main() {
  vec2 centered = gl_PointCoord * 2.0 - 1.0;
  float mask = calculateMask(uBlendMode, centered);
  if (mask <= 0.01) {
    discard;
  }

  float speed = clamp(length(vVelocity) * 8.5, 0.0, 1.0);
  float magneticTint = 0.5 + 0.5 * sin(vMagneticPhase + speed * 6.28318530718);

  vec3 gradientMix = mix(uGradientA, uGradientB, speed);
  gradientMix = mix(gradientMix, uGradientC, magneticTint * 0.55);

  float highlight = smoothstep(0.85, 0.0, length(centered - vec2(0.2, -0.2)));
  vec3 color = gradientMix + highlight * 0.16;

  float alpha = mask * clamp(0.42 + vRadius * 0.22, 0.32, 0.96);
  outColor = vec4(color, alpha);
}`;

const initializeRenderer = (canvas: HTMLCanvasElement, particleCount: number): RendererHandles => {
  const gl = getWebGL2Context(canvas, {
    antialias: true,
    alpha: true,
    depth: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    throw new Error('WebGL2 context unavailable.');
  }

  const program = createProgram(gl, magneticVertexShaderSource, magneticFragmentShaderSource);
  gl.useProgram(program);

  const textureSize = toTextureSize(particleCount);

  const indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    throw new Error('Unable to allocate index buffer.');
  }

  const indices = new Float32Array(particleCount);
  for (let index = 0; index < particleCount; index += 1) {
    indices[index] = index;
  }

  const vao = gl.createVertexArray();
  if (!vao) {
    throw new Error('Unable to allocate vertex array.');
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const indexAttribute = gl.getAttribLocation(program, 'aIndex');
  if (indexAttribute < 0) {
    throw new Error('Failed to locate aIndex attribute.');
  }
  gl.enableVertexAttribArray(indexAttribute);
  gl.vertexAttribPointer(indexAttribute, 1, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const motionTextures: [WebGLTexture, WebGLTexture] = [
    createFloatTexture(gl, textureSize),
    createFloatTexture(gl, textureSize),
  ];

  const momentsTextures: [WebGLTexture, WebGLTexture] = [
    createFloatTexture(gl, textureSize),
    createFloatTexture(gl, textureSize),
  ];

  const motionTexture = gl.getUniformLocation(program, 'uMotionTexture');
  const momentsTexture = gl.getUniformLocation(program, 'uMomentsTexture');
  const uniformTextureSize = gl.getUniformLocation(program, 'uTextureSize');
  const uniformParticleCount = gl.getUniformLocation(program, 'uParticleCount');
  const uniformPointScale = gl.getUniformLocation(program, 'uPointScale');
  const uniformBlendMode = gl.getUniformLocation(program, 'uBlendMode');
  const uniformGradientA = gl.getUniformLocation(program, 'uGradientA');
  const uniformGradientB = gl.getUniformLocation(program, 'uGradientB');
  const uniformGradientC = gl.getUniformLocation(program, 'uGradientC');

  if (
    !motionTexture ||
    !momentsTexture ||
    !uniformTextureSize ||
    !uniformParticleCount ||
    !uniformPointScale ||
    !uniformBlendMode ||
    !uniformGradientA ||
    !uniformGradientB ||
    !uniformGradientC
  ) {
    throw new Error('Missing one or more required shader uniforms.');
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0.01, 0.02, 0.05, 1);

  return {
    gl,
    program,
    vao,
    indexBuffer,
    motionTextures,
    momentsTextures,
    uploadMotion: makeUploadBuffer(new Float32Array(), textureSize),
    uploadMoments: makeUploadBuffer(new Float32Array(), textureSize),
    textureSize,
    activeTextureIndex: 0,
    maxParticles: particleCount,
    uniformLocations: {
      motionTexture,
      momentsTexture,
      textureSize: uniformTextureSize,
      particleCount: uniformParticleCount,
      pointScale: uniformPointScale,
      blendMode: uniformBlendMode,
      gradientA: uniformGradientA,
      gradientB: uniformGradientB,
      gradientC: uniformGradientC,
    },
  };
};

const resizeRenderer = (
  renderer: RendererHandles,
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

const renderParticles = (
  renderer: RendererHandles,
  particleCount: number,
  renderMotion: Float32Array,
  renderMoments: Float32Array,
  blendMode: MagneticBlendMode,
  gradient: GradientPreset,
  dpr: number,
): void => {
  const { gl } = renderer;
  renderer.activeTextureIndex = renderer.activeTextureIndex === 0 ? 1 : 0;

  uploadParticleTextures(renderer, renderMotion, renderMoments);

  gl.useProgram(renderer.program);

  const blendModeValue = blendMode === 'spherical' ? 0 : blendMode === 'ellipsoid' ? 1 : 2;
  const gradientA = hexToVec3(gradient.colors[0]);
  const gradientB = hexToVec3(gradient.colors[1]);
  const gradientC = hexToVec3(gradient.colors[2]);

  gl.uniform1i(renderer.uniformLocations.motionTexture, 0);
  gl.uniform1i(renderer.uniformLocations.momentsTexture, 1);
  gl.uniform1f(renderer.uniformLocations.textureSize, renderer.textureSize);
  gl.uniform1i(renderer.uniformLocations.particleCount, particleCount);
  gl.uniform1f(renderer.uniformLocations.pointScale, Math.max(3.2, 5.5 * dpr));
  gl.uniform1i(renderer.uniformLocations.blendMode, blendModeValue);
  gl.uniform3f(renderer.uniformLocations.gradientA, gradientA[0], gradientA[1], gradientA[2]);
  gl.uniform3f(renderer.uniformLocations.gradientB, gradientB[0], gradientB[1], gradientB[2]);
  gl.uniform3f(renderer.uniformLocations.gradientC, gradientC[0], gradientC[1], gradientC[2]);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.motionTextures[renderer.activeTextureIndex]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, renderer.momentsTextures[renderer.activeTextureIndex]);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindVertexArray(renderer.vao);
  gl.drawArrays(gl.POINTS, 0, particleCount);
  gl.bindVertexArray(null);
};

const renderCanvasFallback = (
  canvas: HTMLCanvasElement,
  motion: Float32Array,
  moments: Float32Array,
  particleCount: number,
  gradient: GradientPreset,
): void => {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;

  context.clearRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = '#04070f';
  context.fillRect(0, 0, width, height);

  context.globalCompositeOperation = 'lighter';

  for (let index = 0; index < particleCount; index += 1) {
    const motionOffset = index * 4;
    const momentsOffset = index * 4;

    const x = (motion[motionOffset + 0] * 0.5 + 0.5) * width;
    const y = (motion[motionOffset + 1] * -0.5 + 0.5) * height;
    const radius = moments[momentsOffset + 2] * 2.8;

    const color = gradient.colors[index % gradient.colors.length];
    const radial = context.createRadialGradient(x, y, 0, x, y, radius * 4);
    radial.addColorStop(0, `${color}cc`);
    radial.addColorStop(1, `${color}00`);

    context.beginPath();
    context.fillStyle = radial;
    context.arc(x, y, radius * 4, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'source-over';
};

const destroyRenderer = (renderer: RendererHandles): void => {
  const { gl } = renderer;

  gl.deleteBuffer(renderer.indexBuffer);
  gl.deleteVertexArray(renderer.vao);
  gl.deleteTexture(renderer.motionTextures[0]);
  gl.deleteTexture(renderer.motionTextures[1]);
  gl.deleteTexture(renderer.momentsTextures[0]);
  gl.deleteTexture(renderer.momentsTextures[1]);
  gl.deleteProgram(renderer.program);
};

const lerpMotionState = (
  previous: Float32Array,
  current: Float32Array,
  output: Float32Array,
  alpha: number,
): void => {
  const clampedAlpha = clamp(alpha, 0, 1);
  const inverse = 1 - clampedAlpha;

  for (let index = 0; index < output.length; index += 1) {
    output[index] = previous[index] * inverse + current[index] * clampedAlpha;
  }
};

const toSimulationConfig = (
  model: MagneticSimulationConfig['model'],
  fieldStrength: number,
  viscosity: number,
): MagneticSimulationConfig => ({
  ...defaultMagneticConfig,
  model,
  fieldStrength,
  viscosity,
});

const normalizePointer = (
  event: PointerEvent,
  canvas: HTMLCanvasElement,
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * -2 + 1;

  return {
    x: clamp(x, -1, 1),
    y: clamp(y, -1, 1),
  };
};

const mergePlaybackPointer = (
  playbackSamples: InteractionSample[],
  elapsedMs: number,
): MagneticPointerState => {
  if (playbackSamples.length === 0) {
    return pointerDefaults;
  }

  const duration = playbackSamples[playbackSamples.length - 1]?.t ?? 0;
  const bounded = clamp(elapsedMs, 0, duration);

  let index = 0;
  while (index < playbackSamples.length - 1 && playbackSamples[index + 1].t < bounded) {
    index += 1;
  }

  const current = playbackSamples[index];
  const next = playbackSamples[Math.min(index + 1, playbackSamples.length - 1)] ?? current;

  if (!current || !next) {
    return pointerDefaults;
  }

  const timeWindow = Math.max(1, next.t - current.t);
  const alpha = clamp((bounded - current.t) / timeWindow, 0, 1);
  const x = current.x + (next.x - current.x) * alpha;
  const y = current.y + (next.y - current.y) * alpha;

  return {
    active: current.active || next.active,
    x,
    y,
    vx: next.x - current.x,
    vy: next.y - current.y,
  };
};

const MagneticBlobsLab = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [fieldStrength, setFieldStrength] = useState(1);
  const [viscosity, setViscosity] = useState(0.2);
  const [particleCount, setParticleCount] = useState(defaultParticleCount);
  const [model, setModel] = useState<MagneticSimulationConfig['model']>('dipole');
  const [blendMode, setBlendMode] = useState<MagneticBlendMode>('metaball');
  const [gradientId, setGradientId] = useState(gradientPresets[0].id);
  const [cpuFrameMs, setCpuFrameMs] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [recording, setRecording] = useState(false);
  const [playback, setPlayback] = useState(false);
  const [recordedSamples, setRecordedSamples] = useState<InteractionSample[]>([]);
  const [importBuffer, setImportBuffer] = useState('');
  const [telemetryOptInState, setTelemetryOptInState] = useState(false);
  const [msaaSamples, setMsaaSamples] = useState(0);
  const [webglAvailable, setWebglAvailable] = useState(() => supportsWebGL2());

  const rendererRef = useRef<RendererHandles | null>(null);
  const simulationRef = useRef<SimulationBuffers | null>(null);
  const pointerRef = useRef<MagneticPointerState>({ ...pointerDefaults });
  const recordingRef = useRef<InteractionSample[]>([]);
  const recordingEnabledRef = useRef(false);
  const playbackEnabledRef = useRef(false);
  const playbackSamplesRef = useRef<InteractionSample[]>([]);
  const recordingStartRef = useRef(0);
  const playbackStartRef = useRef(0);
  const selectedGradient = useMemo(
    () => gradientPresets.find((preset) => preset.id === gradientId) ?? gradientPresets[0],
    [gradientId],
  );
  const controlsRef = useRef({
    fieldStrength,
    viscosity,
    model,
    blendMode,
    gradient: gradientPresets[0],
  });
  const energyRef = useRef(0);
  const averageSpeedRef = useRef(0);
  const metricsUpdatedAtRef = useRef(0);

  const size = useDebouncedResizeObserver(containerRef, 110, 2);

  useEffect(() => {
    setTelemetryOptInState(isTelemetryOptIn());
  }, []);

  useEffect(() => {
    setPlayback(false);
    playbackSamplesRef.current = [];
  }, [particleCount]);

  useEffect(() => {
    controlsRef.current = {
      fieldStrength,
      viscosity,
      model,
      blendMode,
      gradient: selectedGradient,
    };
  }, [blendMode, fieldStrength, model, selectedGradient, viscosity]);

  useEffect(() => {
    recordingEnabledRef.current = recording;
  }, [recording]);

  useEffect(() => {
    playbackEnabledRef.current = playback;
  }, [playback]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (size.width <= 0 || size.height <= 0) {
      return;
    }

    let disposed = false;
    let frameId = 0;
    let previousTime = performance.now();
    let accumulator = 0;
    let cpuAverage = 0;

    const simulation = createSimulationBuffers(particleCount);
    simulationRef.current = simulation;

    canvas.width = Math.max(1, Math.round(size.width * size.dpr));
    canvas.height = Math.max(1, Math.round(size.height * size.dpr));

    const webglPathEnabled = supportsWebGL2();
    setWebglAvailable(webglPathEnabled);

    if (webglPathEnabled) {
      try {
        const renderer = initializeRenderer(canvas, particleCount);
        rendererRef.current = renderer;
        resizeRenderer(renderer, size.width, size.height, size.dpr);
        setMsaaSamples(renderer.gl.getParameter(renderer.gl.SAMPLES) as number);

        const handleContextLoss = (event: Event): void => {
          event.preventDefault();
          void reportRuntimeIssue({
            lab: 'magnetic-blobs',
            category: 'webgl-context-loss',
            level: 'critical',
            message: 'WebGL context lost in Magnetic Blobs runtime.',
          });
        };

        canvas.addEventListener('webglcontextlost', handleContextLoss, false);

        const cleanupContextListener = (): void => {
          canvas.removeEventListener('webglcontextlost', handleContextLoss, false);
        };

        (canvas as HTMLCanvasElement & { __cleanupContext?: () => void }).__cleanupContext =
          cleanupContextListener;
      } catch (error) {
        setWebglAvailable(false);
        const message = error instanceof Error ? error.message : 'Unknown renderer setup error';
        void reportRuntimeIssue({
          lab: 'magnetic-blobs',
          category: 'shader-compilation',
          level: 'error',
          message,
        });
      }
    }

    const runFrame = (time: number): void => {
      if (disposed) {
        return;
      }

      const simulationStart = performance.now();
      const renderer = rendererRef.current;
      const activeSimulation = simulationRef.current;

      if (!activeSimulation) {
        return;
      }

      const deltaSeconds = clamp((time - previousTime) / 1000, 1 / 240, 1 / 24);
      previousTime = time;
      accumulator += deltaSeconds;

      if (playbackEnabledRef.current) {
        const playbackPointer = mergePlaybackPointer(
          playbackSamplesRef.current,
          time - playbackStartRef.current,
        );
        pointerRef.current = playbackPointer;

        const duration = playbackSamplesRef.current[playbackSamplesRef.current.length - 1]?.t ?? 0;
        if (time - playbackStartRef.current >= duration) {
          setPlayback(false);
          pointerRef.current = { ...pointerDefaults };
        }
      }

      let latestEnergy = energyRef.current;
      let latestAverageSpeed = averageSpeedRef.current;

      while (accumulator >= fixedStep) {
        activeSimulation.previous.set(activeSimulation.current);

        hydrateParticleState(
          activeSimulation.current,
          activeSimulation.momentCurrent,
          particleCount,
          activeSimulation.stateCurrent,
        );

        hydrateParticleState(
          activeSimulation.next,
          activeSimulation.momentNext,
          particleCount,
          activeSimulation.stateNext,
        );

        const result = stepMagneticSimulation(
          activeSimulation.stateCurrent,
          activeSimulation.stateNext,
          activeSimulation.forces,
          particleCount,
          pointerRef.current,
          toSimulationConfig(
            controlsRef.current.model,
            controlsRef.current.fieldStrength,
            controlsRef.current.viscosity,
          ),
          fixedStep,
        );

        extractMotionFromParticleState(activeSimulation.stateNext, activeSimulation.next, particleCount);
        activeSimulation.momentNext.set(activeSimulation.momentCurrent);

        const motionSwap = activeSimulation.current;
        activeSimulation.current = activeSimulation.next;
        activeSimulation.next = motionSwap;

        const momentsSwap = activeSimulation.momentCurrent;
        activeSimulation.momentCurrent = activeSimulation.momentNext;
        activeSimulation.momentNext = momentsSwap;

        latestEnergy = result.energy;
        latestAverageSpeed = result.averageSpeed;

        accumulator -= fixedStep;
      }

      const alpha = accumulator / fixedStep;
      lerpMotionState(activeSimulation.previous, activeSimulation.current, activeSimulation.render, alpha);

      if (recordingEnabledRef.current) {
        const pointerSnapshot = pointerRef.current;
        const sample: InteractionSample = {
          t: Math.max(0, time - recordingStartRef.current),
          x: pointerSnapshot.x,
          y: pointerSnapshot.y,
          active: pointerSnapshot.active,
        };
        recordingRef.current.push(sample);
      }

      if (renderer && webglAvailable) {
        renderParticles(
          renderer,
          particleCount,
          activeSimulation.render,
          activeSimulation.momentCurrent,
          controlsRef.current.blendMode,
          controlsRef.current.gradient,
          size.dpr,
        );

        if (renderer.gl.getError() === renderer.gl.OUT_OF_MEMORY) {
          void reportRuntimeIssue({
            lab: 'magnetic-blobs',
            category: 'out-of-memory',
            level: 'critical',
            message: 'WebGL reported OUT_OF_MEMORY during Magnetic Blobs draw.',
          });
        }
      } else {
        renderCanvasFallback(
          canvas,
          activeSimulation.render,
          activeSimulation.momentCurrent,
          particleCount,
          controlsRef.current.gradient,
        );
      }

      const simulationCost = performance.now() - simulationStart;
      cpuAverage = cpuAverage * 0.9 + simulationCost * 0.1;
      if (time - metricsUpdatedAtRef.current > 120) {
        energyRef.current = latestEnergy;
        averageSpeedRef.current = latestAverageSpeed;
        setEnergy(latestEnergy);
        setAverageSpeed(latestAverageSpeed);
        setCpuFrameMs(cpuAverage);
        metricsUpdatedAtRef.current = time;
      }

      frameId = window.requestAnimationFrame(runFrame);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const canvasNode = canvasRef.current;
      if (!canvasNode) {
        return;
      }

      const nextPointer = normalizePointer(event, canvasNode);
      const previous = pointerRef.current;

      pointerRef.current = {
        active: true,
        x: nextPointer.x,
        y: nextPointer.y,
        vx: nextPointer.x - previous.x,
        vy: nextPointer.y - previous.y,
      };
    };

    const onPointerLeave = (): void => {
      pointerRef.current = {
        ...pointerRef.current,
        active: false,
        vx: 0,
        vy: 0,
      };
    };

    const canvasNode = canvasRef.current;
    canvasNode?.addEventListener('pointermove', onPointerMove, { passive: true });
    canvasNode?.addEventListener('pointerdown', onPointerMove, { passive: true });
    canvasNode?.addEventListener('pointerup', onPointerLeave, { passive: true });
    canvasNode?.addEventListener('pointerleave', onPointerLeave, { passive: true });

    frameId = window.requestAnimationFrame(runFrame);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      canvasNode?.removeEventListener('pointermove', onPointerMove);
      canvasNode?.removeEventListener('pointerdown', onPointerMove);
      canvasNode?.removeEventListener('pointerup', onPointerLeave);
      canvasNode?.removeEventListener('pointerleave', onPointerLeave);

      const renderer = rendererRef.current;
      if (renderer) {
        destroyRenderer(renderer);
        rendererRef.current = null;
      }

      const cleanupContext = (canvasNode as HTMLCanvasElement & { __cleanupContext?: () => void })
        .__cleanupContext;
      cleanupContext?.();
      delete (canvasNode as HTMLCanvasElement & { __cleanupContext?: () => void }).__cleanupContext;

      simulationRef.current = null;
    };
  }, [
    particleCount,
    size.dpr,
    size.height,
    size.width,
    webglAvailable,
  ]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (size.width <= 0 || size.height <= 0 || !canvas) {
      return;
    }

    canvas.width = Math.max(1, Math.round(size.width * size.dpr));
    canvas.height = Math.max(1, Math.round(size.height * size.dpr));

    if (!renderer) {
      return;
    }

    resizeRenderer(renderer, size.width, size.height, size.dpr);
  }, [size.dpr, size.height, size.width]);

  const onToggleRecording = (): void => {
    if (recording) {
      setRecording(false);
      setRecordedSamples(recordingRef.current.slice());
      return;
    }

    recordingRef.current = [];
    recordingStartRef.current = performance.now();
    setRecording(true);
    setPlayback(false);
  };

  const onExportRecording = (): void => {
    const payload: InteractionSequence = {
      version: 1,
      simulation: {
        fieldStrength,
        viscosity,
        particleCount,
        blendMode,
        gradient: selectedGradient.id,
      },
      samples: recordingRef.current.slice(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `magnetic-blobs-sequence-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const onImportSequence = (): void => {
    try {
      const parsed = JSON.parse(importBuffer) as InteractionSequence;
      if (!Array.isArray(parsed.samples)) {
        return;
      }

      const normalized = parsed.samples
        .filter((sample) => Number.isFinite(sample.t) && Number.isFinite(sample.x) && Number.isFinite(sample.y))
        .map((sample) => ({
          t: sample.t,
          x: clamp(sample.x, -1, 1),
          y: clamp(sample.y, -1, 1),
          active: Boolean(sample.active),
        }));

      playbackSamplesRef.current = normalized;
      setRecordedSamples(normalized);
      setPlayback(false);
    } catch {
      void reportRuntimeIssue({
        lab: 'magnetic-blobs',
        category: 'runtime',
        level: 'warn',
        message: 'Failed to parse imported interaction sequence JSON.',
      });
    }
  };

  const onPlaySequence = (): void => {
    const samples = playbackSamplesRef.current.length > 0 ? playbackSamplesRef.current : recordedSamples;
    if (samples.length === 0) {
      return;
    }

    playbackSamplesRef.current = samples;
    playbackStartRef.current = performance.now();
    setPlayback(true);
  };

  const onToggleTelemetry = (event: ChangeEvent<HTMLInputElement>): void => {
    const enabled = event.target.checked;
    setTelemetryOptIn(enabled);
    setTelemetryOptInState(enabled);
  };

  return (
    <section className="lab-shell" aria-label="Magnetic blobs production simulation lab">
      <header className="lab-shell-head">
        <div>
          <p>Motion simulation</p>
          <h2>Magnetic Blobs</h2>
          <span>
            {webglAvailable ? 'WebGL2 runtime active' : 'Canvas 2D fallback active'} · {particleCount} particles
          </span>
        </div>

        <div className="lab-metrics-grid" aria-live="polite">
          <article>
            <small>CPU / frame</small>
            <strong>{cpuFrameMs.toFixed(2)} ms</strong>
          </article>
          <article>
            <small>Energy</small>
            <strong>{energy.toFixed(2)}</strong>
          </article>
          <article>
            <small>Average speed</small>
            <strong>{averageSpeed.toFixed(3)}</strong>
          </article>
          <article>
            <small>MSAA</small>
            <strong>{msaaSamples}x</strong>
          </article>
        </div>
      </header>

      <div className="lab-stage" ref={containerRef}>
        <canvas ref={canvasRef} className="lab-canvas" aria-label="Interactive magnetic blob field" />
      </div>

      <section className="lab-control-grid" aria-label="Magnetic simulation controls">
        <label>
          <span>Field strength</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={fieldStrength}
            onChange={(event) => setFieldStrength(Number(event.target.value))}
          />
          <strong>{fieldStrength.toFixed(2)}</strong>
        </label>

        <label>
          <span>Viscosity</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={viscosity}
            onChange={(event) => setViscosity(Number(event.target.value))}
          />
          <strong>{viscosity.toFixed(2)}</strong>
        </label>

        <label>
          <span>Particle count</span>
          <input
            type="range"
            min={minParticleCount}
            max={maxParticleCount}
            step={20}
            value={particleCount}
            onChange={(event) => setParticleCount(Number(event.target.value))}
          />
          <strong>{particleCount}</strong>
        </label>

        <label>
          <span>Field model</span>
          <select value={model} onChange={(event) => setModel(event.target.value as MagneticSimulationConfig['model'])}>
            <option value="dipole">Dipole</option>
            <option value="biot-savart">Biot-Savart</option>
          </select>
        </label>

        <label>
          <span>Blend mode</span>
          <select value={blendMode} onChange={(event) => setBlendMode(event.target.value as MagneticBlendMode)}>
            <option value="spherical">Spherical</option>
            <option value="ellipsoid">Ellipsoid</option>
            <option value="metaball">Metaball</option>
          </select>
        </label>

        <label>
          <span>Color gradient</span>
          <select value={gradientId} onChange={(event) => setGradientId(event.target.value)}>
            {gradientPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="lab-recording-panel" aria-label="Pointer interaction recording and playback">
        <div className="lab-recording-actions">
          <button type="button" onClick={onToggleRecording}>
            {recording ? 'Stop recording' : 'Record interactions'}
          </button>
          <button type="button" onClick={onPlaySequence} disabled={recordedSamples.length === 0}>
            Play sequence
          </button>
          <button type="button" onClick={onExportRecording} disabled={recordedSamples.length === 0}>
            Export JSON
          </button>
          <label className="telemetry-opt-in">
            <input type="checkbox" checked={telemetryOptInState} onChange={onToggleTelemetry} />
            <span>Telemetry opt-in (GDPR)</span>
          </label>
        </div>

        <label className="lab-import-label">
          <span>Import QA sequence JSON</span>
          <textarea
            rows={4}
            value={importBuffer}
            onChange={(event) => setImportBuffer(event.target.value)}
            placeholder="Paste exported interaction JSON here."
          />
        </label>

        <div className="lab-recording-foot">
          <button type="button" onClick={onImportSequence}>
            Load imported sequence
          </button>
          <small>
            Captured samples: {recordedSamples.length}
            {playback ? ' · Playback running' : ''}
          </small>
        </div>
      </section>
    </section>
  );
};

export default MagneticBlobsLab;
