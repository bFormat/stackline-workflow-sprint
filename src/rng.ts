/**
 * Seven-bag piece randomiser.
 *
 * Each bag contains all seven piece ids exactly once, shuffled with
 * Fisher-Yates. The generator yields ids one at a time, refilling the bag
 * when it is empty.
 */
import { PIECE_IDS, type PieceId } from './pieces.js';

export type RandomFn = () => number;

export class SevenBag {
  private bag: PieceId[] = [];
  private readonly rand: RandomFn;

  constructor(rand: RandomFn = Math.random) {
    this.rand = rand;
  }

  /** Returns the next piece id, refilling the bag as required. */
  next(): PieceId {
    if (this.bag.length === 0) {
      this.refill();
    }
    return this.bag.pop() as PieceId;
  }

  /** Peek without consuming (used by the next-queue UI). */
  peek(count: number): PieceId[] {
    const result: PieceId[] = [];
    // Read tail-first from current bag (since `next()` pops from the end).
    for (let i = this.bag.length - 1; i >= 0 && result.length < count; i--) {
      result.push(this.bag[i]);
    }
    while (result.length < count) {
      const fresh = this.makeBag();
      for (let i = fresh.length - 1; i >= 0 && result.length < count; i--) {
        result.push(fresh[i]);
      }
    }
    return result;
  }

  private refill(): void {
    this.bag = this.makeBag();
  }

  private makeBag(): PieceId[] {
    const arr = PIECE_IDS.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
