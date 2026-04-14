import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
} from 'react';
import {
  buildExponentialStagger,
  deriveFlipDeltas,
  getContrastRatio,
  reorderByIndex,
} from './animatedListUtils';
import { isTelemetryOptIn, setTelemetryOptIn } from '../shared/runtimeTelemetry';

interface AnimatedListItem {
  id: string;
  title: string;
  body: string;
  weight: number;
}

interface DragGestureState {
  itemId: string;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startedAt: number;
  mode: 'idle' | 'swipe' | 'drag';
  sourceIndex: number;
  targetIndex: number;
}

const maxItems = 20;
let listSeed = 0;

const buildItem = (variant?: number): AnimatedListItem => {
  const seed = typeof variant === 'number' ? variant : listSeed++;
  const descriptor = [
    'Latency aware transition tuning',
    'Cross-device gesture fidelity',
    'Hydration-safe stagger sequencing',
    'A11y-first interaction feedback',
    'Low-shift dynamic content rendering',
  ];

  return {
    id: `animated-item-${seed}-${Date.now()}`,
    title: `List entity ${String(seed + 1).padStart(2, '0')}`,
    body: descriptor[seed % descriptor.length],
    weight: 0.9 + (seed % 5) * 0.06,
  };
};

const triggerHaptic = (): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const AnimatedListLab = () => {
  const [items, setItems] = useState<AnimatedListItem[]>(() =>
    Array.from({ length: 8 }, (_, index) => buildItem(index)),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveMessage, setLiveMessage] = useState('8 items loaded.');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);

  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const firstRectsRef = useRef(new Map<string, DOMRect>());
  const pendingFlipRef = useRef(false);
  const dragStateRef = useRef<DragGestureState | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

  const colorContrast = useMemo(() => getContrastRatio('#f5f8ff', '#0b1022'), []);

  useEffect(() => {
    setTelemetryEnabled(isTelemetryOptIn());
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setPrefersReducedMotion(false);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyPreference = (matches: boolean): void => {
      setPrefersReducedMotion(matches);
    };

    applyPreference(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent): void => {
      applyPreference(event.matches);
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    if (!pendingFlipRef.current) {
      return;
    }

    const finalRects = new Map<string, DOMRect>();
    itemRefs.current.forEach((element, id) => {
      finalRects.set(id, element.getBoundingClientRect());
    });

    const deltas = deriveFlipDeltas(firstRectsRef.current, finalRects);
    const stagger = buildExponentialStagger(items.length);

    for (const delta of deltas) {
      const target = itemRefs.current.get(delta.id);
      if (!target) {
        continue;
      }

      if (prefersReducedMotion) {
        target.style.transform = '';
        target.style.opacity = '';
        continue;
      }

      if (typeof target.animate !== 'function') {
        target.style.transform = '';
        target.style.opacity = '';
        continue;
      }

      const index = items.findIndex((item) => item.id === delta.id);
      const delay = index >= 0 ? stagger[index] : 0;

      target.animate(
        [
          {
            transform: `translate3d(${delta.deltaX}px, ${delta.deltaY}px, 0) scale(${delta.scaleX}, ${delta.scaleY})`,
            opacity: 0.78,
          },
          {
            transform: 'translate3d(0, 0, 0) scale(1, 1)',
            opacity: 1,
          },
        ],
        {
          duration: 380,
          delay,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        },
      );
    }

    pendingFlipRef.current = false;
  }, [items, prefersReducedMotion]);

  const announce = (message: string): void => {
    setLiveMessage(message);
  };

  const captureRectsBeforeUpdate = (): void => {
    firstRectsRef.current = new Map();
    itemRefs.current.forEach((element, id) => {
      firstRectsRef.current.set(id, element.getBoundingClientRect());
    });
    pendingFlipRef.current = true;
  };

  const focusItem = (index: number): void => {
    const bounded = Math.max(0, Math.min(index, items.length - 1));
    const item = items[bounded];
    if (!item) {
      return;
    }

    setActiveIndex(bounded);
    itemRefs.current.get(item.id)?.focus();
  };

  const insertItem = (): void => {
    if (items.length >= maxItems) {
      announce(`Maximum ${maxItems} items reached.`);
      return;
    }

    captureRectsBeforeUpdate();
    setItems((current) => {
      const next = [...current, buildItem()];
      announce(`${next.length} items after insertion.`);
      return next;
    });
  };

  const removeItemAt = (index: number): void => {
    const item = items[index];
    if (!item) {
      return;
    }

    captureRectsBeforeUpdate();
    setItems((current) => {
      const next = current.filter((entry) => entry.id !== item.id);
      const nextIndex = Math.max(0, Math.min(index, next.length - 1));
      setActiveIndex(nextIndex);
      announce(`Removed ${item.title}. ${next.length} items remain.`);
      return next;
    });
  };

  const reorderItems = (from: number, to: number): void => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
      return;
    }

    captureRectsBeforeUpdate();
    setItems((current) => {
      const next = reorderByIndex(current, from, to);
      const moved = next[to];
      announce(`Moved ${moved?.title ?? 'item'} to position ${to + 1}.`);
      return next;
    });

    setActiveIndex(to);
    triggerHaptic();
  };

  const onItemKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const currentItem = items[index];
    if (!currentItem) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(index + 1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(index - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusItem(items.length - 1);
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeItemAt(index);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      announce(`${currentItem.title} focused for interaction.`);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, index: number): void => {
    const item = items[index];
    if (!item) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragPointerIdRef.current = event.pointerId;

    dragStateRef.current = {
      itemId: item.id,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startedAt: event.timeStamp,
      mode: 'idle',
      sourceIndex: index,
      targetIndex: index,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const dragState = dragStateRef.current;
    if (!dragState || dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    const target = itemRefs.current.get(dragState.itemId);
    if (!target) {
      return;
    }

    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;

    if (dragState.mode === 'idle') {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        dragState.mode = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'drag';
      }
    }

    if (dragState.mode === 'swipe') {
      target.style.transform = `translate3d(${dx}px, 0, 0)`;
      target.style.opacity = String(clampNumber(1 - Math.abs(dx) / 260, 0.35, 1));
    }

    if (dragState.mode === 'drag') {
      target.style.transform = `translate3d(0, ${dy}px, 0)`;

      const midline = event.clientY;
      let nextTargetIndex = dragState.sourceIndex;

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const element = item ? itemRefs.current.get(item.id) : null;
        if (!element) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (midline < rect.top + rect.height / 2) {
          nextTargetIndex = index;
          break;
        }

        nextTargetIndex = index;
      }

      dragState.targetIndex = nextTargetIndex;
    }

    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;
  };

  const onPointerEnd = (event: PointerEvent<HTMLButtonElement>): void => {
    const dragState = dragStateRef.current;
    if (!dragState || dragPointerIdRef.current !== event.pointerId) {
      return;
    }

    const target = itemRefs.current.get(dragState.itemId);
    if (target) {
      target.style.transform = '';
      target.style.opacity = '';
      target.releasePointerCapture(event.pointerId);
    }

    const elapsed = Math.max(1, event.timeStamp - dragState.startedAt);
    const dx = dragState.lastX - dragState.startX;
    const velocity = dx / elapsed;

    if (dragState.mode === 'swipe' && Math.abs(velocity) >= 0.2) {
      removeItemAt(dragState.sourceIndex);
      triggerHaptic();
    } else if (dragState.mode === 'drag') {
      reorderItems(dragState.sourceIndex, dragState.targetIndex);
    }

    dragStateRef.current = null;
    dragPointerIdRef.current = null;
  };

  const onToggleTelemetry = (enabled: boolean): void => {
    setTelemetryOptIn(enabled);
    setTelemetryEnabled(enabled);
  };

  return (
    <section className="lab-shell" aria-label="Animated list interaction lab">
      <header className="lab-shell-head">
        <div>
          <p>Interaction component</p>
          <h2>Animated List</h2>
          <span>
            FLIP choreography enabled · Contrast {colorContrast}:1 · {prefersReducedMotion ? 'Reduced motion' : 'Standard motion'}
          </span>
        </div>

        <div className="lab-list-actions">
          <button type="button" onClick={insertItem}>
            Add item
          </button>
          <button type="button" onClick={() => removeItemAt(activeIndex)} disabled={items.length === 0}>
            Remove focused
          </button>
          <label>
            <span>Font scale</span>
            <input
              type="range"
              min={0.85}
              max={1.35}
              step={0.01}
              value={fontScale}
              onChange={(event) => setFontScale(Number(event.target.value))}
            />
          </label>
          <label className="telemetry-opt-in">
            <input
              type="checkbox"
              checked={telemetryEnabled}
              onChange={(event) => onToggleTelemetry(event.target.checked)}
            />
            <span>Telemetry opt-in (GDPR)</span>
          </label>
        </div>
      </header>

      <p className="animated-list-summary" aria-live="polite">
        {items.length} items rendered. Active item {Math.min(activeIndex + 1, Math.max(1, items.length))}.
      </p>

      <ul
        className="animated-list-surface"
        role="listbox"
        aria-label="Animated list entries"
        style={{ '--list-font-scale': String(fontScale) } as CSSProperties}
      >
        {items.map((item, index) => (
          <li key={item.id} role="none" className="animated-list-row">
            <button
              ref={(node) => {
                if (node) {
                  itemRefs.current.set(item.id, node);
                } else {
                  itemRefs.current.delete(item.id);
                }
              }}
              type="button"
              role="option"
              aria-selected={activeIndex === index}
              tabIndex={activeIndex === index ? 0 : -1}
              className={`animated-list-item ${activeIndex === index ? 'is-active' : ''}`}
              onFocus={() => setActiveIndex(index)}
              onKeyDown={(event) => onItemKeyDown(event, index)}
              onPointerDown={(event) => onPointerDown(event, index)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
            >
              <span className="animated-list-order">{String(index + 1).padStart(2, '0')}</span>
              <span className="animated-list-copy">
                <strong style={{ fontWeight: 600 * item.weight }}>{item.title}</strong>
                <small>{item.body}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>
    </section>
  );
};

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export default AnimatedListLab;
