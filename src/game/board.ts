import type { ActivePiece, Cell, PieceId } from './pieces';
import { piecesCells, SHAPES } from './pieces';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
/** Extra hidden rows above the visible playfield where pieces spawn. */
export const BUFFER_ROWS = 2;
export const TOTAL_HEIGHT = BOARD_HEIGHT + BUFFER_ROWS;

export type BoardCell = PieceId | null;
export type Board = BoardCell[][];

export function createBoard(): Board {
  const rows: Board = [];
  for (let y = 0; y < TOTAL_HEIGHT; y++) {
    rows.push(new Array<BoardCell>(BOARD_WIDTH).fill(null));
  }
  return rows;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function isInside(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < TOTAL_HEIGHT;
}

export function cellOccupied(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= BOARD_WIDTH) return true;
  if (y >= TOTAL_HEIGHT) return true;
  if (y < 0) return false; // above-the-board cells are always empty
  return board[y][x] !== null;
}

export function pieceCollides(board: Board, piece: ActivePiece): boolean {
  const cells = piecesCells(piece);
  for (const c of cells) {
    if (cellOccupied(board, c.x, c.y)) return true;
  }
  return false;
}

export function lockPiece(board: Board, piece: ActivePiece): Board {
  const next = cloneBoard(board);
  for (const c of piecesCells(piece)) {
    if (c.y >= 0 && c.y < TOTAL_HEIGHT && c.x >= 0 && c.x < BOARD_WIDTH) {
      next[c.y][c.x] = piece.id;
    }
  }
  return next;
}

export function isRowFull(row: BoardCell[]): boolean {
  return row.every((c) => c !== null);
}

export interface ClearResult {
  board: Board;
  cleared: number;
  clearedRows: number[];
}

export function clearFullRows(board: Board): ClearResult {
  const clearedRows: number[] = [];
  const kept: BoardCell[][] = [];
  for (let y = 0; y < board.length; y++) {
    if (isRowFull(board[y])) {
      clearedRows.push(y);
    } else {
      kept.push(board[y]);
    }
  }
  const newRows: BoardCell[][] = [];
  for (let i = 0; i < clearedRows.length; i++) {
    newRows.push(new Array<BoardCell>(BOARD_WIDTH).fill(null));
  }
  const next: Board = [...newRows, ...kept];
  return { board: next, cleared: clearedRows.length, clearedRows };
}

export function spawnPiece(id: PieceId): ActivePiece {
  const shape = SHAPES[id];
  return {
    id,
    rotation: 0,
    x: shape.spawnOffset.x,
    y: shape.spawnOffset.y,
  };
}

/** Returns the lowest legal y-coordinate the piece would land at. */
export function dropY(board: Board, piece: ActivePiece): number {
  let test: ActivePiece = { ...piece };
  while (!pieceCollides(board, { ...test, y: test.y + 1 })) {
    test = { ...test, y: test.y + 1 };
  }
  return test.y;
}

export function ghostPieceCells(board: Board, piece: ActivePiece): Cell[] {
  const y = dropY(board, piece);
  return piecesCells({ ...piece, y });
}
