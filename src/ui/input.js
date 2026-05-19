/**
 * Keyboard bindings for Stackline.
 *
 * Exposed as a top-level constant so users / forks can rebind without
 * digging into the event handler. Each binding is an array of accepted
 * KeyboardEvent.code values; the first match wins.
 */
export const KEY_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  softDrop: ['ArrowDown', 'KeyS'],
  hardDrop: ['Space'],
  rotateCw: ['ArrowUp', 'KeyX', 'KeyW'],
  rotateCcw: ['KeyZ', 'ControlLeft', 'ControlRight'],
  hold: ['KeyC', 'ShiftLeft', 'ShiftRight'],
  pause: ['Escape', 'KeyP'],
  restart: ['KeyR'],
};

export function actionForKey(code) {
  for (const [action, codes] of Object.entries(KEY_BINDINGS)) {
    if (codes.includes(code)) return action;
  }
  return null;
}

export function attachKeyboard(handlers) {
  function onKeyDown(ev) {
    const action = actionForKey(ev.code);
    if (!action) return;
    const fn = handlers[action];
    if (fn) {
      ev.preventDefault();
      fn();
    }
  }
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
