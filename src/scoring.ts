/**
 * Scoring & level progression.
 *
 * Line-clear base values are scaled by (level). A soft drop awards 1
 * point per cell descended; a hard drop awards 2 per cell.
 *
 * The level advances every 10 lines cleared; gravity speeds up alongside.
 */

export const BASE_LINE_SCORES = [0, 100, 300, 500, 800] as const;

export interface Score {
  score: number;
  level: number;
  lines: number;
}

export function newScore(startLevel = 1): Score {
  return { score: 0, level: Math.max(1, startLevel), lines: 0 };
}

/** Returns the points awarded for clearing `linesCleared` rows at `level`. */
export function lineClearPoints(linesCleared: number, level: number): number {
  if (linesCleared <= 0) return 0;
  const idx = Math.min(linesCleared, BASE_LINE_SCORES.length - 1);
  return BASE_LINE_SCORES[idx] * Math.max(1, level);
}

/** Add line-clear points and possibly advance level. Mutates and returns. */
export function applyLineClear(score: Score, linesCleared: number): Score {
  if (linesCleared <= 0) return score;
  score.score += lineClearPoints(linesCleared, score.level);
  score.lines += linesCleared;
  const newLevel = Math.max(score.level, Math.floor(score.lines / 10) + 1);
  score.level = newLevel;
  return score;
}

export function addSoftDrop(score: Score, cells: number): Score {
  if (cells > 0) score.score += cells;
  return score;
}

export function addHardDrop(score: Score, cells: number): Score {
  if (cells > 0) score.score += cells * 2;
  return score;
}
