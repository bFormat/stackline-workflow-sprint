import { describe, it, expect } from 'vitest';
import { hardDropScore, lineClearScore, softDropScore } from '../src/game/scoring.js';

describe('scoring formula', () => {
  it('awards 100 * level for a single line clear', () => {
    expect(lineClearScore(1, 1)).toBe(100);
    expect(lineClearScore(1, 5)).toBe(500);
  });

  it('awards the expected base values for 1..4 line clears at level 1', () => {
    expect(lineClearScore(1, 1)).toBe(100);
    expect(lineClearScore(2, 1)).toBe(300);
    expect(lineClearScore(3, 1)).toBe(500);
    expect(lineClearScore(4, 1)).toBe(800);
  });

  it('returns zero score when no lines were cleared', () => {
    expect(lineClearScore(0, 9)).toBe(0);
  });

  it('caps awards at the four-line value if more rows are passed in', () => {
    expect(lineClearScore(7, 1)).toBe(800);
  });

  it('credits 1 point per soft-drop cell and 2 points per hard-drop cell', () => {
    expect(softDropScore(0)).toBe(0);
    expect(softDropScore(12)).toBe(12);
    expect(hardDropScore(0)).toBe(0);
    expect(hardDropScore(7)).toBe(14);
  });

  it('treats negative inputs as zero', () => {
    expect(softDropScore(-4)).toBe(0);
    expect(hardDropScore(-2)).toBe(0);
    expect(lineClearScore(-1, 5)).toBe(0);
  });
});
