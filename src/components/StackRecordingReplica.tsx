import { type KeyboardEvent, memo, useEffect, useMemo, useRef, useState } from 'react';
import { stackTagRows } from '../data/portfolioData';
import StackAnimationScene from './StackAnimationScene';

interface StackRecordingReplicaProps {
  className?: string;
  visualRegressionMode?: boolean;
  lockedFrameSeconds?: number;
  hideInteractiveOverlay?: boolean;
  disableVideoFilter?: boolean;
  onChipActivate?: (detail: StackChipActivationDetail) => void;
}

interface StackChip {
  id: string;
  index: number;
  rowIndex: number;
  columnIndex: number;
  label: string;
}

interface StackChipActivationDetail {
  chipId: string;
  index: number;
  label: string;
  trigger: 'click';
  timestamp: number;
}

const chipSpacingPx = 2;
const chipCornerRadiusPx = 18;
const minTapTargetPx = 48;

const focusRingInlineStyle = {
  outline: '3px solid #0B57C0',
  outlineOffset: '2px',
};

const toChipId = (label: string, rowIndex: number, columnIndex: number): string => {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `stack-chip-${rowIndex}-${columnIndex}-${slug}`;
};

const StackRecordingReplica = ({
  className,
  visualRegressionMode,
  lockedFrameSeconds,
  hideInteractiveOverlay,
  disableVideoFilter,
  onChipActivate,
}: StackRecordingReplicaProps) => {
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeChipIndex, setActiveChipIndex] = useState(0);
  const [focusRingIndex, setFocusRingIndex] = useState<number | null>(null);

  const flatChips = useMemo(() => {
    return stackTagRows.flatMap((row, rowIndex) =>
      row.map((label, columnIndex) => {
        const index = stackTagRows
          .slice(0, rowIndex)
          .reduce((count, previousRow) => count + previousRow.length, 0) + columnIndex;

        return {
          id: toChipId(label, rowIndex, columnIndex),
          index,
          rowIndex,
          columnIndex,
          label,
        } as StackChip;
      }),
    );
  }, []);

  const chipRows = useMemo(() => {
    return stackTagRows.map((row, rowIndex) =>
      row.map((label, columnIndex) => {
        const matchingChip = flatChips.find(
          (chip) => chip.rowIndex === rowIndex && chip.columnIndex === columnIndex,
        );

        return (
          matchingChip ?? {
            id: toChipId(label, rowIndex, columnIndex),
            index: 0,
            rowIndex,
            columnIndex,
            label,
          }
        );
      }),
    );
  }, [flatChips]);

  const chipCount = flatChips.length;
  const flatStackTags = useMemo(() => flatChips.map((chip) => chip.label), [flatChips]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const shouldFreezeScene =
    visualRegressionMode ||
    reducedMotion ||
    (typeof lockedFrameSeconds === 'number' && Number.isFinite(lockedFrameSeconds));

  const focusChipByIndex = (targetIndex: number): void => {
    const bounded = Math.max(0, Math.min(targetIndex, chipCount - 1));
    setActiveChipIndex(bounded);

    const nextChip = chipRefs.current[bounded];
    if (nextChip) {
      nextChip.focus();
    }
  };

  const emitChipActivation = (chip: StackChip, timestamp: number): void => {
    const activationDetail: StackChipActivationDetail = {
      chipId: chip.id,
      index: chip.index,
      label: chip.label,
      trigger: 'click',
      timestamp,
    };

    onChipActivate?.(activationDetail);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<StackChipActivationDetail>('stack-chip-activate', {
          detail: activationDetail,
        }),
      );
    }
  };

  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, chip: StackChip): void => {
    if (chipCount === 0) {
      return;
    }

    const isSpaceKey = event.key === ' ' || event.key === 'Space' || event.key === 'Spacebar' || event.code === 'Space';

    if (event.key === 'Enter' || isSpaceKey) {
      event.preventDefault();
      event.currentTarget.click();
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusChipByIndex(chip.index + 1);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusChipByIndex(chip.index - 1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusChipByIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusChipByIndex(chipCount - 1);
      return;
    }

    if (event.key === 'Tab') {
      if (event.shiftKey && chip.index > 0) {
        event.preventDefault();
        focusChipByIndex(chip.index - 1);
        return;
      }

      if (!event.shiftKey && chip.index < chipCount - 1) {
        event.preventDefault();
        focusChipByIndex(chip.index + 1);
      }
    }
  };

  return (
    <div className={`stack-recording-replica ${className ?? ''}`.trim()}>
      <p className="stack-recording-top-link" aria-hidden="true">
        see more projects -&gt;
      </p>

      <div className="stack-recording-stage" aria-label="My skillset cinematic stack panel" role="img">
        <div className="stack-recording-static-bg" aria-hidden="true" />
        <img className="stack-recording-orb" src="/project-4.jpg" alt="" aria-hidden="true" />
        <StackAnimationScene
          className={`stack-recording-video ${disableVideoFilter ? 'is-no-filter' : ''}`.trim()}
          visualRegressionMode={shouldFreezeScene}
          onReadyStateChange={setReady}
        />

        {!ready ? <div className="stack-recording-loading" aria-hidden="true" /> : null}

        <div className="stack-recording-fallback" aria-hidden={ready}>
          <p>MY SKILLSET</p>
          <h3>
            The Magic <span>Behind</span>
          </h3>
        </div>

        {!hideInteractiveOverlay ? (
          <div className={`stack-recording-chip-overlay ${ready ? 'is-video-ready' : ''}`}>
            <div className="stack-chip-group" role="group" aria-label="Interactive technology chips">
              {chipRows.map((row, rowIndex) => (
                <div className="stack-chip-row" key={`row-${rowIndex}`}>
                  {row.map((chip) => (
                    <button
                      key={chip.id}
                      ref={(node) => {
                        chipRefs.current[chip.index] = node;
                      }}
                      type="button"
                      role="button"
                      tabIndex={chip.index === activeChipIndex ? 0 : -1}
                      className={`stack-chip-button ${focusRingIndex === chip.index ? 'is-focus-ring' : ''}`}
                      aria-label={`${chip.label} technology chip`}
                      data-chip-index={chip.index}
                      data-chip-row={chip.rowIndex}
                      data-chip-column={chip.columnIndex}
                      data-chip-spacing={String(chipSpacingPx)}
                      data-chip-corner-radius={String(chipCornerRadiusPx)}
                      data-hit-zone-shape="rounded-pill"
                      onFocus={() => {
                        setActiveChipIndex(chip.index);
                        setFocusRingIndex(chip.index);
                      }}
                      onBlur={() => {
                        setFocusRingIndex((current) => (current === chip.index ? null : current));
                      }}
                      onKeyDown={(event) => onChipKeyDown(event, chip)}
                      onClick={(event) => emitChipActivation(chip, event.timeStamp)}
                      style={{
                        minWidth: `${minTapTargetPx}px`,
                        minHeight: `${minTapTargetPx}px`,
                        ...(focusRingIndex === chip.index ? focusRingInlineStyle : undefined),
                      }}
                    >
                      <span className="stack-chip-hit-zone" aria-hidden="true" />
                      <span className="stack-chip-content"><span className="stack-chip-label">{chip.label}</span></span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="stack-recording-a11y">
        <p>MY SKILLSET</p>
        <h3>The Magic Behind</h3>
        <ul>
          {flatStackTags.map((tag) => (
            <li key={`sr-${tag}`}>{tag}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default memo(StackRecordingReplica);

