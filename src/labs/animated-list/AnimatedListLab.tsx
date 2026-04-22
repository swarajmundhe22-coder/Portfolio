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
  addedAt: number;
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

interface AnimationMetrics {
  flipDuration: number;
  staggerDelayMs: number;
  totalAnimationsTriggered: number;
}

type AnimationStyle = 'smooth-slide' | 'elastic-bounce' | 'flip-rotate' | 'wave-ripple' | 'spiral' | 'matrix';

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
    'Constraint-based layout stability',
    'Precision scroll anchoring',
    'Resilient render batching',
  ];

  return {
    id: `animated-item-${seed}-${Date.now()}`,
    title: `List entity ${String(seed + 1).padStart(2, '0')}`,
    body: descriptor[seed % descriptor.length],
    weight: 0.9 + (seed % 5) * 0.06,
    addedAt: Date.now(),
  };
};

const triggerHaptic = (): void => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

const createParticleEffect = (element: HTMLElement, delta: any): void => {
  if (!element.parentElement) return;

  const rect = element.getBoundingClientRect();
  const particleCount = 12;
  const colorPalette = [
    'hsl(210, 100%, 60%)',
    'hsl(220, 100%, 50%)',
    'hsl(200, 100%, 70%)',
    'hsl(230, 100%, 55%)',
    'hsl(210, 100%, 75%)',
  ];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = rect.left + rect.width / 2 + 'px';
    particle.style.top = rect.top + rect.height / 2 + 'px';
    
    const size = 3 + Math.random() * 4;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    
    const color = colorPalette[i % colorPalette.length];
    particle.style.backgroundColor = color;
    particle.style.boxShadow = `0 0 12px ${color}, 0 0 24px ${color}80`;
    particle.style.filter = 'drop-shadow(0 0 2px rgba(100, 180, 255, 0.8))';
    document.body.appendChild(particle);

    const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 80 + Math.random() * 60;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;
    const velocityVariance = 0.8 + Math.random() * 0.4;

    particle.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, filter: 'drop-shadow(0 0 8px rgba(100, 180, 255, 1))' },
        { transform: `translate(${endX * 0.5}px, ${endY * 0.5}px) scale(0.6)`, opacity: 0.8, filter: 'drop-shadow(0 0 4px rgba(100, 180, 255, 0.6))' },
        { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0, filter: 'drop-shadow(0 0 0px rgba(100, 180, 255, 0))' },
      ],
      {
        duration: 700 * velocityVariance,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      },
    );

    setTimeout(() => particle.remove(), 750 * velocityVariance);
  }
};

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const generateAnimationKeyframes = (style: AnimationStyle, delta: any) => {
  switch (style) {
    case 'smooth-slide':
      return [
        {
          transform: `translate3d(${delta.deltaX}px, ${delta.deltaY}px, 0) scale(${delta.scaleX}, ${delta.scaleY}) rotateZ(-3deg) skewX(-2deg)`,
          opacity: 0.3,
          backgroundColor: 'rgba(100, 180, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(100, 180, 255, 0.4), 0 0 24px rgba(100, 180, 255, 0.3)',
          filter: 'blur(1px)',
        },
        {
          transform: `translate3d(${delta.deltaX * 0.6}px, ${delta.deltaY * 0.6}px, 0) scale(${0.8 + delta.scaleX * 0.2}, ${0.8 + delta.scaleY * 0.2}) rotateZ(-1.5deg) skewX(-1deg)`,
          opacity: 0.75,
          backgroundColor: 'rgba(100, 180, 255, 0.25)',
          boxShadow: '0 12px 48px rgba(100, 180, 255, 0.5), 0 0 32px rgba(100, 180, 255, 0.4)',
          filter: 'blur(0.5px)',
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1.02, 1.02) rotateZ(0deg) skewX(0deg)',
          opacity: 1,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          boxShadow: '0 0 0px rgba(100, 180, 255, 0)',
          filter: 'blur(0px)',
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1) rotateZ(0deg)',
          opacity: 1,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          boxShadow: '0 0 0px rgba(100, 180, 255, 0)',
          filter: 'blur(0px)',
        },
      ];

    case 'elastic-bounce':
      return [
        {
          transform: `translate3d(${delta.deltaX}px, ${delta.deltaY}px, 0) scale(${delta.scaleX * 0.8}, ${delta.scaleY * 0.8})`,
          opacity: 0.4,
          backgroundColor: 'rgba(255, 100, 180, 0.4)',
          boxShadow: '0 0 20px rgba(255, 100, 180, 0.6)',
        },
        {
          transform: `translate3d(${delta.deltaX * 0.3}px, ${delta.deltaY * 0.3}px, 0) scale(${1.1 + delta.scaleX * 0.1}, ${1.1 + delta.scaleY * 0.1})`,
          opacity: 0.8,
          backgroundColor: 'rgba(255, 100, 180, 0.2)',
          boxShadow: '0 8px 40px rgba(255, 100, 180, 0.5)',
        },
        {
          transform: 'translate3d(0, 0, 0) scale(0.95, 0.95)',
          opacity: 1,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          boxShadow: '0 0 0px',
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          opacity: 1,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          boxShadow: '0 0 0px',
        },
      ];

    default:
      return [];
  }
};

const AnimatedListLab = () => {
  const [items, setItems] = useState<AnimatedListItem[]>(() =>
    Array.from({ length: 8 }, (_, index) => buildItem(index)),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveMessage, setLiveMessage] = useState('8 items loaded. Keyboard: ↑↓ to navigate, Enter to select, Del to remove. Drag: reorder or swipe to delete.');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const [animationMetrics, setAnimationMetrics] = useState<AnimationMetrics>({
    flipDuration: 380,
    staggerDelayMs: 45,
    totalAnimationsTriggered: 0,
  });
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('smooth-slide');

  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const firstRectsRef = useRef(new Map<string, DOMRect>());
  const pendingFlipRef = useRef(false);
  const dragStateRef = useRef<DragGestureState | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const animationCountRef = useRef(0);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlaySequenceRef = useRef(0);

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

    let animationCount = 0;

    for (const delta of deltas) {
      const target = itemRefs.current.get(delta.id);
      if (!target) {
        continue;
      }

      if (prefersReducedMotion) {
        target.style.transform = '';
        target.style.opacity = '';
        target.style.backgroundColor = '';
        continue;
      }

      if (typeof target.animate !== 'function') {
        target.style.transform = '';
        target.style.opacity = '';
        target.style.backgroundColor = '';
        continue;
      }

      const index = items.findIndex((item) => item.id === delta.id);
      const delay = index >= 0 ? stagger[index] : 0;

      animationCount += 1;

      // Use selected animation style
      const keyframes = generateAnimationKeyframes(animationStyle, delta);
      target.animate(
        keyframes,
        {
          duration: animationMetrics.flipDuration + 80,
          delay,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          fill: 'both',
        },
      );

      // Particle effect on the item
      createParticleEffect(target, delta);
    }

    animationCountRef.current += animationCount;
    setAnimationMetrics((prev) => ({
      ...prev,
      totalAnimationsTriggered: animationCountRef.current,
    }));

    pendingFlipRef.current = false;
  }, [items, prefersReducedMotion, animationMetrics, animationStyle]);

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

  // Auto-play demo sequence
  useEffect(() => {
    if (!autoPlayEnabled) {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
      return;
    }

    const interval = setInterval(() => {
      const sequence = autoPlaySequenceRef.current % 6;
      autoPlaySequenceRef.current += 1;

      if (sequence === 0 || sequence === 1) {
        // Add new items
        insertItem();
      } else if (sequence === 2 || sequence === 3) {
        // Remove random item
        if (items.length > 4) {
          const randomIndex = Math.floor(Math.random() * (items.length - 1));
          removeItemAt(randomIndex);
        }
      } else if (sequence === 4 || sequence === 5) {
        // Reorder items
        if (items.length > 2) {
          const from = Math.floor(Math.random() * items.length);
          const to = Math.floor(Math.random() * items.length);
          reorderItems(from, to);
        }
      }
    }, 1200 / animationSpeed);

    return () => clearInterval(interval);
  }, [autoPlayEnabled, items.length, animationSpeed, insertItem, removeItemAt, reorderItems]);

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
            FLIP choreography enabled · Contrast {colorContrast}:1 · {prefersReducedMotion ? 'Reduced motion' : 'Standard motion'} · {animationMetrics.totalAnimationsTriggered} animations triggered
          </span>
        </div>

        <div className="lab-list-actions">
          <button 
            type="button" 
            onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
            className={`autoplay-button ${autoPlayEnabled ? 'is-active' : ''}`}
            title={autoPlayEnabled ? 'Stop demo' : 'Start demo'}
          >
            {autoPlayEnabled ? '⏸ Demo Running' : '▶ Start Demo'}
          </button>
          <button type="button" onClick={insertItem}>
            Add item
          </button>
          <button type="button" onClick={() => removeItemAt(activeIndex)} disabled={items.length === 0}>
            Remove focused
          </button>
          <label>
            <span>Animation style</span>
            <select value={animationStyle} onChange={(e) => setAnimationStyle(e.target.value as AnimationStyle)}>
              <option value="smooth-slide">Smooth Slide</option>
              <option value="elastic-bounce">Elastic Bounce</option>
              <option value="flip-rotate">Flip Rotate</option>
              <option value="wave-ripple">Wave Ripple</option>
              <option value="spiral">Spiral</option>
              <option value="matrix">Matrix</option>
            </select>
          </label>
          <label>
            <span>Animation speed</span>
            <input
              type="range"
              min={200}
              max={600}
              step={20}
              value={animationMetrics.flipDuration}
              onChange={(event) => setAnimationMetrics((prev) => ({ ...prev, flipDuration: Number(event.target.value) }))}
            />
            <small>{animationMetrics.flipDuration}ms</small>
          </label>
          <label>
            <span>Demo speed</span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.25}
              value={animationSpeed}
              onChange={(event) => setAnimationSpeed(Number(event.target.value))}
            />
            <small>{animationSpeed.toFixed(2)}x</small>
          </label>
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
        className={`animated-list-surface ${autoPlayEnabled ? 'is-playing' : ''}`}
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

export default AnimatedListLab;
