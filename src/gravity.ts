/**
 * Gravity table.
 *
 * `frameInterval(level)` returns the milliseconds between automatic drops
 * for that level. Soft drop and hard drop bypass this timer.
 *
 * The curve is approximate and original — fast enough to feel urgent but
 * never sub-frame on a 60Hz display.
 */

const LEVEL_MS: Record<number, number> = {
  1: 800,
  2: 720,
  3: 630,
  4: 550,
  5: 470,
  6: 380,
  7: 300,
  8: 220,
  9: 160,
  10: 120,
  11: 100,
  12: 85,
  13: 70,
  14: 60,
  15: 50,
};

export function frameInterval(level: number): number {
  if (level <= 1) return LEVEL_MS[1];
  const max = 15;
  if (level >= max) return LEVEL_MS[max];
  return LEVEL_MS[level] ?? LEVEL_MS[max];
}

/** Lock delay before a grounded piece settles, in ms. */
export const LOCK_DELAY_MS = 500;

/** Maximum lock resets per piece (prevents infinite stalling). */
export const MAX_LOCK_RESETS = 15;
