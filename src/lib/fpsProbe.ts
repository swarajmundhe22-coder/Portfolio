export interface FpsSnapshot {
  component: string;
  fps: number;
  avgFrameMs: number;
  sampleWindowMs: number;
  lowFpsThreshold: number;
  lowFpsWindows: number;
  timestamp: string;
}

interface ComponentMetricsStore {
  latest: FpsSnapshot | null;
  history: FpsSnapshot[];
  lowFpsThreshold: number;
}

interface PerfWindow extends Window {
  __AGON_FPS_METRICS__?: Record<string, ComponentMetricsStore>;
  __AGON_ENABLE_FPS_PROBE__?: boolean;
}

export interface FpsProbeOptions {
  componentName: string;
  sampleWindowMs?: number;
  lowFpsThreshold?: number;
  historyLimit?: number;
}

export interface FpsProbeHandle {
  recordFrame: (frameTime: number) => void;
  reset: () => void;
}

const DEFAULT_SAMPLE_WINDOW_MS = 1000;
const DEFAULT_LOW_FPS_THRESHOLD = 58;
const DEFAULT_HISTORY_LIMIT = 180;

const round = (value: number, digits = 2): number => Number(value.toFixed(digits));

const isProbeEnabled = (perfWindow: PerfWindow): boolean => {
  if (perfWindow.__AGON_ENABLE_FPS_PROBE__ === true) {
    return true;
  }

  const params = new URLSearchParams(perfWindow.location.search);
  return params.get('perf') === '1';
};

const getMetricsStore = (
  perfWindow: PerfWindow,
  componentName: string,
  lowFpsThreshold: number,
): ComponentMetricsStore => {
  if (!perfWindow.__AGON_FPS_METRICS__) {
    perfWindow.__AGON_FPS_METRICS__ = {};
  }

  if (!perfWindow.__AGON_FPS_METRICS__[componentName]) {
    perfWindow.__AGON_FPS_METRICS__[componentName] = {
      latest: null,
      history: [],
      lowFpsThreshold,
    };
  }

  const store = perfWindow.__AGON_FPS_METRICS__[componentName];
  store.lowFpsThreshold = lowFpsThreshold;
  return store;
};

export const createFpsProbe = ({
  componentName,
  sampleWindowMs = DEFAULT_SAMPLE_WINDOW_MS,
  lowFpsThreshold = DEFAULT_LOW_FPS_THRESHOLD,
  historyLimit = DEFAULT_HISTORY_LIMIT,
}: FpsProbeOptions): FpsProbeHandle => {
  if (typeof window === 'undefined') {
    return {
      recordFrame: () => undefined,
      reset: () => undefined,
    };
  }

  const perfWindow = window as PerfWindow;
  let lastFrameTime = 0;
  let windowStart = 0;
  let frameCount = 0;
  let accumulatedFrameMs = 0;
  let lowFpsWindows = 0;

  const publishSnapshot = (frameTime: number): void => {
    if (!isProbeEnabled(perfWindow) || frameCount === 0) {
      return;
    }

    const elapsedMs = Math.max(1, frameTime - windowStart);
    const fps = (frameCount / elapsedMs) * 1000;

    if (fps < lowFpsThreshold) {
      lowFpsWindows += 1;
    }

    const snapshot: FpsSnapshot = {
      component: componentName,
      fps: round(fps),
      avgFrameMs: round(accumulatedFrameMs / frameCount),
      sampleWindowMs: round(elapsedMs),
      lowFpsThreshold,
      lowFpsWindows,
      timestamp: new Date().toISOString(),
    };

    const store = getMetricsStore(perfWindow, componentName, lowFpsThreshold);
    store.latest = snapshot;
    store.history.push(snapshot);

    if (store.history.length > historyLimit) {
      store.history.splice(0, store.history.length - historyLimit);
    }
  };

  const reset = (): void => {
    lastFrameTime = 0;
    windowStart = 0;
    frameCount = 0;
    accumulatedFrameMs = 0;
    lowFpsWindows = 0;
  };

  const recordFrame = (frameTime: number): void => {
    if (!Number.isFinite(frameTime)) {
      return;
    }

    if (lastFrameTime === 0) {
      lastFrameTime = frameTime;
      windowStart = frameTime;
      return;
    }

    const delta = frameTime - lastFrameTime;
    lastFrameTime = frameTime;

    // Ignore huge spikes from tab switches and timer clamping.
    if (delta <= 0 || delta > 1000) {
      return;
    }

    frameCount += 1;
    accumulatedFrameMs += delta;

    if (frameTime - windowStart < sampleWindowMs) {
      return;
    }

    publishSnapshot(frameTime);
    windowStart = frameTime;
    frameCount = 0;
    accumulatedFrameMs = 0;
  };

  return {
    recordFrame,
    reset,
  };
};
