// Stackline Workflow Sprint — game engine
// Pure, framework-free reducer-style functions so they're trivially testable.
// All naming/colors are original to this project. No TETR.IO content.

export const COLS = 10;
export const ROWS = 20;
export const HIDDEN_ROWS = 0; // playfield is rendered as-is

export type PieceKind = 'LINE' | 'SQUARE' | 'WEDGE' | 'ZIG' | 'ZAG' | 'HOOK' | 'CRANK';

export const ALL_KINDS: PieceKind[] = ['LINE', 'SQUARE', 'WEDGE', 'ZIG', 'ZAG', 'HOOK', 'CRANK'];

// Original color palette — chosen to be visually distinct and not match
// any specific external falling-block branding.
export const PIECE_COLORS: Record<PieceKind, string> = {
  LINE:   '#f25f5c',
  SQUARE: '#ffe066',
  WEDGE:  '#a78bfa',
  ZIG:    '#4ade80',
  ZAG:    '#f97316',
  HOOK:   '#38bdf8',
  CRANK:  '#ec4899',
};

// Shape grids: rotations are arrays of [row, col] cell offsets within the
// piece's local bounding box. The bounding box size differs per kind.
export const BOX_SIZE: Record<PieceKind, number> = {
  LINE: 4,
  SQUARE: 2,
  WEDGE: 3,
  ZIG: 3,
  ZAG: 3,
  HOOK: 3,
  CRANK: 3,
};

export const SHAPES: Record<PieceKind, [number, number][][]> = {
  LINE: [
    [[1,0],[1,1],[1,2],[1,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,1],[1,1],[2,1],[3,1]],
  ],
  SQUARE: [
    [[0,0],[0,1],[1,0],[1,1]],
  ],
  WEDGE: [
    [[0,1],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[1,2],[2,1]],
    [[0,1],[1,0],[1,1],[2,1]],
  ],
  ZIG: [
    [[0,1],[0,2],[1,0],[1,1]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,1],[1,2],[2,0],[2,1]],
    [[0,0],[1,0],[1,1],[2,1]],
  ],
  ZAG: [
    [[0,0],[0,1],[1,1],[1,2]],
    [[0,2],[1,1],[1,2],[2,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[0,1],[1,0],[1,1],[2,0]],
  ],
  HOOK: [
    [[0,2],[1,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[1,2],[2,0]],
    [[0,0],[0,1],[1,1],[2,1]],
  ],
  CRANK: [
    [[0,0],[1,0],[1,1],[1,2]],
    [[0,1],[0,2],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,0],[2,1]],
  ],
};

export type Cell = '' | string;
export type Board = Cell[][];

export interface Piece {
  kind: PieceKind;
  rotation: number;
  x: number;
  y: number;
}

export type Status = 'idle' | 'playing' | 'paused' | 'over';

export interface GameState {
  board: Board;
  current: Piece | null;
  hold: PieceKind | null;
  canHold: boolean;
  queue: PieceKind[];
  bag: PieceKind[];
  seed: number;
  score: number;
  level: number;
  lines: number;
  status: Status;
  dropMs: number; // ms accumulated for gravity step
}

export type Action =
  | { type: 'TICK'; dt: number }
  | { type: 'MOVE'; dx: -1 | 1 }
  | { type: 'ROTATE' }
  | { type: 'SOFT_DROP' }
  | { type: 'HARD_DROP' }
  | { type: 'HOLD' }
  | { type: 'PAUSE' }
  | { type: 'START' }
  | { type: 'RESTART' };

// ----- PRNG (deterministic, seeded) -----
function nextSeed(seed: number): number {
  // 32-bit LCG (Numerical Recipes constants) — original code, public-domain math.
  return (Math.imul(seed | 0, 1664525) + 1013904223) | 0;
}
function rand01(seed: number): [number, number] {
  const s = nextSeed(seed);
  return [s, ((s >>> 0) / 0x100000000)];
}

// ----- 7-bag piece sequencer (industry-standard mechanism, original code) -----
export function refillBag(bag: PieceKind[], seed: number): { bag: PieceKind[]; seed: number } {
  if (bag.length > 0) return { bag, seed };
  const next: PieceKind[] = [...ALL_KINDS];
  let s = seed;
  for (let i = next.length - 1; i > 0; i--) {
    const [ns, r] = rand01(s);
    s = ns;
    const j = Math.floor(r * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return { bag: next, seed: s };
}

function pullPiece(bag: PieceKind[], seed: number): { kind: PieceKind; bag: PieceKind[]; seed: number } {
  const r = refillBag(bag, seed);
  const newBag = [...r.bag];
  const kind = newBag.shift() as PieceKind;
  return { kind, bag: newBag, seed: r.seed };
}

// ----- Initial state -----
export function emptyBoard(): Board {
  const b: Board = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) row.push('');
    b.push(row);
  }
  return b;
}

export function createInitialState(seed = Date.now() & 0x7fffffff): GameState {
  return {
    board: emptyBoard(),
    current: null,
    hold: null,
    canHold: true,
    queue: [],
    bag: [],
    seed,
    score: 0,
    level: 1,
    lines: 0,
    status: 'idle',
    dropMs: 0,
  };
}

function spawnPiece(kind: PieceKind): Piece {
  // Spawn near top-center of board. x is column of bounding box top-left.
  const size = BOX_SIZE[kind];
  return {
    kind,
    rotation: 0,
    x: Math.floor((COLS - size) / 2),
    y: kind === 'LINE' ? -1 : 0,
  };
}

export function pieceCells(p: Piece): [number, number][] {
  return SHAPES[p.kind][p.rotation % SHAPES[p.kind].length].map(([r, c]) => [p.y + r, p.x + c]);
}

export function collides(board: Board, p: Piece): boolean {
  for (const [r, c] of pieceCells(p)) {
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && board[r][c] !== '') return true;
  }
  return false;
}

function lockPiece(board: Board, p: Piece): Board {
  const next = board.map(row => row.slice());
  for (const [r, c] of pieceCells(p)) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
    next[r][c] = PIECE_COLORS[p.kind];
  }
  return next;
}

// Returns { board, clearedRows }
export function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter(row => row.some(cell => cell === ''));
  const cleared = ROWS - kept.length;
  while (kept.length < ROWS) {
    const blank: Cell[] = [];
    for (let c = 0; c < COLS; c++) blank.push('');
    kept.unshift(blank);
  }
  return { board: kept, cleared };
}

// Score table (original values; commonly used schedule):
//  1 row -> 100 * level
//  2 rows -> 300 * level
//  3 rows -> 500 * level
//  4 rows -> 800 * level
export function rowScore(cleared: number, level: number): number {
  const table = [0, 100, 300, 500, 800];
  return (table[cleared] ?? 0) * level;
}

export function gravityMs(level: number): number {
  // Falls a row every N ms; faster as level rises. Floor at 80 ms.
  return Math.max(80, 800 - (level - 1) * 70);
}

function ensureQueue(state: GameState, minSize = 5): GameState {
  const queue = state.queue.slice();
  let bag = state.bag.slice();
  let seed = state.seed;
  while (queue.length < minSize) {
    const r = pullPiece(bag, seed);
    bag = r.bag;
    seed = r.seed;
    queue.push(r.kind);
  }
  return { ...state, queue, bag, seed };
}

function spawnNext(state: GameState): GameState {
  const ensured = ensureQueue(state);
  const [next, ...rest] = ensured.queue;
  const piece = spawnPiece(next);
  const lostGame = collides(ensured.board, piece);
  return {
    ...ensured,
    queue: rest,
    current: piece,
    canHold: true,
    status: lostGame ? 'over' : ensured.status,
  };
}

function tryMove(state: GameState, dx: number, dy: number): GameState {
  if (!state.current || state.status !== 'playing') return state;
  const candidate = { ...state.current, x: state.current.x + dx, y: state.current.y + dy };
  if (!collides(state.board, candidate)) {
    return { ...state, current: candidate };
  }
  return state;
}

function tryRotate(state: GameState): GameState {
  if (!state.current || state.status !== 'playing') return state;
  const piece = state.current;
  const rots = SHAPES[piece.kind].length;
  const nextRot = (piece.rotation + 1) % rots;
  // Lightweight wall-kick attempts: original (0,0), then -1, +1, -2, +2 columns,
  // and -1 row (for vertical line clearance).
  const kicks: [number, number][] = [[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]];
  for (const [kx, ky] of kicks) {
    const cand = { ...piece, rotation: nextRot, x: piece.x + kx, y: piece.y + ky };
    if (!collides(state.board, cand)) return { ...state, current: cand };
  }
  return state;
}

function lockAndAdvance(state: GameState): GameState {
  if (!state.current) return state;
  const locked = lockPiece(state.board, state.current);
  const { board: cleared, cleared: rows } = clearLines(locked);
  const newLines = state.lines + rows;
  const newLevel = Math.max(1, Math.floor(newLines / 10) + 1);
  const score = state.score + rowScore(rows, state.level);
  const after: GameState = {
    ...state,
    board: cleared,
    current: null,
    score,
    lines: newLines,
    level: newLevel,
    dropMs: 0,
  };
  return spawnNext(after);
}

function softStep(state: GameState): GameState {
  if (!state.current || state.status !== 'playing') return state;
  const moved = tryMove(state, 0, 1);
  if (moved.current === state.current) {
    // could not move down — lock
    return lockAndAdvance(state);
  }
  return moved;
}

function hardDrop(state: GameState): GameState {
  if (!state.current || state.status !== 'playing') return state;
  let piece = state.current;
  let dropped = 0;
  while (!collides(state.board, { ...piece, y: piece.y + 1 })) {
    piece = { ...piece, y: piece.y + 1 };
    dropped++;
  }
  // Hard drop bonus: +2 per row dropped (original value).
  const after: GameState = {
    ...state,
    current: piece,
    score: state.score + dropped * 2,
  };
  return lockAndAdvance(after);
}

function doHold(state: GameState): GameState {
  if (!state.current || !state.canHold || state.status !== 'playing') return state;
  const currentKind = state.current.kind;
  if (state.hold === null) {
    const ensured = ensureQueue({ ...state, hold: currentKind, canHold: false, current: null });
    const [next, ...rest] = ensured.queue;
    const piece = spawnPiece(next);
    const lost = collides(ensured.board, piece);
    return {
      ...ensured,
      queue: rest,
      current: piece,
      status: lost ? 'over' : ensured.status,
    };
  }
  // swap
  const swappedKind = state.hold;
  const piece = spawnPiece(swappedKind);
  const lost = collides(state.board, piece);
  return {
    ...state,
    hold: currentKind,
    current: piece,
    canHold: false,
    status: lost ? 'over' : state.status,
  };
}

export function ghostPosition(state: GameState): Piece | null {
  if (!state.current) return null;
  let p = state.current;
  while (!collides(state.board, { ...p, y: p.y + 1 })) {
    p = { ...p, y: p.y + 1 };
  }
  return p;
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      if (state.status === 'playing') return state;
      const base = state.status === 'idle' || state.status === 'over'
        ? createInitialState(state.seed)
        : state;
      const started: GameState = { ...base, status: 'playing' };
      if (!started.current) return spawnNext(started);
      return started;
    }
    case 'RESTART': {
      const fresh = createInitialState(state.seed + 1);
      return spawnNext({ ...fresh, status: 'playing' });
    }
    case 'PAUSE': {
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;
    }
    case 'MOVE': return tryMove(state, action.dx, 0);
    case 'ROTATE': return tryRotate(state);
    case 'SOFT_DROP': {
      const next = tryMove(state, 0, 1);
      if (next.current === state.current) return state;
      return { ...next, score: next.score + 1 };
    }
    case 'HARD_DROP': return hardDrop(state);
    case 'HOLD': return doHold(state);
    case 'TICK': {
      if (state.status !== 'playing' || !state.current) return state;
      const drop = gravityMs(state.level);
      const acc = state.dropMs + action.dt;
      if (acc < drop) return { ...state, dropMs: acc };
      const stepped = softStep({ ...state, dropMs: 0 });
      return stepped;
    }
  }
}
