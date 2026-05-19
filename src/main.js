import {
  createEngine,
  hardDrop,
  holdActive,
  moveActive,
  rotateActive,
  softDrop,
  tick,
  togglePause,
} from './game/engine.js';
import { createRenderer } from './ui/renderer.js';
import { attachKeyboard } from './ui/input.js';
import { attachTouch } from './ui/touch.js';

const boardCanvas = document.getElementById('boardCanvas');
const holdCanvas = document.getElementById('holdCanvas');
const nextCanvas = document.getElementById('nextCanvas');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const touchPad = document.querySelector('.touch-pad');

let state = createEngine();
const renderer = createRenderer({ boardCanvas, holdCanvas, nextCanvas });

function updateHud() {
  scoreEl.textContent = String(state.score);
  levelEl.textContent = String(state.level);
  linesEl.textContent = String(state.lines);
  if (state.isOver) {
    overlay.classList.remove('hidden');
    overlayText.textContent = 'Game Over — press Restart';
  } else if (state.isPaused) {
    overlay.classList.remove('hidden');
    overlayText.textContent = 'Paused';
  } else {
    overlay.classList.add('hidden');
  }
}

function restart() {
  state = createEngine();
  updateHud();
}

const handlers = {
  left: () => moveActive(state, -1, 0),
  right: () => moveActive(state, 1, 0),
  softDrop: () => softDrop(state),
  hardDrop: () => hardDrop(state),
  rotateCw: () => rotateActive(state, 1),
  rotateCcw: () => rotateActive(state, -1),
  hold: () => holdActive(state),
  pause: () => togglePause(state),
  restart: () => restart(),
};

attachKeyboard(handlers);
if (touchPad) attachTouch(touchPad, handlers);

restartBtn.addEventListener('click', restart);
pauseBtn.addEventListener('click', () => {
  togglePause(state);
  updateHud();
});

let lastFrame = performance.now();
function loop(now) {
  const delta = now - lastFrame;
  lastFrame = now;
  tick(state, delta);
  renderer.render(state);
  updateHud();
  requestAnimationFrame(loop);
}

// Initial paint so the board is visible on first frame (no splash gate).
renderer.render(state);
updateHud();
requestAnimationFrame(loop);
