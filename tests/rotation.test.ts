import { describe, expect, it } from 'vitest';
import {
  BOARD_WIDTH,
  cellOccupied,
  createBoard,
  pieceCollides,
  spawnPiece,
} from '../src/game/board';
import { Engine } from '../src/game/engine';
import { kickOffsets, piecesCells, rotateLeft, rotateRight, SHAPES } from '../src/game/pieces';
import type { PieceId } from '../src/game/pieces';
import { PieceQueue, seededRng } from '../src/game/random';

describe('rotation primitives', () => {
  it('rotates rightward then leftward returns to original rotation', () => {
    expect(rotateRight(rotateRight(rotateRight(rotateRight(0))))).toBe(0);
    expect(rotateLeft(rotateLeft(rotateLeft(rotateLeft(0))))).toBe(0);
  });

  it('T-piece state 0 and 2 occupy different cells', () => {
    const s = SHAPES.T;
    const r0 = s.rotations[0].map((c) => `${c.x},${c.y}`).sort().join('|');
    const r2 = s.rotations[2].map((c) => `${c.x},${c.y}`).sort().join('|');
    expect(r0).not.toEqual(r2);
  });

  it('O piece is rotation-invariant', () => {
    const r0 = SHAPES.O.rotations[0];
    for (const rot of SHAPES.O.rotations) {
      expect(rot).toEqual(r0);
    }
  });

  it('kick offsets list always starts with no-op', () => {
    for (const id of Object.keys(SHAPES) as Array<keyof typeof SHAPES>) {
      const offsets = kickOffsets(id);
      expect(offsets[0]).toEqual({ x: 0, y: 0 });
    }
  });
});

describe('engine rotation with wall kicks', () => {
  it('rotates the active piece when there is space', () => {
    const engine = new Engine({ queue: new PieceQueue(seededRng(1)) });
    engine.spawn();
    const before = engine.state.active!.rotation;
    engine.rotate('cw');
    const after = engine.state.active!.rotation;
    expect(after).toBe(((before + 1) % 4) as typeof after);
  });

  it('uses wall-kick offsets to rotate a piece flush against the right wall', () => {
    const engine = makeEngineWithFirstPiece('T');
    // Push the piece all the way to the right edge.
    while (engine.move(1)) {
      // keep moving
    }
    const beforeX = engine.state.active!.x;
    // Force rotation; even if it bumps the wall the kick should allow it.
    const ok = engine.rotate('cw');
    expect(ok).toBe(true);
    const cells = piecesCells(engine.state.active!);
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThan(BOARD_WIDTH);
    }
    expect(engine.state.active!.x).toBeLessThanOrEqual(beforeX);
  });

  it('rejects placement entirely when the board is full', () => {
    const board = createBoard();
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 'I';
      }
    }
    const piece = spawnPiece('T');
    expect(pieceCollides(board, piece)).toBe(true);
    expect(cellOccupied(board, 0, 5)).toBe(true);
  });
});

function makeEngineWithFirstPiece(id: PieceId): Engine {
  for (let seed = 1; seed < 5000; seed++) {
    const queue = new PieceQueue(seededRng(seed));
    const first = queue.peek(1)[0];
    if (first === id) {
      const engine = new Engine({ queue: new PieceQueue(seededRng(seed)) });
      engine.spawn();
      return engine;
    }
  }
  throw new Error(`no seed produced first piece ${id}`);
}
