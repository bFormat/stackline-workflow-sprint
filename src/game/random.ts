import type { PieceId } from './pieces';
import { PIECE_IDS } from './pieces';

/**
 * Deterministic shuffle bag.  Pass a seeded RNG for reproducible tests.
 * Each "bag" contains every piece id exactly once; the queue refills lazily.
 */
export class PieceQueue {
  private queue: PieceId[] = [];
  private rng: () => number;

  constructor(rng: () => number = Math.random) {
    this.rng = rng;
    this.refill();
  }

  peek(count: number): PieceId[] {
    while (this.queue.length < count) {
      this.refill();
    }
    return this.queue.slice(0, count);
  }

  next(): PieceId {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift() as PieceId;
  }

  private refill(): void {
    const bag = [...PIECE_IDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }
}

/** Simple seeded PRNG (mulberry32). */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
