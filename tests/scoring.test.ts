import { describe, expect, it } from 'vitest';
import {
  gravityIntervalMs,
  LINES_PER_LEVEL,
  levelForLines,
  pointsForClear,
} from '../src/game/scoring';

describe('scoring rules', () => {
  it('awards 100 points for a single line at level 1', () => {
    expect(pointsForClear(1, 1)).toBe(100);
  });

  it('awards more for clearing more lines at once', () => {
    expect(pointsForClear(2, 1)).toBeGreaterThan(pointsForClear(1, 1));
    expect(pointsForClear(3, 1)).toBeGreaterThan(pointsForClear(2, 1));
    expect(pointsForClear(4, 1)).toBeGreaterThan(pointsForClear(3, 1));
  });

  it('multi-line clears reward more than two singles', () => {
    expect(pointsForClear(2, 1)).toBeGreaterThan(2 * pointsForClear(1, 1));
    expect(pointsForClear(4, 1)).toBeGreaterThan(4 * pointsForClear(1, 1));
  });

  it('zero-line clears award no points', () => {
    expect(pointsForClear(0, 1)).toBe(0);
    expect(pointsForClear(0, 9)).toBe(0);
  });

  it('scales linearly with level', () => {
    expect(pointsForClear(1, 2)).toBe(2 * pointsForClear(1, 1));
    expect(pointsForClear(4, 3)).toBe(3 * pointsForClear(4, 1));
  });
});

describe('leveling', () => {
  it('starts at level 1', () => {
    expect(levelForLines(0)).toBe(1);
  });

  it('advances every LINES_PER_LEVEL cleared lines', () => {
    expect(levelForLines(LINES_PER_LEVEL - 1)).toBe(1);
    expect(levelForLines(LINES_PER_LEVEL)).toBe(2);
    expect(levelForLines(LINES_PER_LEVEL * 5)).toBe(6);
  });
});

describe('gravity timing', () => {
  it('decreases as level increases', () => {
    const slow = gravityIntervalMs(1);
    const fast = gravityIntervalMs(10);
    expect(slow).toBeGreaterThan(fast);
  });

  it('stays positive at high levels', () => {
    expect(gravityIntervalMs(20)).toBeGreaterThan(0);
  });
});
