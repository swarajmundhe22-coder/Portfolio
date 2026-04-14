/* @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { stackTagRows } from '../data/portfolioData';
import StackRecordingReplica from './StackRecordingReplica';

const expectedChipCount = stackTagRows.reduce((count, row) => count + row.length, 0);
const viewportWidths = [320, 768, 1440, 1920];

beforeAll(() => {
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  cleanup();
});

const setViewportWidth = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });

  window.dispatchEvent(new Event('resize'));
};

describe('StackRecordingReplica chips', () => {
  it('renders a live scene layer instead of a prerecorded video element', () => {
    render(<StackRecordingReplica visualRegressionMode />);

    const stage = screen.getByRole('img', { name: /my skillset cinematic stack panel/i });
    expect(stage.querySelector('video')).toBeNull();

    const sceneLayer = stage.querySelector('.stack-recording-video');
    expect(sceneLayer).not.toBeNull();
    expect(sceneLayer?.tagName).not.toBe('VIDEO');
  });

  it('renders each chip as an isolated focusable button with SVG hit-zone geometry', () => {
    render(<StackRecordingReplica visualRegressionMode />);

    const chips = screen.getAllByRole('button');
    expect(chips).toHaveLength(expectedChipCount);

    chips.forEach((chip) => {
      expect(chip.getAttribute('role')).toBe('button');
      expect(chip.getAttribute('data-hit-zone-shape')).toBe('rounded-pill');
      expect(chip.getAttribute('data-chip-spacing')).toBe('2');

      const svg = chip.querySelector('svg.stack-chip-hit-zone-svg');
      const rect = chip.querySelector('rect.stack-chip-hit-zone-rect');

      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 120 48');
      expect(rect).not.toBeNull();
      expect(rect?.getAttribute('rx')).toBe('18');
      expect(rect?.getAttribute('ry')).toBe('18');
    });
  });

  it('uses roving tabindex with arrow-key navigation inside the chip group', async () => {
    const user = userEvent.setup();
    render(<StackRecordingReplica visualRegressionMode />);

    const chips = screen.getAllByRole('button');
    chips[0].focus();

    expect(document.activeElement).toBe(chips[0]);
    expect(chips[0].tabIndex).toBe(0);

    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(chips[1]);
    expect(chips[0].tabIndex).toBe(-1);
    expect(chips[1].tabIndex).toBe(0);

    await user.keyboard('{ArrowLeft}');

    expect(document.activeElement).toBe(chips[0]);
    expect(chips[0].tabIndex).toBe(0);
  });

  it('moves focus in DOM order with Tab and Shift-Tab', async () => {
    const user = userEvent.setup();
    render(<StackRecordingReplica visualRegressionMode />);

    const chips = screen.getAllByRole('button');
    chips[0].focus();

    await user.tab();
    expect(document.activeElement).toBe(chips[1]);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(chips[0]);
  });

  it('activates chips with Enter and Space using the same click event flow', async () => {
    const user = userEvent.setup();
    const onChipActivate = vi.fn();

    render(<StackRecordingReplica visualRegressionMode onChipActivate={onChipActivate} />);

    const chip = screen.getByRole('button', { name: /ReactJS technology chip/i });
    chip.focus();

    await user.keyboard('{Enter}');
    await user.keyboard('{Space}');
    await user.click(chip);

    await waitFor(() => {
      expect(onChipActivate).toHaveBeenCalledTimes(3);
    });

    onChipActivate.mock.calls.forEach(([detail]) => {
      expect(detail.trigger).toBe('click');
      expect(typeof detail.timestamp).toBe('number');
    });
  });

  it('keeps focus ring visibility and >=48px hit targets at 200% zoom across viewport set', async () => {
    for (const width of viewportWidths) {
      setViewportWidth(width);

      const { unmount } = render(
        <div style={{ zoom: '2', width: `${width}px` }}>
          <StackRecordingReplica visualRegressionMode />
        </div>,
      );

      const chips = screen.getAllByRole('button');
      chips[0].focus();

      await waitFor(() => {
        expect(chips[0].classList.contains('is-focus-ring')).toBe(true);
      });

      expect(chips[0].style.outline).toMatch(/^3px solid (rgb\(11, 87, 192\)|#0B57C0)$/i);
      expect(chips[0].style.outlineOffset).toBe('2px');
      expect(Number.parseFloat(chips[0].style.minWidth)).toBeGreaterThanOrEqual(48);
      expect(Number.parseFloat(chips[0].style.minHeight)).toBeGreaterThanOrEqual(48);

      unmount();
    }
  });
});
