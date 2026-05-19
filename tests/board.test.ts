import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clearLines,
  createEmptyBoard,
  dropRow,
  lockShape,
} from '../src/board.js';
import { PIECES } from '../src/pieces.js';

function fillRow(board: ReturnType<typeof createEmptyBoard>, r: number, color = '#fff'): void {
  for (let c = 0; c < BOARD_WIDTH; c++) board[r][c] = color;
}

describe('clearLines', () => {
  it('clears a single full row', () => {
    const b = createEmptyBoard();
    fillRow(b, BOARD_HEIGHT - 1);
    const cleared = clearLines(b);
    expect(cleared).toEqual([BOARD_HEIGHT - 1]);
    expect(b[BOARD_HEIGHT - 1].every((c) => c === null)).toBe(true);
  });

  it('clears double, triple, and quad in one pass', () => {
    for (const n of [2, 3, 4]) {
      const b = createEmptyBoard();
      for (let i = 0; i < n; i++) fillRow(b, BOARD_HEIGHT - 1 - i);
      const cleared = clearLines(b);
      expect(cleared.length).toBe(n);
      // Bottom rows must now be empty after shifting.
      for (let i = 0; i < n; i++) {
        expect(b[BOARD_HEIGHT - 1 - i].every((c) => c === null)).toBe(true);
      }
    }
  });

  it('preserves partial rows', () => {
    const b = createEmptyBoard();
    fillRow(b, BOARD_HEIGHT - 1);
    b[BOARD_HEIGHT - 2][0] = '#fff';
    const cleared = clearLines(b);
    expect(cleared).toEqual([BOARD_HEIGHT - 1]);
    // The partial row should now sit at the bottom.
    expect(b[BOARD_HEIGHT - 1][0]).toBe('#fff');
    expect(b[BOARD_HEIGHT - 1].slice(1).every((c) => c === null)).toBe(true);
  });
});

describe('dropRow', () => {
  it('I piece dropped on an empty board lands so its live cells sit at the bottom', () => {
    const b = createEmptyBoard();
    const shape = PIECES.I.spawn;
    // The I spawn shape has its live row at index 1 of the 4x4, rows 2 and
    // 3 are empty. So the deepest piece.row that does not collide is the one
    // that puts shape-row-1 at the bottom: piece.row + 1 = BOARD_HEIGHT - 1
    // ⇒ piece.row = BOARD_HEIGHT - 2.
    const r = dropRow(b, shape, 0, 3);
    expect(r).toBe(BOARD_HEIGHT - 2);
  });

  it('O piece dropped on top of a stacked column lands on top of it', () => {
    const b = createEmptyBoard();
    // Stack a single block at column 4, bottom row.
    b[BOARD_HEIGHT - 1][4] = '#fff';
    const shape = PIECES.O.spawn;
    const r = dropRow(b, shape, 0, 4);
    // O occupies (col, col+1). It should land so its lowest row sits on
    // top of the column-4 block, i.e. row = BOARD_HEIGHT - 3.
    expect(r).toBe(BOARD_HEIGHT - 3);
  });
});

describe('lockShape', () => {
  it('stamps the shape colour onto the board', () => {
    const b = createEmptyBoard();
    lockShape(b, PIECES.O.spawn, 0, 0, '#abc');
    expect(b[0][0]).toBe('#abc');
    expect(b[0][1]).toBe('#abc');
    expect(b[1][0]).toBe('#abc');
    expect(b[1][1]).toBe('#abc');
  });
});
