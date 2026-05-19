import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BUFFER_ROWS,
  clearFullRows,
  createBoard,
  isRowFull,
  lockPiece,
} from '../src/game/board';

const VISIBLE_TOTAL = BUFFER_ROWS + BOARD_HEIGHT;

describe('line clear detection', () => {
  it('reports a fully occupied row as full', () => {
    const row = new Array(BOARD_WIDTH).fill('I');
    expect(isRowFull(row)).toBe(true);
  });

  it('does not report a partially occupied row as full', () => {
    const row = new Array(BOARD_WIDTH).fill('I');
    row[3] = null;
    expect(isRowFull(row)).toBe(false);
  });

  it('clears full rows and drops the rows above', () => {
    const board = createBoard();
    // Fill the bottom row completely
    for (let x = 0; x < BOARD_WIDTH; x++) {
      board[VISIBLE_TOTAL - 1][x] = 'I';
    }
    // Add a single block just above
    board[VISIBLE_TOTAL - 2][4] = 'T';

    const result = clearFullRows(board);
    expect(result.cleared).toBe(1);
    expect(result.board.length).toBe(VISIBLE_TOTAL);
    // The lone block should have shifted down by one row
    expect(result.board[VISIBLE_TOTAL - 1][4]).toBe('T');
    // Bottom row before lone block is empty now
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (x !== 4) {
        expect(result.board[VISIBLE_TOTAL - 1][x]).toBeNull();
      }
    }
  });

  it('clears multiple rows at once', () => {
    const board = createBoard();
    for (let y = VISIBLE_TOTAL - 3; y < VISIBLE_TOTAL; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 'L';
      }
    }
    const result = clearFullRows(board);
    expect(result.cleared).toBe(3);
    for (let y = 0; y < VISIBLE_TOTAL; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(result.board[y][x]).toBeNull();
      }
    }
  });

  it('locking a piece marks the right cells', () => {
    const board = createBoard();
    const piece = { id: 'O' as const, rotation: 0 as 0, x: 4, y: 4 };
    const next = lockPiece(board, piece);
    expect(next[4][4]).toBe('O');
    expect(next[4][5]).toBe('O');
    expect(next[5][4]).toBe('O');
    expect(next[5][5]).toBe('O');
    // Original board is unchanged.
    expect(board[4][4]).toBeNull();
  });
});
