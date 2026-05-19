import { pieceCells } from './pieces.js';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const HIDDEN_ROWS = 2; // small buffer above visible playfield

/** Build an empty board grid of width x (height + buffer). */
export function createBoard(width = BOARD_WIDTH, height = BOARD_HEIGHT) {
  const totalHeight = height + HIDDEN_ROWS;
  const grid = [];
  for (let y = 0; y < totalHeight; y += 1) {
    grid.push(new Array(width).fill(null));
  }
  return grid;
}

export function cloneBoard(board) {
  return board.map((row) => row.slice());
}

/** True iff every cell of the given piece is within bounds and unoccupied. */
export function isPlacementValid(board, piece) {
  const cells = pieceCells(piece.id, piece.rotation);
  const width = board[0].length;
  const height = board.length;
  for (const [cx, cy] of cells) {
    const x = piece.x + cx;
    const y = piece.y + cy;
    if (x < 0 || x >= width || y >= height) return false;
    if (y < 0) continue; // allow above-board during spawn
    if (board[y][x] !== null) return false;
  }
  return true;
}

/** Stamp a piece into a copy of the board, returning the new board. */
export function lockPiece(board, piece) {
  const next = cloneBoard(board);
  const cells = pieceCells(piece.id, piece.rotation);
  for (const [cx, cy] of cells) {
    const x = piece.x + cx;
    const y = piece.y + cy;
    if (y >= 0 && y < next.length) {
      next[y][x] = piece.id;
    }
  }
  return next;
}

/**
 * Detect and clear filled rows. Returns the new board and the number of
 * lines that were cleared.
 */
export function clearLines(board) {
  const width = board[0].length;
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = board.length - remaining.length;
  const empties = [];
  for (let i = 0; i < cleared; i += 1) {
    empties.push(new Array(width).fill(null));
  }
  return { board: [...empties, ...remaining], cleared };
}

/**
 * Drop a piece straight down until it would collide; returns the y delta
 * (>=0) representing how many rows fell.
 */
export function projectedDrop(board, piece) {
  let delta = 0;
  while (isPlacementValid(board, { ...piece, y: piece.y + delta + 1 })) {
    delta += 1;
  }
  return delta;
}
