import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  BUFFER_ROWS,
  ghostPieceCells,
} from '../game/board';
import type { Engine } from '../game/engine';
import { SHAPES, piecesCells } from '../game/pieces';

const BACKDROP = '#0b1020';
const GRID_LINE = 'rgba(255, 255, 255, 0.06)';
const GHOST_ALPHA = 0.22;

export interface HudElements {
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  status: HTMLElement;
}

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  engine: Engine,
  cell: number,
): void {
  const { board, active } = engine.state;
  const width = BOARD_WIDTH * cell;
  const height = BOARD_HEIGHT * cell;
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  for (let x = 1; x < BOARD_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, height);
    ctx.stroke();
  }
  for (let y = 1; y < BOARD_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(width, y * cell + 0.5);
    ctx.stroke();
  }

  // Locked board cells (skip the buffer rows at the top)
  for (let y = BUFFER_ROWS; y < board.length; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const id = board[y][x];
      if (!id) continue;
      drawCell(ctx, x, y - BUFFER_ROWS, cell, SHAPES[id].color, 1);
    }
  }

  if (active) {
    // Ghost piece
    const ghost = ghostPieceCells(board, active);
    for (const c of ghost) {
      if (c.y < BUFFER_ROWS) continue;
      drawCell(ctx, c.x, c.y - BUFFER_ROWS, cell, SHAPES[active.id].color, GHOST_ALPHA);
    }
    // Active piece
    for (const c of piecesCells(active)) {
      if (c.y < BUFFER_ROWS) continue;
      drawCell(ctx, c.x, c.y - BUFFER_ROWS, cell, SHAPES[active.id].color, 1);
    }
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  cell: number,
  color: string,
  alpha: number,
): void {
  const x = col * cell;
  const y = row * cell;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
  ctx.globalAlpha = Math.min(1, alpha + 0.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
  ctx.restore();
}

export function renderPreview(
  ctx: CanvasRenderingContext2D,
  ids: Array<string | null>,
  cell: number,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ids.forEach((id, idx) => {
    if (!id) return;
    const shape = SHAPES[id as keyof typeof SHAPES];
    const offsetY = idx * cell * 3 + 4;
    const cells = shape.rotations[0];
    const minX = Math.min(...cells.map((c) => c.x));
    const maxX = Math.max(...cells.map((c) => c.x));
    const minY = Math.min(...cells.map((c) => c.y));
    const width = (maxX - minX + 1) * cell;
    const offsetX = Math.floor((ctx.canvas.width - width) / 2);
    for (const c of cells) {
      const x = (c.x - minX) * cell + offsetX;
      const y = (c.y - minY) * cell + offsetY;
      ctx.save();
      ctx.fillStyle = shape.color;
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
      ctx.restore();
    }
  });
}

export function renderHud(hud: HudElements, engine: Engine): void {
  hud.score.textContent = engine.state.score.toString();
  hud.level.textContent = engine.state.level.toString();
  hud.lines.textContent = engine.state.lines.toString();
  if (engine.state.gameOver) {
    hud.status.textContent = 'Run ended — press Restart';
    hud.status.dataset.tone = 'over';
  } else if (engine.state.paused) {
    hud.status.textContent = 'Paused';
    hud.status.dataset.tone = 'paused';
  } else {
    hud.status.textContent = 'Running';
    hud.status.dataset.tone = 'live';
  }
}
