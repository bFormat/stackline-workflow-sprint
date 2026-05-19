import './style.css';
import { Engine } from './game/engine';
import { renderBoard, renderHud, renderPreview } from './ui/render';
import { bindKeyboard, bindTouchButtons } from './ui/input';
import { BOARD_HEIGHT, BOARD_WIDTH } from './game/board';

const PREVIEW_COUNT = 4;

function el<T extends HTMLElement>(html: string): T {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild as T;
}

function bootstrap(): void {
  const app = document.getElementById('app');
  if (!app) throw new Error('Missing #app root');

  app.innerHTML = '';

  const title = el<HTMLElement>(`
    <header class="title-bar">
      <h1>Stackline Workflow Sprint</h1>
      <p>Stack the falling shapes, clear rows, climb the levels.</p>
    </header>
  `);

  const layout = el<HTMLElement>(`
    <section class="layout">
      <aside class="panel side" aria-label="Hold slot">
        <h2>Hold</h2>
        <canvas id="hold" width="120" height="120"></canvas>
      </aside>
      <div class="board-wrap">
        <canvas id="board" width="300" height="600" aria-label="Game board"></canvas>
        <div class="hud" role="group" aria-label="Game stats">
          <div class="stat"><div class="label">Score</div><div class="value" id="score">0</div></div>
          <div class="stat"><div class="label">Level</div><div class="value" id="level">1</div></div>
          <div class="stat"><div class="label">Lines</div><div class="value" id="lines">0</div></div>
        </div>
        <div class="status-line" id="status" data-tone="live">Running</div>
      </div>
      <aside class="panel side" aria-label="Next pieces">
        <h2>Next</h2>
        <canvas id="next" width="120" height="380"></canvas>
      </aside>
    </section>
  `);

  const toolbar = el<HTMLElement>(`
    <div class="toolbar" role="group" aria-label="Game actions">
      <button type="button" data-action="pause">Pause</button>
      <button type="button" data-action="restart">Restart</button>
      <button type="button" data-action="hold">Hold</button>
    </div>
  `);

  const touch = el<HTMLElement>(`
    <div class="touch-controls" aria-label="Touch controls">
      <button type="button" data-action="left" aria-label="Move left">&larr;</button>
      <button type="button" data-action="rotateCCW" aria-label="Rotate counter clockwise">&#8634;</button>
      <button type="button" data-action="softDrop" aria-label="Soft drop">&darr;</button>
      <button type="button" data-action="rotateCW" aria-label="Rotate clockwise">&#8635;</button>
      <button type="button" data-action="right" aria-label="Move right">&rarr;</button>
      <button type="button" data-action="hardDrop" aria-label="Hard drop">DROP</button>
      <button type="button" data-action="hold" aria-label="Hold piece">HOLD</button>
      <button type="button" data-action="pause" aria-label="Pause">PAUSE</button>
      <button type="button" data-action="restart" aria-label="Restart">NEW</button>
    </div>
  `);

  const help = el<HTMLElement>(`
    <p class="help">
      Arrows / WASD move &middot; Up or X / W rotate &middot; Z rotates the other way &middot;
      Space hard-drops &middot; C or Shift holds &middot; P pauses &middot; R restarts.
    </p>
  `);

  app.append(title, layout, toolbar, touch, help);

  const boardCanvas = document.getElementById('board') as HTMLCanvasElement;
  const holdCanvas = document.getElementById('hold') as HTMLCanvasElement;
  const nextCanvas = document.getElementById('next') as HTMLCanvasElement;
  const status = document.getElementById('status') as HTMLElement;
  const score = document.getElementById('score') as HTMLElement;
  const level = document.getElementById('level') as HTMLElement;
  const lines = document.getElementById('lines') as HTMLElement;

  const engine = new Engine();
  engine.spawn();

  bindKeyboard(engine);
  bindTouchButtons(toolbar, engine);
  bindTouchButtons(touch, engine);

  function resizeCanvas(): void {
    // Use a fixed logical cell size based on the canvas pixel buffer.
    const dpr = window.devicePixelRatio || 1;
    const boardWidthCss = boardCanvas.clientWidth || 300;
    const cell = Math.floor(boardWidthCss / BOARD_WIDTH);
    boardCanvas.width = cell * BOARD_WIDTH * dpr;
    boardCanvas.height = cell * BOARD_HEIGHT * dpr;
    const ctx = boardCanvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sideCell = Math.max(12, Math.floor((holdCanvas.clientWidth || 110) / 6));
    holdCanvas.width = sideCell * 6 * dpr;
    holdCanvas.height = sideCell * 6 * dpr;
    const hctx = holdCanvas.getContext('2d');
    if (hctx) hctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    nextCanvas.width = sideCell * 6 * dpr;
    nextCanvas.height = sideCell * 6 * PREVIEW_COUNT * dpr;
    const nctx = nextCanvas.getContext('2d');
    if (nctx) nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let last = performance.now();
  const hud = { score, level, lines, status };

  function loop(now: number): void {
    const dt = Math.min(64, now - last);
    last = now;
    engine.tick(dt);

    const boardCtx = boardCanvas.getContext('2d');
    if (boardCtx) {
      const dpr = window.devicePixelRatio || 1;
      const cell = boardCanvas.width / dpr / BOARD_WIDTH;
      renderBoard(boardCtx, engine, cell);
    }

    const holdCtx = holdCanvas.getContext('2d');
    if (holdCtx) {
      const dpr = window.devicePixelRatio || 1;
      const sideCell = holdCanvas.width / dpr / 6;
      renderPreview(holdCtx, [engine.state.hold], sideCell);
    }

    const nextCtx = nextCanvas.getContext('2d');
    if (nextCtx) {
      const dpr = window.devicePixelRatio || 1;
      const sideCell = nextCanvas.width / dpr / 6;
      const queue = engine.state.next.slice(0, PREVIEW_COUNT);
      renderPreview(nextCtx, queue, sideCell);
    }

    renderHud(hud, engine);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
