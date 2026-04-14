export type GalaxyPresetName = 'spiral' | 'elliptical' | 'starburst';

export const GALAXY_PRESETS: GalaxyPresetName[] = ['spiral', 'elliptical', 'starburst'];

export interface GalaxyPresetBuffers {
  positions: Float32Array;
  luminosity: Float32Array;
}

export const galaxyLayerVelocities = [1, 0.7, 0.5, 0.3, 0.15] as const;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const createSeededRandom = (seed: number): (() => number) => {
  let state = Math.max(1, seed | 0);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
};

export const particleCountByLayer = 25_000;
export const layerCount = 5;
export const totalGalaxyParticleCount = particleCountByLayer * layerCount;

const generateSpiralPosition = (
  random: () => number,
  layer: number,
  localIndex: number,
  perLayer: number,
): [number, number, number, number] => {
  const normalized = localIndex / perLayer;
  const arm = localIndex % 4;
  const baseAngle = normalized * Math.PI * 12 + arm * (Math.PI / 2);
  const jitter = (random() - 0.5) * 0.35;
  const radius = normalized * (0.3 + random() * 1.8) + layer * 0.18;

  const x = Math.cos(baseAngle + jitter) * radius;
  const y = (random() - 0.5) * 0.28;
  const z = -layer * 0.75 - normalized * 0.3;
  const size = 1.5 + (1 / (1 + Math.abs(z))) * 6.2;

  return [x, y, z, size];
};

const generateEllipticalPosition = (
  random: () => number,
  layer: number,
  localIndex: number,
  perLayer: number,
): [number, number, number, number] => {
  const theta = random() * Math.PI * 2;
  const radial = Math.sqrt(localIndex / perLayer) * (1.4 + random() * 0.9);
  const x = Math.cos(theta) * radial;
  const y = Math.sin(theta) * radial * 0.44;
  const z = -layer * 0.68 - random() * 0.6;
  const size = 1.2 + (1 / (1 + Math.abs(z))) * 6.5;

  return [x, y, z, size];
};

const generateStarburstPosition = (
  random: () => number,
  layer: number,
  localIndex: number,
  perLayer: number,
): [number, number, number, number] => {
  const spokeCount = 36;
  const spokeIndex = localIndex % spokeCount;
  const spokeTheta = (spokeIndex / spokeCount) * Math.PI * 2;
  const radial = Math.sqrt(localIndex / perLayer) * (2 + random() * 2.2);

  const x = Math.cos(spokeTheta) * radial + (random() - 0.5) * 0.08;
  const y = Math.sin(spokeTheta) * radial + (random() - 0.5) * 0.08;
  const z = -layer * 0.82 - random() * 0.4;
  const size = 1 + (1 / (1 + Math.abs(z))) * 7;

  return [x, y, z, size];
};

export const generatePresetPositions = (
  preset: GalaxyPresetName,
  particleCount = totalGalaxyParticleCount,
  seed = 9103,
): Float32Array => {
  const output = new Float32Array(particleCount * 4);
  const random = createSeededRandom(seed + preset.length * 17);
  const perLayer = Math.max(1, Math.floor(particleCount / layerCount));

  for (let index = 0; index < particleCount; index += 1) {
    const layer = Math.min(layerCount - 1, Math.floor(index / perLayer));
    const localIndex = index - layer * perLayer;

    const offset = index * 4;

    let position: [number, number, number, number];
    if (preset === 'spiral') {
      position = generateSpiralPosition(random, layer, localIndex, perLayer);
    } else if (preset === 'elliptical') {
      position = generateEllipticalPosition(random, layer, localIndex, perLayer);
    } else {
      position = generateStarburstPosition(random, layer, localIndex, perLayer);
    }

    output[offset + 0] = position[0];
    output[offset + 1] = position[1];
    output[offset + 2] = position[2];
    output[offset + 3] = position[3];
  }

  return output;
};

export const buildLayerAttributes = (particleCount = totalGalaxyParticleCount): Float32Array => {
  const output = new Float32Array(particleCount * 4);
  const perLayer = Math.max(1, Math.floor(particleCount / layerCount));

  for (let index = 0; index < particleCount; index += 1) {
    const layer = Math.min(layerCount - 1, Math.floor(index / perLayer));
    const offset = index * 4;

    output[offset + 0] = layer;
    output[offset + 1] = (index % perLayer) / perLayer;
    output[offset + 2] = (index % 97) / 97;
    output[offset + 3] = (index % 53) / 53;
  }

  return output;
};

export const kelvinToRgb = (temperatureKelvin: number): [number, number, number] => {
  const temperature = clamp(temperatureKelvin, 1000, 40_000) / 100;

  let red: number;
  let green: number;
  let blue: number;

  if (temperature <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(temperature) - 161.1195681661;
  } else {
    red = 329.698727446 * (temperature - 60) ** -0.1332047592;
    green = 288.1221695283 * (temperature - 60) ** -0.0755148492;
  }

  if (temperature >= 66) {
    blue = 255;
  } else if (temperature <= 19) {
    blue = 0;
  } else {
    blue = 138.5177312231 * Math.log(temperature - 10) - 305.0447927307;
  }

  return [
    clamp(red, 0, 255) / 255,
    clamp(green, 0, 255) / 255,
    clamp(blue, 0, 255) / 255,
  ];
};

export const buildGalaxyPreset = (
  preset: GalaxyPresetName,
  particleCount = totalGalaxyParticleCount,
  seed = 9103,
): GalaxyPresetBuffers => {
  const packed = generatePresetPositions(preset, particleCount, seed);
  const positions = new Float32Array(particleCount * 3);
  const luminosity = new Float32Array(particleCount);

  for (let index = 0; index < particleCount; index += 1) {
    const packedOffset = index * 4;
    const positionOffset = index * 3;

    positions[positionOffset + 0] = packed[packedOffset + 0];
    positions[positionOffset + 1] = packed[packedOffset + 1];
    positions[positionOffset + 2] = packed[packedOffset + 2];
    luminosity[index] = clamp(packed[packedOffset + 3] / 8, 0.12, 1);
  }

  return {
    positions,
    luminosity,
  };
};
