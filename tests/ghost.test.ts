import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, createEmptyBoard, dropRow } from '../src/board.js';
import { PIECES } from '../src/pieces.js';
import { Game } from '../src/game.js';

describe('ghost piece', () => {
  it('lands on the correct row for an empty board (I piece)', () => {
    const board = createEmptyBoard();
    const shape = PIECES.I.spawn;
    // Live row sits at index 1 of the 4x4 with empty rows below it, so the
    // deepest non-colliding piece.row leaves shape-row-1 at board row
    // BOARD_HEIGHT - 1 ⇒ piece.row = BOARD_HEIGHT - 2.
    const row = dropRow(board, shape, 0, 3);
    expect(row).toBe(BOARD_HEIGHT - 2);
  });

  it('respects a stacked column when computing the ghost row', () => {
    const board = createEmptyBoard();
    // Block bottom row column 0.
    board[BOARD_HEIGHT - 1][0] = '#fff';
    const shape = PIECES.J.spawn; // J has filled cell at (0,0) in spawn.
    const row = dropRow(board, shape, 0, 0);
    // J spawn occupies col 0 in rows 0 and 1. With (BOARD_HEIGHT-1, 0) blocked,
    // the lowest filled cell of J should sit just above it.
    // J shape: row0 col0 filled, row1 cols 0..2 filled. The bottom-most
    // filled row of the shape is row 1. That must land on BOARD_HEIGHT-2.
    expect(row).toBe(BOARD_HEIGHT - 3);
  });

  it('Game.ghostRow tracks the drop row after a spawn', () => {
    const game = new Game();
    game.start();
    expect(game.ghostRow).not.toBeNull();
    if (!game.active || game.ghostRow === null) return;
    // Ghost row must be at or below the active piece.
    expect(game.ghostRow).toBeGreaterThanOrEqual(game.active.row);
  });
});
