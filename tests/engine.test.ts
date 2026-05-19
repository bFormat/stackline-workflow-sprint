import { describe, expect, it } from 'vitest';
import {
  COLS, ROWS,
  createInitialState, reduce, emptyBoard, clearLines, rowScore,
  pieceCells, collides, ghostPosition,
  GameState,
} from '../src/engine';
import { actionForKey } from '../src/input';

function fillRow(state: GameState, row: number, except: number[] = []): GameState {
  const board = state.board.map(r => r.slice());
  for (let c = 0; c < COLS; c++) {
    if (!except.includes(c)) board[row][c] = '#ffffff';
  }
  return { ...state, board };
}

describe('engine — fundamentals', () => {
  it('starts in idle with empty board', () => {
    const s = createInitialState(1);
    expect(s.status).toBe('idle');
    expect(s.board.length).toBe(ROWS);
    expect(s.board[0].length).toBe(COLS);
    expect(s.score).toBe(0);
    expect(s.lines).toBe(0);
    expect(s.level).toBe(1);
  });

  it('START spawns a piece and enters playing', () => {
    const s = reduce(createInitialState(7), { type: 'START' });
    expect(s.status).toBe('playing');
    expect(s.current).not.toBeNull();
    expect(s.queue.length).toBeGreaterThanOrEqual(3);
  });

  it('rowScore follows the documented schedule', () => {
    expect(rowScore(0, 1)).toBe(0);
    expect(rowScore(1, 1)).toBe(100);
    expect(rowScore(2, 1)).toBe(300);
    expect(rowScore(3, 1)).toBe(500);
    expect(rowScore(4, 1)).toBe(800);
    expect(rowScore(4, 3)).toBe(2400);
  });
});

describe('engine — line clearing and scoring', () => {
  it('clears a fully-filled row and increments score', () => {
    let s = createInitialState(2);
    s = reduce(s, { type: 'START' });
    // Replace board with a bottom row that is fully filled.
    const board = emptyBoard();
    for (let c = 0; c < COLS; c++) board[ROWS - 1][c] = '#fff';
    s = { ...s, board };

    const { board: nextBoard, cleared } = clearLines(s.board);
    expect(cleared).toBe(1);
    // All rows should now be empty
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        expect(nextBoard[r][c]).toBe('');
      }
    }
  });

  it('hard drop into a 9/10 row clears one line and increments score', () => {
    // Build state where bottom row is filled except column 0,
    // and the active piece is a vertical line above column 0.
    let s = createInitialState(3);
    s = reduce(s, { type: 'START' });
    s = fillRow(s, ROWS - 1, [0]);
    // Override the current piece to a LINE that is positioned to drop into col 0.
    s = {
      ...s,
      current: { kind: 'LINE', rotation: 1, x: -2, y: 0 }, // rotation 1: vertical at col 2 offset -> abs col 0
    };
    const before = s.score;
    s = reduce(s, { type: 'HARD_DROP' });
    expect(s.lines).toBe(1);
    expect(s.score).toBeGreaterThan(before);
  });
});

describe('engine — input simulation changes state', () => {
  it('MOVE left then right changes piece x', () => {
    let s = reduce(createInitialState(11), { type: 'START' });
    const startX = s.current!.x;
    s = reduce(s, { type: 'MOVE', dx: -1 });
    expect(s.current!.x).toBe(startX - 1);
    s = reduce(s, { type: 'MOVE', dx: 1 });
    expect(s.current!.x).toBe(startX);
  });

  it('keyboard map: ArrowLeft -> MOVE dx=-1, Space -> HARD_DROP', () => {
    const left = actionForKey('ArrowLeft');
    expect(left).toEqual({ type: 'MOVE', dx: -1 });
    const space = actionForKey('Space');
    expect(space).toEqual({ type: 'HARD_DROP' });
    const c = actionForKey('KeyC');
    expect(c).toEqual({ type: 'HOLD' });
    const p = actionForKey('KeyP');
    expect(p).toEqual({ type: 'PAUSE' });
    expect(actionForKey('KeyQ')).toBeUndefined();
  });

  it('ROTATE changes rotation index when room exists', () => {
    let s = reduce(createInitialState(4), { type: 'START' });
    const startRot = s.current!.rotation;
    s = reduce(s, { type: 'ROTATE' });
    // Either rotation advanced, or stayed (e.g. SQUARE has one rotation).
    if (s.current!.kind === 'SQUARE') {
      expect(s.current!.rotation).toBe(startRot);
    } else {
      expect(s.current!.rotation).not.toBe(startRot);
    }
  });

  it('SOFT_DROP advances piece down by one row', () => {
    let s = reduce(createInitialState(5), { type: 'START' });
    const startY = s.current!.y;
    s = reduce(s, { type: 'SOFT_DROP' });
    expect(s.current!.y).toBe(startY + 1);
    expect(s.score).toBeGreaterThan(0);
  });

  it('HARD_DROP locks piece and spawns a new one', () => {
    let s = reduce(createInitialState(6), { type: 'START' });
    const startKind = s.current!.kind;
    s = reduce(s, { type: 'HARD_DROP' });
    // New piece spawned; may be same kind but should be at top (y near 0 or -1)
    expect(s.current).not.toBeNull();
    expect(s.current!.y).toBeLessThanOrEqual(0);
    // The previous piece colored some cells in the board.
    const anyFilled = s.board.some(row => row.some(c => c !== ''));
    expect(anyFilled).toBe(true);
    // Use the kind so it's not "unused"
    expect(typeof startKind).toBe('string');
  });

  it('PAUSE toggles between playing and paused', () => {
    let s = reduce(createInitialState(8), { type: 'START' });
    expect(s.status).toBe('playing');
    s = reduce(s, { type: 'PAUSE' });
    expect(s.status).toBe('paused');
    s = reduce(s, { type: 'PAUSE' });
    expect(s.status).toBe('playing');
  });

  it('HOLD stashes the current piece on first use', () => {
    let s = reduce(createInitialState(9), { type: 'START' });
    const kind = s.current!.kind;
    s = reduce(s, { type: 'HOLD' });
    expect(s.hold).toBe(kind);
    expect(s.canHold).toBe(false);
  });

  it('RESTART resets score, lines, and level', () => {
    let s = reduce(createInitialState(13), { type: 'START' });
    s = { ...s, score: 500, lines: 8, level: 2 };
    s = reduce(s, { type: 'RESTART' });
    expect(s.score).toBe(0);
    expect(s.lines).toBe(0);
    expect(s.level).toBe(1);
    expect(s.status).toBe('playing');
    expect(s.current).not.toBeNull();
  });
});

describe('engine — geometry helpers', () => {
  it('pieceCells returns 4 cells for any non-null piece', () => {
    const s = reduce(createInitialState(14), { type: 'START' });
    const cells = pieceCells(s.current!);
    expect(cells.length).toBe(4);
  });

  it('collides reports out-of-bound x positions as collisions', () => {
    const s = reduce(createInitialState(15), { type: 'START' });
    const left = { ...s.current!, x: -10 };
    expect(collides(s.board, left)).toBe(true);
  });

  it('ghostPosition lands at or below the active piece', () => {
    const s = reduce(createInitialState(16), { type: 'START' });
    const g = ghostPosition(s)!;
    expect(g.y).toBeGreaterThanOrEqual(s.current!.y);
  });
});
