import { describe, expect, it } from 'vitest';
import { SevenBag } from '../src/rng.js';
import { PIECE_IDS } from '../src/pieces.js';

describe('SevenBag', () => {
  it('each bag of 7 contains all 7 piece ids exactly once', () => {
    const rng = mulberry32(0xc0ffee);
    const bag = new SevenBag(rng);
    for (let trial = 0; trial < 50; trial++) {
      const drawn = new Array(7).fill(null).map(() => bag.next());
      const sorted = [...drawn].sort();
      const expected = [...PIECE_IDS].sort();
      expect(sorted).toEqual(expected);
    }
  });

  it('peek does not consume', () => {
    const bag = new SevenBag(mulberry32(42));
    const peeked = bag.peek(7);
    expect(peeked).toHaveLength(7);
    const consumed = new Array(7).fill(null).map(() => bag.next());
    // Peek should match the order pieces actually come out.
    expect(consumed).toEqual(peeked);
  });

  it('produces deterministic output for a given seed', () => {
    const a = new SevenBag(mulberry32(1));
    const b = new SevenBag(mulberry32(1));
    const seqA = new Array(20).fill(null).map(() => a.next());
    const seqB = new Array(20).fill(null).map(() => b.next());
    expect(seqA).toEqual(seqB);
  });
});

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
