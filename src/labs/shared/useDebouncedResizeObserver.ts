import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
  dpr: number;
}

const defaultSize: ElementSize = {
  width: 0,
  height: 0,
  dpr: 1,
};

const round = (value: number): number => Math.max(0, Math.round(value));

export const useDebouncedResizeObserver = (
  targetRef: RefObject<HTMLElement | null>,
  debounceMs = 120,
  dprCap = 2,
): ElementSize => {
  const [size, setSize] = useState<ElementSize>(defaultSize);

  const normalizedDebounceMs = useMemo(() => Math.max(16, debounceMs), [debounceMs]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }

    let timer = 0;

    const commit = (nextWidth: number, nextHeight: number): void => {
      const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, dprCap);
      setSize({
        width: round(nextWidth),
        height: round(nextHeight),
        dpr,
      });
    };

    const updateFromDom = (): void => {
      const rect = target.getBoundingClientRect();
      commit(rect.width, rect.height);
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        const box = entry.contentRect;
        commit(box.width, box.height);
      }, normalizedDebounceMs);
    });

    updateFromDom();
    observer.observe(target);

    const onWindowResize = (): void => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(updateFromDom, normalizedDebounceMs);
    };

    window.addEventListener('resize', onWindowResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onWindowResize);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [dprCap, normalizedDebounceMs, targetRef]);

  return size;
};
