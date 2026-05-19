import { COLORS, PIECES, pieceCells } from '../game/pieces.js';
import { BOARD_HEIGHT, HIDDEN_ROWS } from '../game/board.js';
import { ghostPosition } from '../game/engine.js';

export function createRenderer({ boardCanvas, holdCanvas, nextCanvas }) {
  const boardCtx = boardCanvas.getContext('2d');
  const holdCtx = holdCanvas.getContext('2d');
  const nextCtx = nextCanvas.getContext('2d');

  function drawCell(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    // soft highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(x + 2, y + 2, size - 4, Math.max(2, (size - 4) / 4));
  }

  function drawBoard(state) {
    const width = state.board[0].length;
    const visibleHeight = BOARD_HEIGHT;
    const cell = boardCanvas.width / width;

    // background + grid
    boardCtx.fillStyle = COLORS.EMPTY;
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.strokeStyle = COLORS.GRID;
    boardCtx.lineWidth = 1;
    for (let x = 1; x < width; x += 1) {
      boardCtx.beginPath();
      boardCtx.moveTo(x * cell, 0);
      boardCtx.lineTo(x * cell, boardCanvas.height);
      boardCtx.stroke();
    }
    for (let y = 1; y < visibleHeight; y += 1) {
      boardCtx.beginPath();
      boardCtx.moveTo(0, y * cell);
      boardCtx.lineTo(boardCanvas.width, y * cell);
      boardCtx.stroke();
    }

    // locked cells (skipping the hidden buffer rows at top)
    for (let y = 0; y < visibleHeight; y += 1) {
      const row = state.board[y + HIDDEN_ROWS];
      if (!row) continue;
      for (let x = 0; x < width; x += 1) {
        const id = row[x];
        if (id) drawCell(boardCtx, x * cell, y * cell, cell, COLORS[id]);
      }
    }

    // ghost
    const ghost = ghostPosition(state);
    if (ghost) {
      const cells = pieceCells(ghost.id, ghost.rotation);
      for (const [cx, cy] of cells) {
        const x = ghost.x + cx;
        const y = ghost.y + cy - HIDDEN_ROWS;
        if (y < 0) continue;
        boardCtx.fillStyle = COLORS.GHOST;
        boardCtx.fillRect(x * cell, y * cell, cell, cell);
        boardCtx.strokeStyle = COLORS[ghost.id];
        boardCtx.lineWidth = 2;
        boardCtx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      }
    }

    // active piece
    if (state.active) {
      const p = state.active;
      const cells = pieceCells(p.id, p.rotation);
      for (const [cx, cy] of cells) {
        const x = p.x + cx;
        const y = p.y + cy - HIDDEN_ROWS;
        if (y < 0) continue;
        drawCell(boardCtx, x * cell, y * cell, cell, COLORS[p.id]);
      }
    }
  }

  function drawPiecePreview(ctx, canvas, id) {
    ctx.fillStyle = COLORS.EMPTY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!id) return;
    const def = PIECES[id];
    const cells = pieceCells(id, 0);
    const pad = 8;
    const cell = Math.min(
      (canvas.width - pad * 2) / def.size,
      (canvas.height - pad * 2) / def.size,
    );
    // tightly center the actual filled bounding box
    const xs = cells.map(([x]) => x);
    const ys = cells.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const boxW = (maxX - minX + 1) * cell;
    const boxH = (maxY - minY + 1) * cell;
    const offsetX = (canvas.width - boxW) / 2 - minX * cell;
    const offsetY = (canvas.height - boxH) / 2 - minY * cell;
    for (const [cx, cy] of cells) {
      drawCell(ctx, offsetX + cx * cell, offsetY + cy * cell, cell, COLORS[id]);
    }
  }

  function drawHold(state) {
    drawPiecePreview(holdCtx, holdCanvas, state.hold.held);
  }

  function drawNextQueue(state, count = 5) {
    nextCtx.fillStyle = COLORS.EMPTY;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    const queue = state.randomizer.peek(count);
    const slotH = nextCanvas.height / count;
    queue.forEach((id, idx) => {
      const def = PIECES[id];
      const cells = pieceCells(id, 0);
      const pad = 6;
      const cell = Math.min(
        (nextCanvas.width - pad * 2) / def.size,
        (slotH - pad * 2) / def.size,
      );
      const xs = cells.map(([x]) => x);
      const ys = cells.map(([, y]) => y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const boxW = (maxX - minX + 1) * cell;
      const boxH = (maxY - minY + 1) * cell;
      const ox = (nextCanvas.width - boxW) / 2 - minX * cell;
      const oy = idx * slotH + (slotH - boxH) / 2 - minY * cell;
      for (const [cx, cy] of cells) {
        drawCell(nextCtx, ox + cx * cell, oy + cy * cell, cell, COLORS[id]);
      }
    });
  }

  function render(state) {
    drawBoard(state);
    drawHold(state);
    drawNextQueue(state);
  }

  return { render };
}
