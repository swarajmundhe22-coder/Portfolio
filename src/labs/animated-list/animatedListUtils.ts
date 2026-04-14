export interface FlipDelta {
  id: string;
  deltaX: number;
  deltaY: number;
  scaleX: number;
  scaleY: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const buildExponentialStagger = (
  itemCount: number,
  minimumDelayMs = 40,
  maximumDelayMs = 60,
  totalCapMs = 700,
): number[] => {
  if (itemCount <= 0) {
    return [];
  }

  const stagger: number[] = new Array(itemCount).fill(0);
  let accumulated = 0;

  for (let index = 1; index < itemCount; index += 1) {
    const exponentialStep = minimumDelayMs * 1.12 ** (index - 1);
    const stepDelay = clamp(exponentialStep, minimumDelayMs, maximumDelayMs);

    if (accumulated + stepDelay > totalCapMs) {
      stagger[index] = accumulated;
      continue;
    }

    accumulated += stepDelay;
    stagger[index] = accumulated;
  }

  return stagger;
};

export const deriveFlipDeltas = (
  firstRectMap: Map<string, DOMRect>,
  lastRectMap: Map<string, DOMRect>,
): FlipDelta[] => {
  const deltas: FlipDelta[] = [];

  for (const [id, first] of firstRectMap.entries()) {
    const last = lastRectMap.get(id);
    if (!last) {
      continue;
    }

    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const scaleX = first.width / Math.max(1, last.width);
    const scaleY = first.height / Math.max(1, last.height);

    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5 || Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) {
      deltas.push({
        id,
        deltaX,
        deltaY,
        scaleX,
        scaleY,
      });
    }
  }

  return deltas;
};

const luminanceFromRgb = (value: number): number => {
  const normalized = value / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
};

export const getContrastRatio = (foregroundHex: string, backgroundHex: string): number => {
  const [fr, fg, fb] = hexToRgb(foregroundHex);
  const [br, bg, bb] = hexToRgb(backgroundHex);

  const foregroundLuminance =
    0.2126 * luminanceFromRgb(fr) +
    0.7152 * luminanceFromRgb(fg) +
    0.0722 * luminanceFromRgb(fb);
  const backgroundLuminance =
    0.2126 * luminanceFromRgb(br) +
    0.7152 * luminanceFromRgb(bg) +
    0.0722 * luminanceFromRgb(bb);

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
};

export const reorderByIndex = <T>(source: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) {
    return source.slice();
  }

  const normalizedTarget = clamp(toIndex, 0, source.length - 1);
  const output = source.slice();
  const [moved] = output.splice(fromIndex, 1);

  if (typeof moved === 'undefined') {
    return source.slice();
  }

  output.splice(normalizedTarget, 0, moved);
  return output;
};
