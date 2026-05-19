// Stackline piece definitions.
// Original codenames — Bar, Cube, Crown, Hook, Crook, Wave, Zag — and an
// original color palette. The shapes are standard four-cell falling-block
// shapes used by many puzzle games; rotations are stored as four explicit
// matrices so the rotation system stays independent of any specific spec.

export const PIECE_IDS = ['BAR', 'CUBE', 'CROWN', 'HOOK', 'CROOK', 'WAVE', 'ZAG'];

// Color palette — intentionally distinct from the conventional puzzle
// palette: warm amber, magenta, teal, coral, mint, indigo, gold.
export const COLORS = {
  BAR: '#3ad6c6',
  CUBE: '#f6c453',
  CROWN: '#c466ff',
  HOOK: '#ff8a5b',
  CROOK: '#6c8cff',
  WAVE: '#6bf0c2',
  ZAG: '#ff6b9a',
  GHOST: 'rgba(233, 236, 255, 0.18)',
  GRID: '#232a55',
  EMPTY: '#11162b',
};

// Rotation matrices. Each piece has 4 rotation states (0..3).
// Each state is an N x N matrix; 1 indicates a filled cell.
export const PIECES = {
  BAR: {
    size: 4,
    rotations: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },
  CUBE: {
    size: 2,
    rotations: [
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
      ],
    ],
  },
  CROWN: {
    size: 3,
    rotations: [
      [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  HOOK: {
    size: 3,
    rotations: [
      [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ],
      [
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  CROOK: {
    size: 3,
    rotations: [
      [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
    ],
  },
  WAVE: {
    size: 3,
    rotations: [
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      [
        [0, 1, 0],
        [0, 1, 1],
        [0, 0, 1],
      ],
      [
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ],
      [
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
  },
  ZAG: {
    size: 3,
    rotations: [
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      [
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ],
      [
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
  },
};

/**
 * Return the filled cell offsets for a piece in a particular rotation.
 * Offsets are [x, y] pairs relative to the piece bounding-box origin.
 */
export function pieceCells(id, rotation) {
  const def = PIECES[id];
  const matrix = def.rotations[((rotation % 4) + 4) % 4];
  const cells = [];
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x]) {
        cells.push([x, y]);
      }
    }
  }
  return cells;
}

/**
 * Spawn coordinates for a new piece on a board of the given width.
 * The piece is horizontally centered and starts at the top row.
 */
export function spawnPosition(id, boardWidth) {
  const def = PIECES[id];
  return {
    x: Math.floor((boardWidth - def.size) / 2),
    y: 0,
    rotation: 0,
    id,
  };
}
