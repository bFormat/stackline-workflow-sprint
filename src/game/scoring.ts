// Original scoring rules: not copied from any specific commercial product.
// Base points scale with how many rows clear at once; the level multiplier
// rewards staying alive longer.

export const LINES_PER_LEVEL = 10;
export const SOFT_DROP_POINTS_PER_CELL = 1;
export const HARD_DROP_POINTS_PER_CELL = 2;

const BASE_POINTS: Readonly<Record<0 | 1 | 2 | 3 | 4, number>> = {
  0: 0,
  1: 100,
  2: 250,
  3: 500,
  4: 900,
};

export function pointsForClear(lines: number, level: number): number {
  const key = Math.max(0, Math.min(4, lines)) as 0 | 1 | 2 | 3 | 4;
  return BASE_POINTS[key] * Math.max(1, level);
}

export function levelForLines(totalLines: number): number {
  return 1 + Math.floor(totalLines / LINES_PER_LEVEL);
}

/** Gravity interval in milliseconds. Falls faster as level increases. */
export function gravityIntervalMs(level: number): number {
  const clamped = Math.max(1, Math.min(20, level));
  // Start at ~800ms at level 1, asymptote toward ~60ms.
  const speed = 60 + 740 * Math.pow(0.85, clamped - 1);
  return Math.round(speed);
}
