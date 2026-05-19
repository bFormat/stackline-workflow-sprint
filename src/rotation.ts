/**
 * Rotation system.
 *
 * Rotates the shape grid mathematically (transpose + reverse) for each
 * orientation and provides a small original wall-kick table so that
 * rotations near the wall feel responsive.
 *
 * This is NOT any specific commercial rotation system — it is a plain,
 * symmetrical kick table designed for this game.
 */

import { cloneShape, type PieceDef, type Shape } from './pieces.js';

export type RotationState = 0 | 1 | 2 | 3;

/**
 * Returns the shape rotated `state` quarter-turns clockwise from spawn.
 * O-piece (box 2) is rotation-invariant; the I-piece rotates inside its 4x4.
 */
export function shapeForState(def: PieceDef, state: RotationState): Shape {
  if (def.id === 'O') return cloneShape(def.spawn);
  let s = cloneShape(def.spawn);
  for (let i = 0; i < state; i++) {
    s = rotateCW(s);
  }
  return s;
}

export function rotateCW(shape: Shape): Shape {
  const n = shape.length;
  const out: Shape = Array.from({ length: n }, () => Array(n).fill(0)) as Shape;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      out[c][n - 1 - r] = shape[r][c];
    }
  }
  return out;
}

export function rotateCCW(shape: Shape): Shape {
  const n = shape.length;
  const out: Shape = Array.from({ length: n }, () => Array(n).fill(0)) as Shape;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      out[n - 1 - c][r] = shape[r][c];
    }
  }
  return out;
}

export function nextState(state: RotationState, dir: 1 | -1): RotationState {
  return (((state + dir + 4) % 4) as RotationState);
}

/**
 * Wall-kick offsets to try in order. Symmetrical and small — covers the
 * common "rotate near wall" scenarios for our pieces.
 */
export const KICKS: readonly [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-2, 0],
  [2, 0],
  [-1, -1],
  [1, -1],
];
