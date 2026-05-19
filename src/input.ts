import { Action } from './engine';

export type Dispatch = (a: Action) => void;

export interface InputOptions {
  rootEl: HTMLElement;
  dispatch: Dispatch;
  startIfIdle: () => boolean; // returns true if start was triggered
}

const KEY_MAP: Record<string, Action | undefined> = {
  'ArrowLeft':  { type: 'MOVE', dx: -1 },
  'ArrowRight': { type: 'MOVE', dx: 1 },
  'ArrowDown':  { type: 'SOFT_DROP' },
  'ArrowUp':    { type: 'ROTATE' },
  'KeyX':       { type: 'ROTATE' },
  'KeyZ':       { type: 'ROTATE' },
  'Space':      { type: 'HARD_DROP' },
  'KeyC':       { type: 'HOLD' },
  'ShiftLeft':  { type: 'HOLD' },
  'ShiftRight': { type: 'HOLD' },
  'KeyP':       { type: 'PAUSE' },
  'Escape':     { type: 'PAUSE' },
};

export function actionForKey(code: string): Action | undefined {
  return KEY_MAP[code];
}

export function attachKeyboard(opts: InputOptions): () => void {
  const onKey = (e: KeyboardEvent) => {
    // Repeated keydown for movement / soft drop is OK; we still get events.
    const triggered = opts.startIfIdle();
    if (triggered && e.code !== 'KeyP') return; // start counts as "any key"

    const action = actionForKey(e.code);
    if (action) {
      e.preventDefault();
      opts.dispatch(action);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

export function attachTouch(opts: InputOptions): () => void {
  const buttons = opts.rootEl.querySelectorAll<HTMLButtonElement>('[data-action]');
  const handlers: Array<[HTMLButtonElement, EventListener]> = [];
  buttons.forEach(btn => {
    const action = btn.dataset.action;
    const handler = (ev: Event) => {
      ev.preventDefault();
      const started = opts.startIfIdle();
      if (started) return;
      switch (action) {
        case 'left':   opts.dispatch({ type: 'MOVE', dx: -1 }); break;
        case 'right':  opts.dispatch({ type: 'MOVE', dx: 1 }); break;
        case 'rotate': opts.dispatch({ type: 'ROTATE' }); break;
        case 'soft':   opts.dispatch({ type: 'SOFT_DROP' }); break;
        case 'hard':   opts.dispatch({ type: 'HARD_DROP' }); break;
        case 'hold':   opts.dispatch({ type: 'HOLD' }); break;
      }
    };
    btn.addEventListener('click', handler);
    handlers.push([btn, handler]);
  });
  // Tap-anywhere-on-overlay to start.
  return () => {
    handlers.forEach(([btn, h]) => btn.removeEventListener('click', h));
  };
}
