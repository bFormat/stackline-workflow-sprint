/**
 * Canvas renderer.
 *
 * Draws the playfield grid, settled cells, ghost piece, active piece,
 * the hold slot, and the next queue. All graphics are drawn procedurally
 * — no images, no fonts beyond the system default.
 */

import { BOARD_HEIGHT, BOARD_WIDTH, type ActivePiece, type BoardGrid } from './board.js';
import { PIECES, type PieceId, type Shape } from './pieces.js';

const GRID_COLOR = '#1f2a44';
const BG_COLOR = '#060a18';
const GHOST_ALPHA = 0.28;

export interface RenderTargets {
  playfield: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
}

export class Renderer {
  private playCtx: CanvasRenderingContext2D;
  private holdCtx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D;
  private cell = 20;

  constructor(private readonly targets: RenderTargets) {
    this.playCtx = required2d(targets.playfield);
    this.holdCtx = required2d(targets.hold);
    this.nextCtx = required2d(targets.next);
    this.resize();
  }

  resize(): void {
    // Backing buffer matches the CSS size for crisp rendering.
    const sizePlay = fitBuffer(this.targets.playfield, BOARD_WIDTH, BOARD_HEIGHT);
    this.cell = sizePlay.cell;
    fitMini(this.targets.hold, 4, 4);
    fitMini(this.targets.next, 4, 16);
  }

  drawAll(
    board: BoardGrid,
    active: ActivePiece | null,
    ghostRow: number | null,
    hold: PieceId | null,
    nextQueue: readonly PieceId[],
  ): void {
    this.drawBoard(board, active, ghostRow);
    this.drawHold(hold);
    this.drawNext(nextQueue);
  }

  private drawBoard(board: BoardGrid, active: ActivePiece | null, ghostRow: number | null): void {
    const ctx = this.playCtx;
    const c = this.cell;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.targets.playfield.width, this.targets.playfield.height);

    // Grid lines.
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * c + 0.5, 0);
      ctx.lineTo(x * c + 0.5, BOARD_HEIGHT * c);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * c + 0.5);
      ctx.lineTo(BOARD_WIDTH * c, y * c + 0.5);
      ctx.stroke();
    }

    // Settled cells.
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const v = board[r][col];
        if (v) this.drawCell(ctx, col, r, v, 1);
      }
    }

    // Ghost piece.
    if (active && ghostRow !== null && ghostRow !== active.row) {
      this.drawShape(ctx, active.shape, ghostRow, active.col, active.color, GHOST_ALPHA);
    }

    // Active piece.
    if (active) {
      this.drawShape(ctx, active.shape, active.row, active.col, active.color, 1);
    }
  }

  private drawHold(hold: PieceId | null): void {
    const ctx = this.holdCtx;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, this.targets.hold.width, this.targets.hold.height);
    if (!hold) return;
    const def = PIECES[hold];
    drawCenteredPiece(ctx, this.targets.hold, def.spawn, def.color);
  }

  private drawNext(queue: readonly PieceId[]): void {
    const ctx = this.nextCtx;
    const W = this.targets.next.width;
    const H = this.targets.next.height;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);
    const slotH = H / Math.max(queue.length, 1);
    for (let i = 0; i < queue.length; i++) {
      const def = PIECES[queue[i]];
      const slotTop = i * slotH;
      drawInRect(
        ctx,
        def.spawn,
        def.color,
        2,
        slotTop + 2,
        W - 4,
        slotH - 4,
      );
    }
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    col: number,
    row: number,
    color: string,
    alpha: number,
  ): void {
    const c = this.cell;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(col * c + 1, row * c + 1, c - 2, c - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(col * c + 1, row * c + 1, c - 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(col * c + 1, row * c + (c - 3), c - 2, 2);
    ctx.restore();
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    row: number,
    col: number,
    color: string,
    alpha: number,
  ): void {
    for (let r = 0; r < shape.length; r++) {
      for (let cc = 0; cc < shape[r].length; cc++) {
        if (!shape[r][cc]) continue;
        if (row + r < 0) continue;
        this.drawCell(ctx, col + cc, row + r, color, alpha);
      }
    }
  }
}

function required2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  return ctx;
}

function fitBuffer(
  canvas: HTMLCanvasElement,
  cols: number,
  rows: number,
): { cell: number } {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1));
  const widthCss = Math.max(rect.width || canvas.width, 80);
  const heightCss = Math.max(rect.height || canvas.height, 160);
  // Pick the largest integer cell size that fits inside the CSS rect.
  const cell = Math.floor(Math.min(widthCss / cols, heightCss / rows));
  const usedCell = Math.max(cell, 8);
  canvas.width = Math.floor(usedCell * cols * dpr);
  canvas.height = Math.floor(usedCell * rows * dpr);
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { cell: usedCell };
}

function fitMini(canvas: HTMLCanvasElement, cols: number, rows: number): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1));
  const widthCss = Math.max(rect.width || canvas.width, 60);
  const heightCss = Math.max(rect.height || canvas.height, 60);
  const cell = Math.max(6, Math.floor(Math.min(widthCss / cols, heightCss / rows)));
  canvas.width = Math.floor(cell * cols * dpr);
  canvas.height = Math.floor(cell * rows * dpr);
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawCenteredPiece(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  shape: Shape,
  color: string,
): void {
  const dpr = Math.max(1, Math.min(2, globalThis.devicePixelRatio || 1));
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  drawInRect(ctx, shape, color, 4, 4, W - 8, H - 8);
}

function drawInRect(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  // Trim empty borders for visual centring.
  let minR = shape.length;
  let maxR = -1;
  let minC = shape[0].length;
  let maxC = -1;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR < 0) return;
  const usedW = maxC - minC + 1;
  const usedH = maxR - minR + 1;
  const cell = Math.floor(Math.min(w / usedW, h / usedH));
  const ox = x + (w - cell * usedW) / 2;
  const oy = y + (h - cell * usedH) / 2;
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (!shape[r][c]) continue;
      const px = ox + (c - minC) * cell;
      const py = oy + (r - minR) * cell;
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(px + 1, py + 1, cell - 2, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 1, py + cell - 3, cell - 2, 2);
    }
  }
}
