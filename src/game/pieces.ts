// Shape definitions and rotation helpers for Stackline Workflow Sprint.
// All shape geometry is defined as offsets relative to a piece origin so the
// engine can rotate, translate, and collide-test without copying full grids.

export type PieceId = 'I' | 'O' | 'T' | 'S' | 'Z' | 'L' | 'J';

export interface Cell {
  x: number;
  y: number;
}

export interface PieceShape {
  id: PieceId;
  /** Rotation state index 0..3 -> offsets from origin. */
  rotations: Cell[][];
  /** Color used by the renderer. */
  color: string;
  /** Bounding box size used for spawn placement. */
  spawnOffset: { x: number; y: number };
}

const mk = (cells: Array<[number, number]>): Cell[] =>
  cells.map(([x, y]) => ({ x, y }));

/**
 * Each rotation state stores the cell offsets occupied by the piece.
 * Coordinates use (x = column, y = row) with y growing downward.
 */
export const SHAPES: Record<PieceId, PieceShape> = {
  I: {
    id: 'I',
    color: '#4ad6c8',
    spawnOffset: { x: 3, y: -1 },
    rotations: [
      mk([[0, 1], [1, 1], [2, 1], [3, 1]]),
      mk([[2, 0], [2, 1], [2, 2], [2, 3]]),
      mk([[0, 2], [1, 2], [2, 2], [3, 2]]),
      mk([[1, 0], [1, 1], [1, 2], [1, 3]]),
    ],
  },
  O: {
    id: 'O',
    color: '#f0d24b',
    spawnOffset: { x: 4, y: 0 },
    rotations: [
      mk([[0, 0], [1, 0], [0, 1], [1, 1]]),
      mk([[0, 0], [1, 0], [0, 1], [1, 1]]),
      mk([[0, 0], [1, 0], [0, 1], [1, 1]]),
      mk([[0, 0], [1, 0], [0, 1], [1, 1]]),
    ],
  },
  T: {
    id: 'T',
    color: '#b367d6',
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      mk([[1, 0], [0, 1], [1, 1], [2, 1]]),
      mk([[1, 0], [1, 1], [2, 1], [1, 2]]),
      mk([[0, 1], [1, 1], [2, 1], [1, 2]]),
      mk([[1, 0], [0, 1], [1, 1], [1, 2]]),
    ],
  },
  S: {
    id: 'S',
    color: '#5fcb6a',
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      mk([[1, 0], [2, 0], [0, 1], [1, 1]]),
      mk([[1, 0], [1, 1], [2, 1], [2, 2]]),
      mk([[1, 1], [2, 1], [0, 2], [1, 2]]),
      mk([[0, 0], [0, 1], [1, 1], [1, 2]]),
    ],
  },
  Z: {
    id: 'Z',
    color: '#e0584a',
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      mk([[0, 0], [1, 0], [1, 1], [2, 1]]),
      mk([[2, 0], [1, 1], [2, 1], [1, 2]]),
      mk([[0, 1], [1, 1], [1, 2], [2, 2]]),
      mk([[1, 0], [0, 1], [1, 1], [0, 2]]),
    ],
  },
  L: {
    id: 'L',
    color: '#f29040',
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      mk([[2, 0], [0, 1], [1, 1], [2, 1]]),
      mk([[1, 0], [1, 1], [1, 2], [2, 2]]),
      mk([[0, 1], [1, 1], [2, 1], [0, 2]]),
      mk([[0, 0], [1, 0], [1, 1], [1, 2]]),
    ],
  },
  J: {
    id: 'J',
    color: '#3f7adf',
    spawnOffset: { x: 3, y: 0 },
    rotations: [
      mk([[0, 0], [0, 1], [1, 1], [2, 1]]),
      mk([[1, 0], [2, 0], [1, 1], [1, 2]]),
      mk([[0, 1], [1, 1], [2, 1], [2, 2]]),
      mk([[1, 0], [1, 1], [0, 2], [1, 2]]),
    ],
  },
};

export const PIECE_IDS: PieceId[] = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];

export interface ActivePiece {
  id: PieceId;
  rotation: 0 | 1 | 2 | 3;
  x: number;
  y: number;
}

export function piecesCells(piece: ActivePiece): Cell[] {
  const shape = SHAPES[piece.id];
  return shape.rotations[piece.rotation].map((c) => ({
    x: c.x + piece.x,
    y: c.y + piece.y,
  }));
}

export function rotateRight(rotation: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
  return ((rotation + 1) % 4) as 0 | 1 | 2 | 3;
}

export function rotateLeft(rotation: 0 | 1 | 2 | 3): 0 | 1 | 2 | 3 {
  return ((rotation + 3) % 4) as 0 | 1 | 2 | 3;
}

/**
 * Original wall-kick / floor-kick offset table.  When a rotation is blocked,
 * the engine tries each of these offsets in order before failing.  The I piece
 * gets wider offsets so it can clear walls when horizontal.
 */
export function kickOffsets(id: PieceId): Cell[] {
  if (id === 'O') return [{ x: 0, y: 0 }];
  if (id === 'I') {
    return [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: -1 },
    ];
  }
  return [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
  ];
}
