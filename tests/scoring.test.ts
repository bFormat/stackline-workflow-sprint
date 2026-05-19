import { describe, expect, it } from 'vitest';
import {
  BASE_LINE_SCORES,
  addHardDrop,
  addSoftDrop,
  applyLineClear,
  lineClearPoints,
  newScore,
} from '../src/scoring.js';

describe('scoring', () => {
  it('awards base values × level for single/double/triple/quad clears', () => {
    expect(lineClearPoints(1, 1)).toBe(BASE_LINE_SCORES[1]);
    expect(lineClearPoints(2, 1)).toBe(BASE_LINE_SCORES[2]);
    expect(lineClearPoints(3, 1)).toBe(BASE_LINE_SCORES[3]);
    expect(lineClearPoints(4, 1)).toBe(BASE_LINE_SCORES[4]);

    expect(lineClearPoints(1, 5)).toBe(BASE_LINE_SCORES[1] * 5);
    expect(lineClearPoints(4, 7)).toBe(BASE_LINE_SCORES[4] * 7);
  });

  it('zero or negative line clears award zero', () => {
    expect(lineClearPoints(0, 5)).toBe(0);
    expect(lineClearPoints(-1, 5)).toBe(0);
  });

  it('applyLineClear updates score, lines, and level threshold', () => {
    const s = newScore(1);
    applyLineClear(s, 4); // 800 points at level 1, 4 lines.
    expect(s.score).toBe(800);
    expect(s.lines).toBe(4);
    expect(s.level).toBe(1);

    // Reach 10 lines -> level 2.
    applyLineClear(s, 4);
    applyLineClear(s, 2);
    expect(s.lines).toBe(10);
    expect(s.level).toBe(2);
  });

  it('soft drop awards 1/cell, hard drop awards 2/cell', () => {
    const s = newScore();
    addSoftDrop(s, 5);
    expect(s.score).toBe(5);
    addHardDrop(s, 10);
    expect(s.score).toBe(25);
  });
});
