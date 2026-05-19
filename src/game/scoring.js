/**
 * Stackline scoring formula.
 *
 * Line clear awards (multiplied by current level):
 *   1 line  -> 100
 *   2 lines -> 300
 *   3 lines -> 500
 *   4 lines -> 800
 *
 * Drop awards:
 *   soft drop -> 1 per cell traveled
 *   hard drop -> 2 per cell traveled
 *
 * Level is 1-based and acts as a straight multiplier on line-clear rewards.
 */
const LINE_AWARDS = [0, 100, 300, 500, 800];

export function lineClearScore(linesCleared, level) {
  if (linesCleared < 0) return 0;
  const capped = Math.min(linesCleared, LINE_AWARDS.length - 1);
  const base = LINE_AWARDS[capped];
  return base * Math.max(1, level);
}

export function softDropScore(cells) {
  return Math.max(0, cells) * 1;
}

export function hardDropScore(cells) {
  return Math.max(0, cells) * 2;
}
