import { describe, it, expect } from 'vitest';
import { BOARD_WIDTH, clearLines, createBoard } from '../src/game/board.js';

function fillRow(board, y, id = 'CUBE') {
  for (let x = 0; x < board[0].length; x += 1) board[y][x] = id;
}

describe('line clear detection', () => {
  it('returns the same board and zero cleared when no rows are filled', () => {
    const board = createBoard();
    board[5][0] = 'BAR';
    const result = clearLines(board);
    expect(result.cleared).toBe(0);
    expect(result.board.length).toBe(board.length);
    expect(result.board[5][0]).toBe('BAR');
  });

  it('clears a single full row and drops everything above by one cell', () => {
    const board = createBoard();
    board[10][3] = 'HOOK';
    fillRow(board, 15, 'CROOK');
    const result = clearLines(board);
    expect(result.cleared).toBe(1);
    // The HOOK that was at y=10 should now be at y=11 (shifted down).
    expect(result.board[11][3]).toBe('HOOK');
    // Bottom row must be empty after the cleared row floats away.
    expect(result.board[15].every((c) => c === 'CROOK' || c === null)).toBe(true);
  });

  it('clears four simultaneous rows and reports cleared = 4', () => {
    const board = createBoard();
    fillRow(board, 18);
    fillRow(board, 19);
    fillRow(board, 20);
    fillRow(board, 21);
    const result = clearLines(board);
    expect(result.cleared).toBe(4);
    // Four fresh empty rows should be inserted at the top.
    for (let y = 0; y < 4; y += 1) {
      expect(result.board[y].every((c) => c === null)).toBe(true);
    }
  });

  it('does not clear a row that is only partially filled, even with one cell empty', () => {
    const board = createBoard();
    fillRow(board, 15);
    board[15][BOARD_WIDTH - 1] = null;
    const result = clearLines(board);
    expect(result.cleared).toBe(0);
  });
});
