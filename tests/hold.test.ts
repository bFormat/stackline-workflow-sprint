import { describe, expect, it } from 'vitest';
import { Game } from '../src/game.js';

describe('hold rule', () => {
  it('one hold per drop is enforced', () => {
    const game = new Game();
    game.start();
    const first = game.active?.id ?? null;
    expect(first).not.toBeNull();

    // First hold — slot is empty, so it should accept the current piece.
    game.action('hold');
    expect(game.hold).toBe(first);

    // Second hold during the same drop — must be a no-op.
    const heldAfterFirst = game.hold;
    const pieceAfterFirst = game.active?.id ?? null;
    game.action('hold');
    expect(game.hold).toBe(heldAfterFirst);
    expect(game.active?.id ?? null).toBe(pieceAfterFirst);
  });

  it('hold flag resets after the next piece locks', () => {
    const game = new Game();
    game.start();
    const original = game.active?.id ?? null;
    game.action('hold');
    expect(game.hold).toBe(original);

    // Hard drop to lock the current piece and spawn a fresh one.
    game.action('hard');

    // Now we should be allowed to hold again.
    const beforeSecondHold = game.active?.id ?? null;
    game.action('hold');
    // After this swap, the original (which was in hold) should be active and
    // the just-active piece should sit in the hold slot.
    expect(game.hold).toBe(beforeSecondHold);
  });
});
