/**
 * Level / gravity progression.
 *
 * Level is 1-based and advances every LINES_PER_LEVEL lines cleared.
 * Gravity is expressed as the delay between automatic 1-cell drops, in
 * milliseconds. Each level shaves a fixed factor off the previous delay
 * until reaching a hard floor.
 */
export const LINES_PER_LEVEL = 10;
export const BASE_DELAY_MS = 800;
export const MIN_DELAY_MS = 60;
export const DELAY_DECAY = 0.85; // each level = previous * 0.85

export function levelForLines(totalLines) {
  return 1 + Math.floor(Math.max(0, totalLines) / LINES_PER_LEVEL);
}

export function gravityDelayMs(level) {
  const lvl = Math.max(1, level);
  const raw = BASE_DELAY_MS * DELAY_DECAY ** (lvl - 1);
  return Math.max(MIN_DELAY_MS, raw);
}
