import { describe, it, expect } from 'vitest';
import { createBoard } from '../src/game/board.js';
import { tryRotate, kicksFor } from '../src/game/rotation.js';
import { PIECES, pieceCells, spawnPosition } from '../src/game/pieces.js';

describe('piece rotation', () => {
  it('rotates the CROWN piece clockwise through all four states', () => {
    const board = createBoard();
    let piece = spawnPosition('CROWN', board[0].length);
    for (let i = 1; i <= 4; i += 1) {
      const next = tryRotate(board, piece, 1);
      expect(next).not.toBeNull();
      expect(next.rotation).toBe(i % 4);
      piece = next;
    }
  });

  it('treats the CUBE piece as rotation-invariant (no wall kick needed)', () => {
    const board = createBoard();
    const piece = spawnPosition('CUBE', board[0].length);
    expect(piece.id).toBe('CUBE');
    const cellsBefore = pieceCells('CUBE', 0).map((c) => c.join(','));
    const cellsAfter = pieceCells('CUBE', 1).map((c) => c.join(','));
    expect(cellsAfter).toEqual(cellsBefore);
    expect(kicksFor('CUBE')).toEqual([[0, 0]]);
  });

  it('uses the wider BAR kick set so a horizontal BAR can rotate vertically near a wall', () => {
    const board = createBoard();
    const piece = { id: 'BAR', rotation: 0, x: 0, y: 18 };
    const rotated = tryRotate(board, piece, 1);
    expect(rotated).not.toBeNull();
    expect(rotated.rotation).toBe(1);
    // After kick, every cell must still fit inside the board.
    const cells = pieceCells(rotated.id, rotated.rotation);
    for (const [cx, cy] of cells) {
      expect(rotated.x + cx).toBeGreaterThanOrEqual(0);
      expect(rotated.x + cx).toBeLessThan(board[0].length);
      expect(rotated.y + cy).toBeLessThan(board.length);
    }
  });

  it('returns null when no kick offset can resolve a rotation collision', () => {
    // Fill the board solid around the active piece so no kick fits.
    const board = createBoard();
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board[0].length; x += 1) {
        board[y][x] = 'CUBE';
      }
    }
    // Carve out a 2x2 hole for our active piece (an L-shaped one cannot fit
    // rotated into a 2x2 hole).
    for (let y = 5; y < 7; y += 1) {
      for (let x = 4; x < 6; x += 1) {
        board[y][x] = null;
      }
    }
    const piece = { id: 'CROWN', rotation: 0, x: 4, y: 5 };
    // CROWN occupies a 3x3 footprint; no rotation will fit in 2x2.
    const result = tryRotate(board, piece, 1);
    expect(result).toBeNull();
  });

  it('every piece has exactly four rotation states stored', () => {
    for (const [id, def] of Object.entries(PIECES)) {
      expect(def.rotations.length, `${id} rotation count`).toBe(4);
    }
  });
});
