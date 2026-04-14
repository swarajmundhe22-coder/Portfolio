import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AnimatedListLab from './AnimatedListLab';

afterEach(() => {
  cleanup();
});

describe('AnimatedListLab', () => {
  it('supports roving tabindex keyboard navigation', () => {
    render(<AnimatedListLab />);

    const listbox = screen.getByRole('listbox', { name: 'Animated list entries' });
    const initialItems = within(listbox).getAllByRole('option');

    expect(initialItems[0].getAttribute('tabindex')).toBe('0');
    expect(initialItems[1].getAttribute('tabindex')).toBe('-1');

    fireEvent.keyDown(initialItems[0], { key: 'ArrowDown' });

    const updatedItems = within(listbox).getAllByRole('option');
    expect(updatedItems[0].getAttribute('tabindex')).toBe('-1');
    expect(updatedItems[1].getAttribute('tabindex')).toBe('0');
  });

  it('announces add and dismiss changes via live region', () => {
    render(<AnimatedListLab />);

    const addButton = screen.getByRole('button', { name: 'Add item' });
    fireEvent.click(addButton);

    const liveRegion = screen.getByText(/items after insertion/i);
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');

    const listbox = screen.getByRole('listbox', { name: 'Animated list entries' });
    const focusedOption = within(listbox).getAllByRole('option')[0];
    fireEvent.keyDown(focusedOption, { key: 'Delete' });

    expect(screen.getByText(/Removed/i)).toBeTruthy();
  });
});
