import {
  COLS, ROWS, PIECE_COLORS, SHAPES, BOX_SIZE,
  pieceCells, ghostPosition, GameState, PieceKind, Piece,
} from './engine';

export interface RenderRefs {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  queue: HTMLCanvasElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  overlay: HTMLElement;
  pauseBtn: HTMLButtonElement;
}

const GRID_LINE = 'rgba(255, 255, 255, 0.04)';

function resizeCanvas(canvas: HTMLCanvasElement): { cellW: number; cellH: number } {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW === 0 || cssH === 0) {
    return { cellW: 0, cellH: 0 };
  }
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  return { cellW: canvas.width / COLS, cellH: canvas.height / ROWS };
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha;
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(x + 1, y + 1, w - 2, Math.max(1, h * 0.12));
  // Inner shadow line
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x + 1, y + h - Math.max(1, h * 0.12) - 1, w - 2, Math.max(1, h * 0.12));
  ctx.globalAlpha = 1;
}

function drawBoardBackground(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  ctx.fillStyle = '#0b0f1a';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw, 0);
    ctx.lineTo(c * cw, ROWS * ch);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * ch);
    ctx.lineTo(COLS * cw, r * ch);
    ctx.stroke();
  }
}

export function renderBoard(canvas: HTMLCanvasElement, state: GameState) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { cellW: cw, cellH: ch } = resizeCanvas(canvas);
  if (cw === 0) return;
  drawBoardBackground(ctx, cw, ch);

  // Settled board
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell) drawCell(ctx, c * cw, r * ch, cw, ch, cell);
    }
  }

  if (state.current) {
    // Ghost
    const ghost = ghostPosition(state);
    if (ghost && (ghost.x !== state.current.x || ghost.y !== state.current.y)) {
      for (const [r, c] of pieceCells(ghost)) {
        if (r >= 0) drawCell(ctx, c * cw, r * ch, cw, ch, PIECE_COLORS[state.current.kind], 0.18);
      }
    }
    // Active piece
    for (const [r, c] of pieceCells(state.current)) {
      if (r >= 0) drawCell(ctx, c * cw, r * ch, cw, ch, PIECE_COLORS[state.current.kind]);
    }
  }
}

function drawPiecePreview(canvas: HTMLCanvasElement, kind: PieceKind | null, slotIndex = 0, totalSlots = 1) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  const targetW = Math.round(cssW * dpr);
  const targetH = Math.round(cssH * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  if (slotIndex === 0) {
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  if (!kind) return;
  const slotH = canvas.height / totalSlots;
  const slotY = slotIndex * slotH;
  const size = BOX_SIZE[kind];
  const cells = SHAPES[kind][0];
  // tight bounding box
  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (r > maxR) maxR = r;
    if (c < minC) minC = c;
    if (c > maxC) maxC = c;
  }
  const pw = maxC - minC + 1;
  const ph = maxR - minR + 1;
  const cell = Math.min((canvas.width * 0.7) / size, (slotH * 0.75) / size);
  const offX = (canvas.width - pw * cell) / 2 - minC * cell;
  const offY = slotY + (slotH - ph * cell) / 2 - minR * cell;
  for (const [r, c] of cells) {
    drawCell(ctx, offX + c * cell, offY + r * cell, cell, cell, PIECE_COLORS[kind]);
  }
}

export function renderHold(canvas: HTMLCanvasElement, state: GameState) {
  drawPiecePreview(canvas, state.hold, 0, 1);
}

export function renderQueue(canvas: HTMLCanvasElement, state: GameState, slots = 3) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  ctx.fillStyle = '#0b0f1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const visible = state.queue.slice(0, slots);
  for (let i = 0; i < slots; i++) {
    drawPiecePreview(canvas, visible[i] ?? null, i, slots);
  }
}

export function renderHud(refs: RenderRefs, state: GameState) {
  refs.score.textContent = String(state.score);
  refs.level.textContent = String(state.level);
  refs.lines.textContent = String(state.lines);
  refs.pauseBtn.textContent = state.status === 'paused' ? 'Resume' : 'Pause';
}

export function renderOverlay(overlay: HTMLElement, state: GameState) {
  let text: string | null = null;
  if (state.status === 'idle') text = 'idle';
  else if (state.status === 'paused') text = 'paused';
  else if (state.status === 'over') text = 'over';

  if (text === null) {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');
  const sub = overlay.querySelector('.subtitle');
  if (sub) {
    if (text === 'paused') sub.textContent = 'Paused — press P or tap Pause to resume';
    else if (text === 'over') sub.textContent = 'Stack reached the top. Tap Restart for a fresh sprint.';
    else sub.textContent = 'Press any key or tap to begin';
  }
}

export function renderAll(refs: RenderRefs, state: GameState) {
  renderBoard(refs.board, state);
  renderHold(refs.hold, state);
  renderQueue(refs.queue, state, 3);
  renderHud(refs, state);
  renderOverlay(refs.overlay, state);
}

// Re-export for consumers that might need types
export type { GameState, Piece };
