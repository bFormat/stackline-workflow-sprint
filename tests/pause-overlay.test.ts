// Tests for the accessible pause overlay component + P/ESC pause toggling.
//
// Covers acceptance criterion: pressing P or ESC toggles a pause overlay
// that is visible, has an accessible role/label, and announces state via
// aria-live.

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { mountPauseOverlay } from '../src/components/Pause/PauseOverlay';
import { actionForKey } from '../src/input';
import { createInitialState, reduce } from '../src/engine';

describe('PauseOverlay — DOM accessibility surface', () => {
  let dom: JSDOM;
  let host: HTMLElement;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="host"></div>');
    host = dom.window.document.getElementById('host') as unknown as HTMLElement;
  });

  it('mounts a dialog-role element with a visible label and aria-live', () => {
    const handle = mountPauseOverlay({ host });
    const el = handle.element;

    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('aria-live')).toBe('assertive');

    const labelledBy = el.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const labelEl = dom.window.document.getElementById(labelledBy as string);
    expect(labelEl).not.toBeNull();
    expect((labelEl!.textContent ?? '').toLowerCase()).toContain('paused');
  });

  it('is focusable via tabindex so keyboard users can land on it', () => {
    const handle = mountPauseOverlay({ host });
    expect(handle.element.getAttribute('tabindex')).toBe('-1');
  });

  it('setPaused toggles visibility, aria-hidden, and data-state', () => {
    const handle = mountPauseOverlay({ host });
    const el = handle.element;

    // Hidden initially.
    expect(handle.isPaused()).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.dataset.state).toBe('resumed');
    expect(el.classList.contains('pause-overlay--hidden')).toBe(true);

    // Show.
    handle.setPaused(true);
    expect(handle.isPaused()).toBe(true);
    expect(el.getAttribute('aria-hidden')).toBe('false');
    expect(el.dataset.state).toBe('paused');
    expect(el.classList.contains('pause-overlay--hidden')).toBe(false);

    // Hide.
    handle.setPaused(false);
    expect(handle.isPaused()).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.dataset.state).toBe('resumed');
    expect(el.classList.contains('pause-overlay--hidden')).toBe(true);
  });

  it('destroy removes the overlay from the host', () => {
    const handle = mountPauseOverlay({ host });
    expect(host.contains(handle.element)).toBe(true);
    handle.destroy();
    expect(host.contains(handle.element)).toBe(false);
  });
});

describe('Pause toggling — keyboard P and ESC', () => {
  it('maps both KeyP and Escape to the PAUSE action', () => {
    expect(actionForKey('KeyP')).toEqual({ type: 'PAUSE' });
    expect(actionForKey('Escape')).toEqual({ type: 'PAUSE' });
  });

  it('PAUSE action toggles status and the overlay accessible attribute', () => {
    const dom = new JSDOM('<!DOCTYPE html><div id="host"></div>');
    const host = dom.window.document.getElementById('host') as unknown as HTMLElement;
    const handle = mountPauseOverlay({ host });

    let state = createInitialState(42);
    state = reduce(state, { type: 'START' });
    handle.setPaused(state.status === 'paused');
    expect(handle.element.getAttribute('aria-hidden')).toBe('true');

    // P pressed.
    state = reduce(state, actionForKey('KeyP')!);
    handle.setPaused(state.status === 'paused');
    expect(state.status).toBe('paused');
    expect(handle.element.getAttribute('aria-hidden')).toBe('false');
    expect(handle.element.dataset.state).toBe('paused');

    // ESC pressed (resume).
    state = reduce(state, actionForKey('Escape')!);
    handle.setPaused(state.status === 'paused');
    expect(state.status).toBe('playing');
    expect(handle.element.getAttribute('aria-hidden')).toBe('true');
    expect(handle.element.dataset.state).toBe('resumed');
  });
});
