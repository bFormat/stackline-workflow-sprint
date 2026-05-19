// Polish: HUD numeric clarity.
// Asserts that renderHud writes scoring numbers using a thousand-separator
// format so the player can read large totals at a glance. Small integers
// stay free of separators, and non-finite inputs degrade to a safe '0'.
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { formatHudNumber, renderHud, RenderRefs } from '../src/render';
import { createInitialState } from '../src/engine';

function makeRefs(): { refs: RenderRefs; doc: Document } {
  const dom = new JSDOM(
    '<!doctype html><html><body>' +
    '<canvas id="board"></canvas>' +
    '<canvas id="hold"></canvas>' +
    '<canvas id="queue"></canvas>' +
    '<span id="score"></span>' +
    '<span id="level"></span>' +
    '<span id="lines"></span>' +
    '<div id="overlay"></div>' +
    '<button id="pauseBtn"></button>' +
    '</body></html>',
  );
  const doc = dom.window.document;
  const refs: RenderRefs = {
    board: doc.getElementById('board') as unknown as HTMLCanvasElement,
    hold: doc.getElementById('hold') as unknown as HTMLCanvasElement,
    queue: doc.getElementById('queue') as unknown as HTMLCanvasElement,
    score: doc.getElementById('score') as unknown as HTMLElement,
    level: doc.getElementById('level') as unknown as HTMLElement,
    lines: doc.getElementById('lines') as unknown as HTMLElement,
    overlay: doc.getElementById('overlay') as unknown as HTMLElement,
    pauseBtn: doc.getElementById('pauseBtn') as unknown as HTMLButtonElement,
  };
  return { refs, doc };
}

describe('formatHudNumber', () => {
  it('leaves small integers unseparated', () => {
    expect(formatHudNumber(0)).toBe('0');
    expect(formatHudNumber(7)).toBe('7');
    expect(formatHudNumber(999)).toBe('999');
  });

  it('inserts a thousands separator past four digits', () => {
    expect(formatHudNumber(1000)).toBe('1,000');
    expect(formatHudNumber(12345)).toBe('12,345');
    expect(formatHudNumber(1234567)).toBe('1,234,567');
  });

  it('truncates fractional values and tolerates non-finite input', () => {
    expect(formatHudNumber(1500.9)).toBe('1,500');
    expect(formatHudNumber(Number.NaN)).toBe('0');
    expect(formatHudNumber(Number.POSITIVE_INFINITY)).toBe('0');
  });
});

describe('renderHud — scoring display clarity', () => {
  it('writes thousand-separated numbers into the score/level/lines slots', () => {
    const { refs } = makeRefs();
    const state = {
      ...createInitialState(1),
      score: 12345,
      level: 4,
      lines: 1200,
      status: 'playing' as const,
    };
    renderHud(refs, state);
    expect(refs.score.textContent).toBe('12,345');
    expect(refs.level.textContent).toBe('4');
    expect(refs.lines.textContent).toBe('1,200');
    expect(refs.pauseBtn.textContent).toBe('Pause');
  });

  it('shows Resume on the pause button while paused', () => {
    const { refs } = makeRefs();
    const state = { ...createInitialState(1), status: 'paused' as const };
    renderHud(refs, state);
    expect(refs.pauseBtn.textContent).toBe('Resume');
  });
});
