/**
 * Stackline Workflow Sprint — core engine state machine.
 *
 * The engine is renderer-agnostic. It exposes state, an `update(dt)`
 * step, an action dispatcher, and event hooks. The UI/render layer
 * consumes the state object after every tick.
 */

import {
  BOARD_WIDTH,
  clearLines,
  collides,
  createEmptyBoard,
  dropRow,
  lockShape,
  type ActivePiece,
  type BoardGrid,
} from './board.js';
import { LOCK_DELAY_MS, MAX_LOCK_RESETS, frameInterval } from './gravity.js';
import { PIECES, spawnColumn, spawnRow, type PieceId } from './pieces.js';
import { SevenBag, type RandomFn } from './rng.js';
import {
  KICKS,
  nextState,
  shapeForState,
  type RotationState,
} from './rotation.js';
import {
  addHardDrop,
  addSoftDrop,
  applyLineClear,
  newScore,
  type Score,
} from './scoring.js';

export type Phase = 'ready' | 'playing' | 'paused' | 'gameover';

export interface GameEvents {
  onMove?: () => void;
  onRotate?: () => void;
  onLock?: () => void;
  onDrop?: () => void;
  onClear?: (lines: number) => void;
  onHold?: () => void;
  onGameOver?: () => void;
  onSpawn?: (piece: PieceId) => void;
}

export class Game {
  board: BoardGrid = createEmptyBoard();
  active: ActivePiece | null = null;
  hold: PieceId | null = null;
  holdUsedThisDrop = false;
  bag: SevenBag;
  queue: PieceId[] = [];
  score: Score = newScore();
  phase: Phase = 'ready';
  ghostRow: number | null = null;

  private gravityAccum = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private grounded = false;
  private readonly events: GameEvents;

  constructor(opts: { random?: RandomFn; events?: GameEvents } = {}) {
    this.bag = new SevenBag(opts.random);
    this.events = opts.events ?? {};
    this.refillQueue();
  }

  /* ---------- lifecycle ---------- */

  start(): void {
    this.board = createEmptyBoard();
    this.score = newScore();
    this.hold = null;
    this.holdUsedThisDrop = false;
    this.bag = new SevenBag();
    this.queue = [];
    this.refillQueue();
    this.phase = 'playing';
    this.spawn();
  }

  togglePause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
  }

  /** Returns the next-queue snapshot, padded to `count`. */
  getNext(count = 5): PieceId[] {
    while (this.queue.length < count) this.queue.push(this.bag.next());
    return this.queue.slice(0, count);
  }

  /* ---------- main loop ---------- */

  /** Advance the engine by `dtMs` milliseconds. */
  update(dtMs: number): void {
    if (this.phase !== 'playing' || !this.active) return;

    const gravityMs = frameInterval(this.score.level);
    this.gravityAccum += dtMs;

    while (this.gravityAccum >= gravityMs) {
      this.gravityAccum -= gravityMs;
      this.stepGravity();
    }

    if (this.grounded) {
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) {
        this.lockActive();
      }
    }
  }

  /* ---------- player actions ---------- */

  action(name: string): void {
    if (this.phase === 'gameover' && name !== 'restart') return;
    switch (name) {
      case 'left':
        this.move(-1);
        break;
      case 'right':
        this.move(1);
        break;
      case 'soft':
        this.softDrop();
        break;
      case 'hard':
        this.hardDrop();
        break;
      case 'rotateCW':
        this.rotate(1);
        break;
      case 'rotateCCW':
        this.rotate(-1);
        break;
      case 'hold':
        this.holdSwap();
        break;
      case 'pause':
        if (this.phase === 'playing' || this.phase === 'paused') this.togglePause();
        break;
      case 'restart':
        this.start();
        break;
    }
  }

  /* ---------- internals ---------- */

  private refillQueue(): void {
    while (this.queue.length < 7) this.queue.push(this.bag.next());
  }

  private takeNext(): PieceId {
    const id = this.queue.shift() as PieceId;
    this.refillQueue();
    return id;
  }

  private spawn(forced?: PieceId): void {
    const id = forced ?? this.takeNext();
    const def = PIECES[id];
    const piece: ActivePiece = {
      id,
      color: def.color,
      shape: shapeForState(def, 0),
      row: spawnRow(id),
      col: spawnColumn(id),
      state: 0,
    };
    this.active = piece;
    this.gravityAccum = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.grounded = false;
    this.holdUsedThisDrop = false;
    this.events.onSpawn?.(id);
    if (collides(this.board, piece.shape, piece.row, piece.col)) {
      this.active = null;
      this.phase = 'gameover';
      this.events.onGameOver?.();
      return;
    }
    this.updateGhost();
  }

  private updateGhost(): void {
    if (!this.active) {
      this.ghostRow = null;
      return;
    }
    this.ghostRow = dropRow(this.board, this.active.shape, this.active.row, this.active.col);
  }

  private resetLockTimer(): void {
    if (this.grounded && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private move(dx: number): void {
    if (!this.active) return;
    const newCol = this.active.col + dx;
    if (collides(this.board, this.active.shape, this.active.row, newCol)) return;
    this.active.col = newCol;
    this.events.onMove?.();
    this.refreshGroundedAfterMutation();
    this.updateGhost();
  }

  private rotate(dir: 1 | -1): void {
    if (!this.active) return;
    const def = PIECES[this.active.id];
    const target = nextState(this.active.state, dir);
    const candidate = shapeForState(def, target);
    for (const [dx, dy] of KICKS) {
      const r = this.active.row + dy;
      const c = this.active.col + dx;
      if (!collides(this.board, candidate, r, c)) {
        this.active.shape = candidate;
        this.active.state = target as RotationState;
        this.active.row = r;
        this.active.col = c;
        this.events.onRotate?.();
        this.refreshGroundedAfterMutation();
        this.updateGhost();
        return;
      }
    }
  }

  private softDrop(): void {
    if (!this.active) return;
    if (collides(this.board, this.active.shape, this.active.row + 1, this.active.col)) {
      this.markGrounded();
      return;
    }
    this.active.row++;
    addSoftDrop(this.score, 1);
    this.events.onDrop?.();
    this.refreshGroundedAfterMutation();
    this.updateGhost();
  }

  private hardDrop(): void {
    if (!this.active) return;
    const target = dropRow(this.board, this.active.shape, this.active.row, this.active.col);
    const distance = Math.max(0, target - this.active.row);
    this.active.row = target;
    addHardDrop(this.score, distance);
    this.events.onDrop?.();
    this.lockActive();
  }

  private holdSwap(): void {
    if (!this.active || this.holdUsedThisDrop) return;
    const current = this.active.id;
    if (this.hold === null) {
      this.hold = current;
      this.spawn();
    } else {
      const swap = this.hold;
      this.hold = current;
      this.spawn(swap);
    }
    this.holdUsedThisDrop = true;
    this.events.onHold?.();
  }

  private stepGravity(): void {
    if (!this.active) return;
    if (collides(this.board, this.active.shape, this.active.row + 1, this.active.col)) {
      this.markGrounded();
      return;
    }
    this.active.row++;
    this.refreshGroundedAfterMutation();
    this.updateGhost();
  }

  private refreshGroundedAfterMutation(): void {
    if (!this.active) return;
    const grounded = collides(
      this.board,
      this.active.shape,
      this.active.row + 1,
      this.active.col,
    );
    if (grounded && !this.grounded) {
      this.grounded = true;
      this.lockTimer = 0;
    } else if (!grounded) {
      this.grounded = false;
      this.lockTimer = 0;
    } else if (grounded) {
      this.resetLockTimer();
    }
  }

  private markGrounded(): void {
    this.grounded = true;
  }

  private lockActive(): void {
    if (!this.active) return;
    lockShape(this.board, this.active.shape, this.active.row, this.active.col, this.active.color);
    this.events.onLock?.();
    const cleared = clearLines(this.board);
    if (cleared.length > 0) {
      applyLineClear(this.score, cleared.length);
      this.events.onClear?.(cleared.length);
    }
    this.active = null;
    this.ghostRow = null;
    if (this.phase === 'playing') this.spawn();
  }
}

// Re-export for the bin entry without forcing consumers to deep-import.
export const BOARD_COLS = BOARD_WIDTH;
