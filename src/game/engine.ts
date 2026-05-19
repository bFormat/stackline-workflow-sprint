import {
  Board,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BUFFER_ROWS,
  clearFullRows,
  createBoard,
  dropY,
  lockPiece,
  pieceCollides,
  spawnPiece,
} from './board';
import {
  ActivePiece,
  PieceId,
  kickOffsets,
  rotateLeft,
  rotateRight,
  SHAPES,
} from './pieces';
import { PieceQueue } from './random';
import {
  gravityIntervalMs,
  HARD_DROP_POINTS_PER_CELL,
  LINES_PER_LEVEL,
  levelForLines,
  pointsForClear,
  SOFT_DROP_POINTS_PER_CELL,
} from './scoring';

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  hold: PieceId | null;
  holdUsedThisDrop: boolean;
  next: PieceId[];
  score: number;
  lines: number;
  level: number;
  paused: boolean;
  gameOver: boolean;
  /** Milliseconds since the last gravity step. */
  gravityElapsed: number;
  /** Time of last lock event for animation triggers; advisory only. */
  lastClearedRows: number[];
}

export interface EngineOptions {
  queue?: PieceQueue;
}

export class Engine {
  state: GameState;
  private queue: PieceQueue;

  constructor(opts: EngineOptions = {}) {
    this.queue = opts.queue ?? new PieceQueue();
    this.state = this.freshState();
  }

  private freshState(): GameState {
    const next = this.queue.peek(5);
    return {
      board: createBoard(),
      active: null,
      hold: null,
      holdUsedThisDrop: false,
      next: next.slice(),
      score: 0,
      lines: 0,
      level: 1,
      paused: false,
      gameOver: false,
      gravityElapsed: 0,
      lastClearedRows: [],
    };
  }

  restart(): void {
    this.queue = new PieceQueue();
    this.state = this.freshState();
    this.spawn();
  }

  /** Spawns the next piece from the queue.  Sets gameOver if it collides. */
  spawn(): void {
    if (this.state.gameOver) return;
    const id = this.queue.next();
    const piece = spawnPiece(id);
    this.state.next = this.queue.peek(5);
    this.state.holdUsedThisDrop = false;
    if (pieceCollides(this.state.board, piece)) {
      this.state.gameOver = true;
      this.state.active = null;
      return;
    }
    this.state.active = piece;
  }

  togglePause(): void {
    if (this.state.gameOver) return;
    this.state.paused = !this.state.paused;
  }

  move(dx: number): boolean {
    const p = this.state.active;
    if (!p || this.state.paused || this.state.gameOver) return false;
    const candidate: ActivePiece = { ...p, x: p.x + dx };
    if (!pieceCollides(this.state.board, candidate)) {
      this.state.active = candidate;
      return true;
    }
    return false;
  }

  rotate(direction: 'cw' | 'ccw'): boolean {
    const p = this.state.active;
    if (!p || this.state.paused || this.state.gameOver) return false;
    const newRotation =
      direction === 'cw' ? rotateRight(p.rotation) : rotateLeft(p.rotation);
    const kicks = kickOffsets(p.id);
    for (const k of kicks) {
      const candidate: ActivePiece = {
        ...p,
        rotation: newRotation,
        x: p.x + k.x,
        y: p.y + k.y,
      };
      if (!pieceCollides(this.state.board, candidate)) {
        this.state.active = candidate;
        return true;
      }
    }
    return false;
  }

  softDrop(): boolean {
    const p = this.state.active;
    if (!p || this.state.paused || this.state.gameOver) return false;
    const candidate: ActivePiece = { ...p, y: p.y + 1 };
    if (!pieceCollides(this.state.board, candidate)) {
      this.state.active = candidate;
      this.state.score += SOFT_DROP_POINTS_PER_CELL;
      this.state.gravityElapsed = 0;
      return true;
    }
    this.lock();
    return false;
  }

  hardDrop(): void {
    const p = this.state.active;
    if (!p || this.state.paused || this.state.gameOver) return;
    const targetY = dropY(this.state.board, p);
    const distance = targetY - p.y;
    this.state.active = { ...p, y: targetY };
    this.state.score += Math.max(0, distance) * HARD_DROP_POINTS_PER_CELL;
    this.lock();
  }

  holdSwap(): void {
    if (this.state.paused || this.state.gameOver) return;
    if (this.state.holdUsedThisDrop) return;
    const active = this.state.active;
    if (!active) return;
    const previousHold = this.state.hold;
    this.state.hold = active.id;
    this.state.holdUsedThisDrop = true;
    if (previousHold) {
      const piece = spawnPiece(previousHold);
      if (pieceCollides(this.state.board, piece)) {
        this.state.gameOver = true;
        this.state.active = null;
        return;
      }
      this.state.active = piece;
    } else {
      this.spawn();
    }
  }

  /** Advance time by dtMs and apply gravity steps when the interval elapses. */
  tick(dtMs: number): void {
    if (this.state.paused || this.state.gameOver) return;
    if (!this.state.active) {
      this.spawn();
      if (!this.state.active) return;
    }
    this.state.gravityElapsed += dtMs;
    const interval = gravityIntervalMs(this.state.level);
    while (this.state.gravityElapsed >= interval) {
      this.state.gravityElapsed -= interval;
      const p = this.state.active;
      if (!p) break;
      const candidate: ActivePiece = { ...p, y: p.y + 1 };
      if (!pieceCollides(this.state.board, candidate)) {
        this.state.active = candidate;
      } else {
        this.lock();
        if (this.state.gameOver) break;
      }
    }
  }

  private lock(): void {
    const piece = this.state.active;
    if (!piece) return;
    this.state.board = lockPiece(this.state.board, piece);
    const result = clearFullRows(this.state.board);
    this.state.board = result.board;
    this.state.lastClearedRows = result.clearedRows;
    if (result.cleared > 0) {
      this.state.score += pointsForClear(result.cleared, this.state.level);
      this.state.lines += result.cleared;
      this.state.level = levelForLines(this.state.lines);
    }
    this.state.active = null;
    this.spawn();
  }
}

export {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BUFFER_ROWS,
  LINES_PER_LEVEL,
  SHAPES,
};
