/**
 * Stackline Workflow Sprint — entry point.
 *
 * Wires the engine, renderer, UI, audio, and input together. Kicked
 * off automatically when the DOM is ready.
 */

import { SoundEngine } from './audio.js';
import { Game } from './game.js';
import { InputController } from './input.js';
import { Renderer } from './render.js';
import { UI } from './ui.js';

function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

function boot(): void {
  const playfield = $<HTMLCanvasElement>('playfield');
  const holdCanvas = $<HTMLCanvasElement>('hold');
  const nextCanvas = $<HTMLCanvasElement>('next');
  const touchButtons = document.getElementById('touch-controls');

  const ui = new UI({
    score: $('stat-score'),
    level: $('stat-level'),
    lines: $('stat-lines'),
    overlayStart: $('overlay-start'),
    overlayPause: $('overlay-pause'),
    overlayGameOver: $('overlay-gameover'),
    overlayHelp: $('overlay-help'),
  });

  const audio = new SoundEngine();

  const game = new Game({
    events: {
      onMove: () => audio.move(),
      onRotate: () => audio.rotate(),
      onDrop: () => audio.drop(),
      onLock: () => audio.lock(),
      onClear: (n) => audio.clear(n),
      onHold: () => audio.hold(),
      onGameOver: () => audio.gameOver(),
    },
  });

  const renderer = new Renderer({
    playfield,
    hold: holdCanvas,
    next: nextCanvas,
  });

  let helpOpen = false;

  const draw = (): void => {
    renderer.drawAll(game.board, game.active, game.ghostRow, game.hold, game.getNext(5));
    ui.updateHud(game);
    ui.reflectPhase(game, helpOpen);
  };

  const input = new InputController({
    target: window,
    touchSurface: playfield,
    touchButtons,
  });
  input.onAction((action) => {
    if (helpOpen) {
      if (action === 'pause' || action === 'restart') {
        helpOpen = false;
      } else {
        return;
      }
    }
    audio.resume();
    if (game.phase === 'ready') {
      if (action === 'pause') return;
      game.start();
    }
    game.action(action);
    draw();
  });
  input.start();

  // Overlay buttons.
  const btnStart = document.getElementById('btn-start');
  const btnAgain = document.getElementById('btn-again');
  const btnResume = document.getElementById('btn-resume');
  const btnRestart = document.getElementById('btn-restart');
  const btnPause = document.getElementById('btn-pause');
  const btnHelp = document.getElementById('btn-help');
  const btnHelp2 = document.getElementById('btn-help-2');
  const btnHelpClose = document.getElementById('btn-help-close');

  const handle = (fn: () => void) => () => {
    audio.resume();
    fn();
    draw();
  };

  btnStart?.addEventListener('click', handle(() => game.start()));
  btnAgain?.addEventListener('click', handle(() => game.start()));
  btnResume?.addEventListener('click', handle(() => game.togglePause()));
  btnRestart?.addEventListener('click', handle(() => game.start()));
  btnPause?.addEventListener(
    'click',
    handle(() => {
      if (game.phase === 'playing' || game.phase === 'paused') game.togglePause();
    }),
  );
  btnHelp?.addEventListener(
    'click',
    handle(() => {
      helpOpen = true;
    }),
  );
  btnHelp2?.addEventListener(
    'click',
    handle(() => {
      helpOpen = true;
    }),
  );
  btnHelpClose?.addEventListener(
    'click',
    handle(() => {
      helpOpen = false;
    }),
  );

  // Resize handling — recompute the canvas backing buffers on viewport changes.
  window.addEventListener('resize', () => {
    renderer.resize();
    draw();
  });

  // RAF loop.
  let prev = performance.now();
  const tick = (now: number): void => {
    const dt = Math.min(100, now - prev);
    prev = now;
    if (!helpOpen) game.update(dt);
    draw();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
