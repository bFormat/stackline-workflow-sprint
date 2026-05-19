import { isPlacementValid } from './board.js';

/**
 * Original wall-kick table for Stackline Sprint.
 *
 * For each (fromRotation -> toRotation) transition we try a list of (dx, dy)
 * offsets, in order, and accept the first one that fits the board. The CUBE
 * piece skips kicks because rotation is a no-op for it. The BAR piece gets
 * a wider kick set because it spans 4 cells; other pieces use a compact set.
 *
 * Note: These offsets are independently designed for Stackline. They are
 * NOT copied from any existing puzzle game's published kick table.
 */
const COMPACT_KICKS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
];

const BAR_KICKS = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
  [0, -2],
];

export function kicksFor(pieceId) {
  if (pieceId === 'CUBE') return [[0, 0]];
  if (pieceId === 'BAR') return BAR_KICKS;
  return COMPACT_KICKS;
}

/**
 * Attempt a rotation by `dir` (+1 = clockwise, -1 = counterclockwise).
 * Returns either the new piece pose or `null` if no kick fits.
 */
export function tryRotate(board, piece, dir) {
  const nextRotation = ((piece.rotation + dir) % 4 + 4) % 4;
  const kicks = kicksFor(piece.id);
  for (const [dx, dy] of kicks) {
    const candidate = {
      ...piece,
      rotation: nextRotation,
      x: piece.x + dx,
      y: piece.y + dy,
    };
    if (isPlacementValid(board, candidate)) {
      return candidate;
    }
  }
  return null;
}
