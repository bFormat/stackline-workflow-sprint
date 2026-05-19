import { describe, it, expect } from 'vitest';
import { createBagRandomizer, mulberry32 } from '../src/game/randomizer.js';
import { PIECE_IDS } from '../src/game/pieces.js';

describe('7-bag-equivalent randomizer', () => {
  it('emits all seven distinct piece ids inside any window of seven draws', () => {
    const rng = mulberry32(1234);
    const bag = createBagRandomizer(rng);
    const first = new Set();
    for (let i = 0; i < 7; i += 1) first.add(bag.next());
    expect(first.size).toBe(7);
    expect([...first].sort()).toEqual([...PIECE_IDS].sort());
  });

  it('refills after exhausting the current bag and stays balanced over many draws', () => {
    const rng = mulberry32(9999);
    const bag = createBagRandomizer(rng);
    const counts = Object.fromEntries(PIECE_IDS.map((id) => [id, 0]));
    for (let i = 0; i < 70; i += 1) counts[bag.next()] += 1;
    // After 70 = 10 bags, every piece should have appeared exactly 10 times.
    for (const id of PIECE_IDS) expect(counts[id]).toBe(10);
  });

  it('peek returns the requested number of future piece ids without consuming the queue', () => {
    const rng = mulberry32(42);
    const bag = createBagRandomizer(rng);
    const preview = bag.peek(5);
    expect(preview).toHaveLength(5);
    preview.forEach((id) => expect(PIECE_IDS).toContain(id));
  });

  it('produces deterministic sequences for a fixed seed', () => {
    const seq = (seed) => {
      const bag = createBagRandomizer(mulberry32(seed));
      return Array.from({ length: 14 }, () => bag.next());
    };
    expect(seq(7)).toEqual(seq(7));
    expect(seq(7)).not.toEqual(seq(8));
  });
});
