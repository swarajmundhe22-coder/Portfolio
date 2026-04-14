import { describe, expect, it } from 'vitest';
import {
  buildGalaxyPreset,
  GALAXY_PRESETS,
  totalGalaxyParticleCount,
} from './galaxyPresets';

describe('galaxyPresets', () => {
  it('builds deterministic buffers for each preset and seed', () => {
    for (const preset of GALAXY_PRESETS) {
      const first = buildGalaxyPreset(preset, 2048, 77);
      const second = buildGalaxyPreset(preset, 2048, 77);

      expect(first.positions.length).toBe(2048 * 3);
      expect(first.luminosity.length).toBe(2048);

      expect(Array.from(first.positions.slice(0, 24))).toEqual(
        Array.from(second.positions.slice(0, 24)),
      );
      expect(Array.from(first.luminosity.slice(0, 24))).toEqual(
        Array.from(second.luminosity.slice(0, 24)),
      );
    }
  });

  it('returns finite sampled values across full default particle count', () => {
    const preset = buildGalaxyPreset('spiral', totalGalaxyParticleCount, 91);
    const positionStride = Math.max(1, Math.floor(preset.positions.length / 2000));
    const luminosityStride = Math.max(1, Math.floor(preset.luminosity.length / 1000));

    expect(preset.positions.length).toBe(totalGalaxyParticleCount * 3);
    expect(preset.luminosity.length).toBe(totalGalaxyParticleCount);

    for (let index = 0; index < preset.positions.length; index += positionStride) {
      const value = preset.positions[index] as number;
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(Number.isFinite(preset.positions[preset.positions.length - 1] as number)).toBe(true);

    for (let index = 0; index < preset.luminosity.length; index += luminosityStride) {
      const value = preset.luminosity[index] as number;
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    const tailLuminosity = preset.luminosity[preset.luminosity.length - 1] as number;
    expect(Number.isFinite(tailLuminosity)).toBe(true);
    expect(tailLuminosity).toBeGreaterThan(0);
    expect(tailLuminosity).toBeLessThanOrEqual(1);
  });
});
