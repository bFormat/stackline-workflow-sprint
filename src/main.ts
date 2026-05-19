import './styles.css';
import {
  createInitialState, reduce, GameState, Action,
} from './engine';
import { renderAll, RenderRefs } from './render';
import { attachKeyboard, attachTouch } from './input';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

function boot() {
  const refs: RenderRefs = {
    board:     byId<HTMLCanvasElement>('board'),
    hold:      byId<HTMLCanvasElement>('hold'),
    queue:     byId<HTMLCanvasElement>('queue'),
    score:     byId<HTMLElement>('score'),
    level:     byId<HTMLElement>('level'),
    lines:     byId<HTMLElement>('lines'),
    overlay:   byId<HTMLElement>('overlay'),
    pauseBtn:  byId<HTMLButtonElement>('pauseBtn'),
  };
  const restartBtn = byId<HTMLButtonElement>('restartBtn');

  let state: GameState = createInitialState();

  const dispatch = (a: Action) => {
    state = reduce(state, a);
    renderAll(refs, state);
  };

  const startIfIdle = (): boolean => {
    if (state.status === 'idle' || state.status === 'over') {
      dispatch({ type: 'START' });
      return true;
    }
    return false;
  };

  // Wire HUD buttons
  refs.pauseBtn.addEventListener('click', () => {
    if (state.status === 'idle' || state.status === 'over') {
      dispatch({ type: 'START' });
    } else {
      dispatch({ type: 'PAUSE' });
    }
  });
  restartBtn.addEventListener('click', () => dispatch({ type: 'RESTART' }));

  // Tap on overlay starts the game on touch devices.
  refs.overlay.addEventListener('click', () => startIfIdle());
  refs.overlay.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startIfIdle();
  }, { passive: false });

  attachKeyboard({ rootEl: document.body, dispatch, startIfIdle });
  attachTouch({ rootEl: document.body, dispatch, startIfIdle });

  // Resize redraws
  window.addEventListener('resize', () => renderAll(refs, state));

  // Initial paint (board is the first thing the user sees)
  renderAll(refs, state);

  // Game loop
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(100, now - last);
    last = now;
    state = reduce(state, { type: 'TICK', dt });
    renderAll(refs, state);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
