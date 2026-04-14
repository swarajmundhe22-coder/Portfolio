export const PARTICLE_STRIDE = 8;

export type MagneticFieldModel = 'biot-savart' | 'dipole';

export type MagneticBlendMode = 'spherical' | 'ellipsoid' | 'metaball';

export interface MagneticPointerState {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface MagneticSimulationConfig {
  model: MagneticFieldModel;
  fieldStrength: number;
  viscosity: number;
  pointerStrength: number;
  boundaryDamping: number;
  interactionRadius: number;
}

export interface MagneticStepResult {
  energy: number;
  averageSpeed: number;
}

export const defaultMagneticConfig: MagneticSimulationConfig = {
  model: 'dipole',
  fieldStrength: 1,
  viscosity: 0.18,
  pointerStrength: 0.9,
  boundaryDamping: 0.88,
  interactionRadius: 0.58,
};

const epsilon = 1e-4;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const createSeededRandom = (seed: number): (() => number) => {
  let state = Math.max(1, Math.floor(seed)) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

export const createInitialParticleState = (
  particleCount: number,
  seed = 1337,
): Float32Array => {
  const random = createSeededRandom(seed);
  const output = new Float32Array(particleCount * PARTICLE_STRIDE);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * PARTICLE_STRIDE;
    const angle = random() * Math.PI * 2;
    const radius = 0.15 + random() * 0.8;
    const speed = (random() - 0.5) * 0.2;
    const momentAngle = random() * Math.PI * 2;

    output[offset + 0] = Math.cos(angle) * radius;
    output[offset + 1] = Math.sin(angle) * radius;
    output[offset + 2] = Math.cos(angle + Math.PI * 0.5) * speed;
    output[offset + 3] = Math.sin(angle + Math.PI * 0.5) * speed;
    output[offset + 4] = Math.cos(momentAngle);
    output[offset + 5] = Math.sin(momentAngle);
    output[offset + 6] = 1.2 + random() * 1.6;
    output[offset + 7] = 0.7 + random() * 0.6;
  }

  return output;
};

export const ensureForceBuffer = (particleCount: number): Float32Array =>
  new Float32Array(particleCount * 2);

const pairForceScale = (
  model: MagneticFieldModel,
  strength: number,
  alignment: number,
  invDistance: number,
): number => {
  if (model === 'biot-savart') {
    return strength * alignment * invDistance * invDistance;
  }

  return strength * alignment * invDistance * invDistance * invDistance;
};

export const accumulateMagneticForces = (
  state: Float32Array,
  particleCount: number,
  pointer: MagneticPointerState,
  config: MagneticSimulationConfig,
  outForces: Float32Array,
): void => {
  outForces.fill(0);

  const cappedStrength = clamp(config.fieldStrength, 0, 2);
  const interactionRadiusSq = config.interactionRadius * config.interactionRadius;

  for (let a = 0; a < particleCount; a += 1) {
    const aStateOffset = a * PARTICLE_STRIDE;
    const aForceOffset = a * 2;
    const ax = state[aStateOffset + 0];
    const ay = state[aStateOffset + 1];
    const amx = state[aStateOffset + 4];
    const amy = state[aStateOffset + 5];

    for (let b = a + 1; b < particleCount; b += 1) {
      const bStateOffset = b * PARTICLE_STRIDE;
      const bForceOffset = b * 2;

      const dx = state[bStateOffset + 0] - ax;
      const dy = state[bStateOffset + 1] - ay;
      const distanceSq = dx * dx + dy * dy + epsilon;

      if (distanceSq > interactionRadiusSq) {
        continue;
      }

      const invDistance = 1 / Math.sqrt(distanceSq);
      const bmx = state[bStateOffset + 4];
      const bmy = state[bStateOffset + 5];
      const alignment = amx * bmx + amy * bmy;
      const radial = pairForceScale(config.model, cappedStrength, alignment, invDistance);
      const repulsion = 0.00035 * invDistance * invDistance;

      const fx = dx * (radial - repulsion);
      const fy = dy * (radial - repulsion);

      outForces[aForceOffset + 0] += fx;
      outForces[aForceOffset + 1] += fy;
      outForces[bForceOffset + 0] -= fx;
      outForces[bForceOffset + 1] -= fy;

      if (config.model === 'biot-savart') {
        const swirl = (amx * dy - amy * dx) * 0.03 * cappedStrength * invDistance;
        const swirlFx = -dy * swirl;
        const swirlFy = dx * swirl;

        outForces[aForceOffset + 0] += swirlFx;
        outForces[aForceOffset + 1] += swirlFy;
        outForces[bForceOffset + 0] -= swirlFx;
        outForces[bForceOffset + 1] -= swirlFy;
      }
    }

    if (pointer.active) {
      const pdx = pointer.x - ax;
      const pdy = pointer.y - ay;
      const pointerDistSq = pdx * pdx + pdy * pdy + 0.0125;
      const pointerInfluence =
        clamp(config.pointerStrength, 0, 2) /
        (pointerDistSq * Math.sqrt(pointerDistSq));

      outForces[aForceOffset + 0] += pdx * pointerInfluence + pointer.vx * 0.04;
      outForces[aForceOffset + 1] += pdy * pointerInfluence + pointer.vy * 0.04;
    }
  }
};

export const integrateVelocityVerlet = (
  current: Float32Array,
  next: Float32Array,
  forces: Float32Array,
  particleCount: number,
  deltaSeconds: number,
  config: MagneticSimulationConfig,
): number => {
  const viscosity = clamp(config.viscosity, 0, 1);
  const damping = clamp(1 - viscosity * 0.12, 0.86, 1);
  const dt = clamp(deltaSeconds, 1 / 240, 1 / 20);

  let speedAccumulation = 0;

  for (let index = 0; index < particleCount; index += 1) {
    const stateOffset = index * PARTICLE_STRIDE;
    const forceOffset = index * 2;

    let x = current[stateOffset + 0];
    let y = current[stateOffset + 1];
    let vx = current[stateOffset + 2];
    let vy = current[stateOffset + 3];
    const mx = current[stateOffset + 4];
    const my = current[stateOffset + 5];
    const radius = current[stateOffset + 6];
    const mass = current[stateOffset + 7];

    const ax = forces[forceOffset + 0] / Math.max(0.3, mass);
    const ay = forces[forceOffset + 1] / Math.max(0.3, mass);

    vx = (vx + ax * dt) * damping;
    vy = (vy + ay * dt) * damping;

    x += vx * dt;
    y += vy * dt;

    if (Math.abs(x) > 1) {
      x = Math.sign(x);
      vx *= -config.boundaryDamping;
    }

    if (Math.abs(y) > 1) {
      y = Math.sign(y);
      vy *= -config.boundaryDamping;
    }

    next[stateOffset + 0] = x;
    next[stateOffset + 1] = y;
    next[stateOffset + 2] = vx;
    next[stateOffset + 3] = vy;
    next[stateOffset + 4] = mx;
    next[stateOffset + 5] = my;
    next[stateOffset + 6] = radius;
    next[stateOffset + 7] = mass;

    speedAccumulation += Math.hypot(vx, vy);
  }

  return speedAccumulation / Math.max(1, particleCount);
};

export const computeSystemEnergy = (
  state: Float32Array,
  particleCount: number,
  config: MagneticSimulationConfig,
): number => {
  let kinetic = 0;
  let potential = 0;

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * PARTICLE_STRIDE;
    const vx = state[offset + 2];
    const vy = state[offset + 3];
    const mass = state[offset + 7];
    kinetic += 0.5 * mass * (vx * vx + vy * vy);
  }

  for (let a = 0; a < particleCount; a += 1) {
    const aOffset = a * PARTICLE_STRIDE;
    const ax = state[aOffset + 0];
    const ay = state[aOffset + 1];
    const amx = state[aOffset + 4];
    const amy = state[aOffset + 5];

    for (let b = a + 1; b < particleCount; b += 1) {
      const bOffset = b * PARTICLE_STRIDE;
      const dx = state[bOffset + 0] - ax;
      const dy = state[bOffset + 1] - ay;
      const invDistance = 1 / Math.sqrt(dx * dx + dy * dy + epsilon);
      const bmx = state[bOffset + 4];
      const bmy = state[bOffset + 5];
      const alignment = amx * bmx + amy * bmy;

      potential += -config.fieldStrength * alignment * invDistance * 0.01;
    }
  }

  return kinetic + potential;
};

export const stepMagneticSimulation = (
  current: Float32Array,
  next: Float32Array,
  forces: Float32Array,
  particleCount: number,
  pointer: MagneticPointerState,
  config: MagneticSimulationConfig,
  deltaSeconds: number,
): MagneticStepResult => {
  accumulateMagneticForces(current, particleCount, pointer, config, forces);
  const averageSpeed = integrateVelocityVerlet(
    current,
    next,
    forces,
    particleCount,
    deltaSeconds,
    config,
  );

  return {
    energy: computeSystemEnergy(next, particleCount, config),
    averageSpeed,
  };
};
