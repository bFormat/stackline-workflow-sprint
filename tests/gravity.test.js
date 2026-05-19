import { describe, it, expect } from 'vitest';
import {
  BASE_DELAY_MS,
  DELAY_DECAY,
  LINES_PER_LEVEL,
  MIN_DELAY_MS,
  gravityDelayMs,
  levelForLines,
} from '../src/game/gravity.js';

describe('level and gravity progression', () => {
  it('starts at level 1 with the base gravity delay', () => {
    expect(levelForLines(0)).toBe(1);
    expect(gravityDelayMs(1)).toBeCloseTo(BASE_DELAY_MS);
  });

  it('advances one level for every LINES_PER_LEVEL lines cleared', () => {
    expect(levelForLines(LINES_PER_LEVEL - 1)).toBe(1);
    expect(levelForLines(LINES_PER_LEVEL)).toBe(2);
    expect(levelForLines(LINES_PER_LEVEL * 4 + 3)).toBe(5);
  });

  it('shrinks gravity delay multiplicatively with level', () => {
    const lvl2 = gravityDelayMs(2);
    const lvl3 = gravityDelayMs(3);
    expect(lvl2).toBeCloseTo(BASE_DELAY_MS * DELAY_DECAY);
    expect(lvl3).toBeCloseTo(BASE_DELAY_MS * DELAY_DECAY * DELAY_DECAY);
    expect(lvl3).toBeLessThan(lvl2);
  });

  it('never falls below the configured minimum gravity floor', () => {
    expect(gravityDelayMs(99)).toBe(MIN_DELAY_MS);
    expect(gravityDelayMs(1000)).toBe(MIN_DELAY_MS);
  });

  it('clamps non-positive levels to level 1', () => {
    expect(gravityDelayMs(0)).toBeCloseTo(BASE_DELAY_MS);
    expect(gravityDelayMs(-5)).toBeCloseTo(BASE_DELAY_MS);
  });
});
