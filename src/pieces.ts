/**
 * Piece definitions for Stackline Workflow Sprint.
 *
 * Seven shapes are used, matching the classic four-cell falling-block genre.
 * We deliberately use neutral identifiers (I, J, L, O, S, T, Z) — these are
 * mathematical labels for the cell layouts, not product names.
 *
 * Each piece is defined by its rotation states, expressed as 4x4 (or 3x3 for
 * the O) cell grids of 0 / 1. Rotation state 0 is the spawn orientation.
 */

export type PieceId = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export type Cell = 0 | 1;
export type Shape = Cell[][];

export interface PieceDef {
  id: PieceId;
  /** Spawn-orientation shape (state 0). */
  spawn: Shape;
  /** Box size used for rotation maths (3 for most, 4 for I, 2 for O). */
  box: number;
  /** Display colour as #rgb / #rrggbb. */
  color: string;
}

/* eslint-disable prettier/prettier */

export const PIECES: Record<PieceId, PieceDef> = {
  I: {
    id: 'I',
    box: 4,
    color: '#22d3ee',
    spawn: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  J: {
    id: 'J',
    box: 3,
    color: '#60a5fa',
    spawn: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  L: {
    id: 'L',
    box: 3,
    color: '#fb923c',
    spawn: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  O: {
    id: 'O',
    box: 2,
    color: '#facc15',
    spawn: [
      [1, 1],
      [1, 1],
    ],
  },
  S: {
    id: 'S',
    box: 3,
    color: '#4ade80',
    spawn: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
  },
  T: {
    id: 'T',
    box: 3,
    color: '#c084fc',
    spawn: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  Z: {
    id: 'Z',
    box: 3,
    color: '#f87171',
    spawn: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  },
};

/* eslint-enable prettier/prettier */

export const PIECE_IDS: readonly PieceId[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;

/** Spawn column for the piece's top-left corner on a 10-wide board. */
export function spawnColumn(piece: PieceId): number {
  if (piece === 'O') return 4;
  if (piece === 'I') return 3;
  return 3;
}

/** Spawn row — pieces appear at the very top of the visible board. */
export function spawnRow(_piece: PieceId): number {
  return 0;
}

export function cloneShape(s: Shape): Shape {
  return s.map((row) => row.slice() as Cell[]);
}
