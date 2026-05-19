import { describe, expect, it } from 'vitest';
import { Engine } from '../src/game/engine';
import { PieceQueue, seededRng } from '../src/game/random';
import { gravityIntervalMs } from '../src/game/scoring';

describe('gravity tick', () => {
  it('advances the active piece downward by one row each interval', () => {
    const engine = new Engine({ queue: new PieceQueue(seededRng(42)) });
    engine.spawn();
    const before = engine.state.active!;
    const interval = gravityIntervalMs(engine.state.level);

    engine.tick(interval);

    const after = engine.state.active!;
    expect(after.id).toBe(before.id);
    expect(after.y).toBe(before.y + 1);
    expect(after.x).toBe(before.x);
  });

  it('does not advance when paused', () => {
    const engine = new Engine({ queue: new PieceQueue(seededRng(7)) });
    engine.spawn();
    const before = engine.state.active!;
    engine.togglePause();
    engine.tick(gravityIntervalMs(1) * 5);
    expect(engine.state.active!.y).toBe(before.y);
  });

  it('hard drop locks the piece and awards drop points', () => {
    const engine = new Engine({ queue: new PieceQueue(seededRng(123)) });
    engine.spawn();
    const id = engine.state.active!.id;
    engine.hardDrop();
    // A new piece is in play after locking
    expect(engine.state.active).not.toBeNull();
    expect(engine.state.active!.id).not.toBe(undefined);
    expect(engine.state.score).toBeGreaterThan(0);
    expect(id).not.toBe(undefined);
  });

  it('soft drop adds at least one point and moves the piece', () => {
    const engine = new Engine({ queue: new PieceQueue(seededRng(5)) });
    engine.spawn();
    const beforeY = engine.state.active!.y;
    const beforeScore = engine.state.score;
    engine.softDrop();
    expect(engine.state.score).toBeGreaterThan(beforeScore);
    expect(engine.state.active!.y).toBe(beforeY + 1);
  });
});
