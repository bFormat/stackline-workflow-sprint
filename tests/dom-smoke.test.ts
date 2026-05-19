// Smoke test that loads the source index.html in jsdom and confirms the
// playable canvas is the primary DOM landmark — i.e., the game is the
// first thing the user sees.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { resolve } from 'node:path';

describe('index.html — DOM smoke', () => {
  it('renders a game board canvas and HUD landmarks', () => {
    const html = readFileSync(resolve(__dirname, '..', 'index.html'), 'utf-8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const board = doc.getElementById('board');
    expect(board).not.toBeNull();
    expect(board!.tagName.toLowerCase()).toBe('canvas');

    expect(doc.getElementById('hold')).not.toBeNull();
    expect(doc.getElementById('queue')).not.toBeNull();
    expect(doc.getElementById('score')).not.toBeNull();
    expect(doc.getElementById('level')).not.toBeNull();
    expect(doc.getElementById('lines')).not.toBeNull();
    expect(doc.getElementById('pauseBtn')).not.toBeNull();
    expect(doc.getElementById('restartBtn')).not.toBeNull();
    expect(doc.getElementById('overlay')).not.toBeNull();

    // Touch controls visible/present
    const touchButtons = doc.querySelectorAll('[data-action]');
    expect(touchButtons.length).toBeGreaterThanOrEqual(6);

    // The first content element inside <main> should be the game stage,
    // ensuring there's no separate landing route shown before the game.
    const main = doc.querySelector('main.app');
    expect(main).not.toBeNull();
    const firstSection = main!.querySelector(':scope > section');
    expect(firstSection?.classList.contains('stage')).toBe(true);
  });
});
