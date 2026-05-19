import { describe, expect, it } from 'vitest';
import { PIECES, PIECE_IDS } from '../src/pieces.js';
import { rotateCCW, rotateCW, shapeForState } from '../src/rotation.js';

describe('rotation', () => {
  it('every piece has four well-formed rotation states', () => {
    for (const id of PIECE_IDS) {
      const def = PIECES[id];
      for (let state = 0; state < 4; state++) {
        const shape = shapeForState(def, state as 0 | 1 | 2 | 3);
        // Same square size as spawn.
        expect(shape.length).toBe(def.spawn.length);
        for (const row of shape) expect(row.length).toBe(def.spawn[0].length);
        // Same number of filled cells (rotation preserves area).
        const filled = shape.flat().reduce((a, b) => a + b, 0);
        const expected = def.spawn.flat().reduce((a, b) => a + b, 0);
        expect(filled).toBe(expected);
      }
    }
  });

  it('rotating four times returns the original shape', () => {
    for (const id of PIECE_IDS) {
      const def = PIECES[id];
      const original = shapeForState(def, 0);
      let s = original;
      for (let i = 0; i < 4; i++) s = rotateCW(s);
      expect(s).toEqual(original);
      s = original;
      for (let i = 0; i < 4; i++) s = rotateCCW(s);
      expect(s).toEqual(original);
    }
  });

  it('O piece is rotation-invariant', () => {
    const def = PIECES.O;
    for (let state = 0; state < 4; state++) {
      expect(shapeForState(def, state as 0 | 1 | 2 | 3)).toEqual(def.spawn);
    }
  });

  it('S, Z, I, L, J, T pieces have at least two distinct rotation states', () => {
    for (const id of ['I', 'J', 'L', 'S', 'T', 'Z'] as const) {
      const def = PIECES[id];
      const state0 = JSON.stringify(shapeForState(def, 0));
      const state1 = JSON.stringify(shapeForState(def, 1));
      expect(state0).not.toBe(state1);
    }
  });
});
