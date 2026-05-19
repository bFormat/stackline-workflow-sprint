import { PIECE_IDS } from './pieces.js';

/**
 * 7-bag-equivalent randomizer.
 *
 * A "bag" is a shuffled permutation of all seven piece codenames. The
 * randomizer yields pieces from the current bag and, when the bag is
 * exhausted, generates a fresh shuffled bag. This guarantees that any
 * window of seven consecutive pieces contains each piece exactly once.
 */
export function createBagRandomizer(rng = Math.random) {
  let bag = [];

  function refill() {
    bag = [...PIECE_IDS];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  function next() {
    if (bag.length === 0) refill();
    return bag.shift();
  }

  function peek(count) {
    const out = [];
    let bagCopy = bag.slice();
    while (out.length < count) {
      if (bagCopy.length === 0) {
        // Generate a synthetic future bag using the same rng deterministically
        // for the peek window.
        const synth = [...PIECE_IDS];
        for (let k = synth.length - 1; k > 0; k -= 1) {
          const j = Math.floor(rng() * (k + 1));
          [synth[k], synth[j]] = [synth[j], synth[k]];
        }
        bagCopy = synth;
      }
      out.push(bagCopy.shift());
    }
    return out;
  }

  return { next, peek };
}

/**
 * Deterministic seeded PRNG (mulberry32) — used by tests so randomized
 * behavior is reproducible.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
