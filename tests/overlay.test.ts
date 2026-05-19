// Polish: game-over message clarity.
// Asserts that renderOverlay swaps the title to a distinct "Game Over"
// heading and supplies a clearer restart hint when state.status is 'over',
// while keeping the default launch title for idle. Also guards against
// any forbidden trade-dress strings appearing in the overlay markup.
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderOverlay } from '../src/render';
import { createInitialState, GameState } from '../src/engine';

function loadOverlay(): { overlay: HTMLElement; doc: Document } {
  const html = readFileSync(resolve(__dirname, '..', 'index.html'), 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const overlay = doc.getElementById('overlay');
  if (!overlay) throw new Error('overlay missing from index.html');
  // The renderer reads/writes via the actual DOM API surface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).HTMLElement = dom.window.HTMLElement;
  return { overlay: overlay as unknown as HTMLElement, doc };
}

const FORBIDDEN = ['TETR.IO', 'tetrio', 'TETRIO', 'Tetrio', 'SRS', 'ARS'];

describe('renderOverlay — game-over polish', () => {
  let overlay: HTMLElement;
  let state: GameState;

  beforeEach(() => {
    overlay = loadOverlay().overlay;
    state = createInitialState(1);
  });

  it('shows the default title and begin hint when idle', () => {
    renderOverlay(overlay, { ...state, status: 'idle' });
    const title = overlay.querySelector('.title')!;
    const subtitle = overlay.querySelector('.subtitle')!;
    expect(title.innerHTML.toLowerCase()).toContain('stackline');
    expect(subtitle.textContent).toMatch(/begin/i);
    expect(overlay.classList.contains('is-over')).toBe(false);
  });

  it('swaps to a distinct Game Over title and clear restart hint when over', () => {
    renderOverlay(overlay, { ...state, status: 'over' });
    const title = overlay.querySelector('.title')!;
    const subtitle = overlay.querySelector('.subtitle')!;

    // Distinct, readable heading.
    expect(title.textContent?.trim()).toBe('Game Over');
    // Restart hint mentions multiple recovery paths.
    expect(subtitle.textContent).toMatch(/restart/i);
    expect(subtitle.textContent).toMatch(/key|tap|click/i);

    // Marker class drives the danger-color styling.
    expect(overlay.classList.contains('is-over')).toBe(true);
    expect(overlay.classList.contains('hidden')).toBe(false);
  });

  it('restores the default title after a fresh start from game over', () => {
    renderOverlay(overlay, { ...state, status: 'over' });
    renderOverlay(overlay, { ...state, status: 'idle' });
    const title = overlay.querySelector('.title')!;
    expect(title.textContent?.trim()).not.toBe('Game Over');
    expect(overlay.classList.contains('is-over')).toBe(false);
  });

  it('hides the overlay during play and clears state markers', () => {
    renderOverlay(overlay, { ...state, status: 'over' });
    renderOverlay(overlay, { ...state, status: 'playing' });
    expect(overlay.classList.contains('hidden')).toBe(true);
    expect(overlay.classList.contains('is-over')).toBe(false);
  });

  it('contains no forbidden trade-dress strings in any state', () => {
    for (const status of ['idle', 'paused', 'over', 'playing'] as const) {
      renderOverlay(overlay, { ...state, status });
      const html = overlay.innerHTML;
      for (const banned of FORBIDDEN) {
        expect(html).not.toContain(banned);
      }
    }
  });
});
