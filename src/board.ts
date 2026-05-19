/**
 * Playfield grid and collision helpers.
 *
 * The board is a fixed-size 2D array. Empty cells are `null`; filled cells
 * store the colour string of the piece that locked there.
 */

import type { PieceId, Shape } from './pieces.js';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type CellColor = string | null;
export type BoardGrid = CellColor[][];

export function createEmptyBoard(
  width: number = BOARD_WIDTH,
  height: number = BOARD_HEIGHT,
): BoardGrid {
  return Array.from({ length: height }, () => Array<CellColor>(width).fill(null));
}

export interface ActivePiece {
  id: PieceId;
  color: string;
  shape: Shape;
  row: number;
  col: number;
  state: 0 | 1 | 2 | 3;
}

export function collides(board: BoardGrid, shape: Shape, row: number, col: number): boolean {
  const h = board.length;
  const w = board[0].length;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const br = row + r;
      const bc = col + c;
      if (br < 0) continue; // allow spawning above visible area
      if (br >= h || bc < 0 || bc >= w) return true;
      if (board[br][bc] !== null) return true;
    }
  }
  return false;
}

/** Stamp `shape` onto the board at (row,col) using `color`. */
export function lockShape(
  board: BoardGrid,
  shape: Shape,
  row: number,
  col: number,
  color: string,
): void {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const br = row + r;
      const bc = col + c;
      if (br < 0 || br >= board.length || bc < 0 || bc >= board[0].length) continue;
      board[br][bc] = color;
    }
  }
}

/**
 * Removes any fully-filled rows from the board, shifting rows above down.
 * Returns the indices of cleared rows (top-to-bottom in the original board).
 */
export function clearLines(board: BoardGrid): number[] {
  const w = board[0].length;
  const cleared: number[] = [];
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r].every((cell) => cell !== null)) {
      cleared.push(r);
    }
  }
  if (cleared.length === 0) return cleared;
  // Build a new grid skipping cleared rows, then pad with empty rows on top.
  const kept: CellColor[][] = [];
  for (let r = 0; r < board.length; r++) {
    if (!cleared.includes(r)) kept.push(board[r]);
  }
  while (kept.length < board.length) {
    kept.unshift(Array<CellColor>(w).fill(null));
  }
  for (let r = 0; r < board.length; r++) {
    board[r] = kept[r];
  }
  return cleared;
}

/** Returns the lowest row the piece can occupy without collision (ghost). */
export function dropRow(board: BoardGrid, shape: Shape, row: number, col: number): number {
  let r = row;
  while (!collides(board, shape, r + 1, col)) {
    r++;
  }
  return r;
}
