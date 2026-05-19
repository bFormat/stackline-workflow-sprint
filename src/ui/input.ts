import type { Engine } from '../game/engine';

export interface InputBindings {
  detach(): void;
}

export type Action =
  | 'left'
  | 'right'
  | 'rotateCW'
  | 'rotateCCW'
  | 'softDrop'
  | 'hardDrop'
  | 'hold'
  | 'pause'
  | 'restart';

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'softDrop',
  ArrowUp: 'rotateCW',
  KeyA: 'left',
  KeyD: 'right',
  KeyS: 'softDrop',
  KeyW: 'rotateCW',
  KeyZ: 'rotateCCW',
  KeyX: 'rotateCW',
  KeyC: 'hold',
  ShiftLeft: 'hold',
  ShiftRight: 'hold',
  Space: 'hardDrop',
  KeyP: 'pause',
  Escape: 'pause',
  KeyR: 'restart',
};

export function dispatch(engine: Engine, action: Action): void {
  switch (action) {
    case 'left':
      engine.move(-1);
      break;
    case 'right':
      engine.move(1);
      break;
    case 'softDrop':
      engine.softDrop();
      break;
    case 'rotateCW':
      engine.rotate('cw');
      break;
    case 'rotateCCW':
      engine.rotate('ccw');
      break;
    case 'hardDrop':
      engine.hardDrop();
      break;
    case 'hold':
      engine.holdSwap();
      break;
    case 'pause':
      engine.togglePause();
      break;
    case 'restart':
      engine.restart();
      break;
  }
}

export function bindKeyboard(engine: Engine): InputBindings {
  // Repeat handling for autorepeat-friendly actions.
  const repeatable: Action[] = ['left', 'right', 'softDrop'];
  const heldRepeats = new Map<Action, number>();

  const onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_MAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (event.repeat) {
      if (repeatable.includes(action)) {
        dispatch(engine, action);
      }
      return;
    }
    dispatch(engine, action);
    if (repeatable.includes(action)) {
      const handle = window.setInterval(() => dispatch(engine, action), 70);
      heldRepeats.set(action, handle);
    }
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    const action = KEY_MAP[event.code];
    if (!action) return;
    const handle = heldRepeats.get(action);
    if (handle !== undefined) {
      window.clearInterval(handle);
      heldRepeats.delete(action);
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    detach() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      heldRepeats.forEach((handle) => window.clearInterval(handle));
      heldRepeats.clear();
    },
  };
}

export function bindTouchButtons(
  root: HTMLElement,
  engine: Engine,
): InputBindings {
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('button[data-action]'),
  );
  const cleanups: Array<() => void> = [];
  for (const btn of buttons) {
    const action = btn.dataset.action as Action | undefined;
    if (!action) continue;
    const onPress = (event: Event): void => {
      event.preventDefault();
      dispatch(engine, action);
    };
    btn.addEventListener('click', onPress);
    btn.addEventListener('touchstart', onPress, { passive: false });
    cleanups.push(() => {
      btn.removeEventListener('click', onPress);
      btn.removeEventListener('touchstart', onPress);
    });
  }
  return {
    detach() {
      cleanups.forEach((fn) => fn());
    },
  };
}
