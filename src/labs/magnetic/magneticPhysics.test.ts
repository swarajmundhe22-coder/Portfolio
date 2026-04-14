import { describe, expect, test } from 'vitest';
import {
  PARTICLE_STRIDE,
  accumulateMagneticForces,
  computeSystemEnergy,
  createInitialParticleState,
  defaultMagneticConfig,
  ensureForceBuffer,
  stepMagneticSimulation,
} from './magneticPhysics';

const inactivePointer = {
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
};

describe('magneticPhysics', () => {
  test('force accumulation is pairwise balanced', () => {
    const state = new Float32Array(2 * PARTICLE_STRIDE);

    state[0] = -0.2;
    state[1] = 0;
    state[2] = 0;
    state[3] = 0;
    state[4] = 1;
    state[5] = 0;
    state[6] = 1;
    state[7] = 1;

    const secondOffset = PARTICLE_STRIDE;
    state[secondOffset + 0] = 0.2;
    state[secondOffset + 1] = 0;
    state[secondOffset + 2] = 0;
    state[secondOffset + 3] = 0;
    state[secondOffset + 4] = 1;
    state[secondOffset + 5] = 0;
    state[secondOffset + 6] = 1;
    state[secondOffset + 7] = 1;

    const forces = ensureForceBuffer(2);

    accumulateMagneticForces(
      state,
      2,
      inactivePointer,
      {
        ...defaultMagneticConfig,
        model: 'dipole',
        interactionRadius: 1,
      },
      forces,
    );

    expect(forces[0]).toBeCloseTo(-forces[2], 6);
    expect(forces[1]).toBeCloseTo(-forces[3], 6);
  });

  test('verlet integration remains bounded over long runs', () => {
    const buffers = [
      createInitialParticleState(64, 9001),
      new Float32Array(createInitialParticleState(64, 9001).length),
    ];
    let frontIndex = 0;
    const forces = ensureForceBuffer(64);

    const config = {
      ...defaultMagneticConfig,
      fieldStrength: 0.65,
      viscosity: 0.22,
      interactionRadius: 0.45,
    };

    for (let frame = 0; frame < 1200; frame += 1) {
      const front = buffers[frontIndex] as Float32Array;
      const back = buffers[1 - frontIndex] as Float32Array;
      stepMagneticSimulation(front, back, forces, 64, inactivePointer, config, 1 / 120);
      frontIndex = 1 - frontIndex;
    }

    const front = buffers[frontIndex] as Float32Array;

    for (let index = 0; index < 64; index += 1) {
      const offset = index * PARTICLE_STRIDE;
      const x = front[offset + 0];
      const y = front[offset + 1];
      const vx = front[offset + 2];
      const vy = front[offset + 3];

      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(vx)).toBe(true);
      expect(Number.isFinite(vy)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(1.05);
      expect(Math.abs(y)).toBeLessThanOrEqual(1.05);
    }
  });

  test('low-viscosity mode remains finite and bounded', () => {
    const buffers = [
      createInitialParticleState(24, 42),
      new Float32Array(createInitialParticleState(24, 42).length),
    ];
    let frontIndex = 0;
    const forces = ensureForceBuffer(24);
    let peakAverageSpeed = 0;

    const config = {
      ...defaultMagneticConfig,
      fieldStrength: 0.4,
      viscosity: 0.02,
      interactionRadius: 0.35,
    };

    for (let frame = 0; frame < 500; frame += 1) {
      const front = buffers[frontIndex] as Float32Array;
      const back = buffers[1 - frontIndex] as Float32Array;
      const result = stepMagneticSimulation(front, back, forces, 24, inactivePointer, config, 1 / 240);
      peakAverageSpeed = Math.max(peakAverageSpeed, result.averageSpeed);
      frontIndex = 1 - frontIndex;
    }

    const front = buffers[frontIndex] as Float32Array;
    const finalEnergy = computeSystemEnergy(front, 24, config);

    expect(Number.isFinite(finalEnergy)).toBe(true);
    expect(peakAverageSpeed).toBeLessThan(25);

    for (let index = 0; index < 24; index += 1) {
      const offset = index * PARTICLE_STRIDE;
      const x = front[offset + 0];
      const y = front[offset + 1];

      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(1.05);
      expect(Math.abs(y)).toBeLessThanOrEqual(1.05);
    }
  });
});
