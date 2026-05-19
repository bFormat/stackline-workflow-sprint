/**
 * Attach touch / pointer handlers to the on-screen pad buttons.
 *
 * Each `.touch-btn` element carries a data-action attribute matching one
 * of the action keys in input.js. Holding the move/soft-drop buttons
 * triggers auto-repeat on a short interval.
 */
const AUTO_REPEAT_ACTIONS = new Set(['left', 'right', 'softDrop']);
const AUTO_REPEAT_INITIAL_MS = 180;
const AUTO_REPEAT_INTERVAL_MS = 70;

export function attachTouch(root, handlers) {
  const buttons = root.querySelectorAll('[data-action]');
  const cleanups = [];

  buttons.forEach((btn) => {
    const action = btn.dataset.action;
    const fn = handlers[action];
    if (!fn) return;

    let repeatTimer = null;
    let kickoffTimer = null;

    function fire() {
      fn();
    }
    function start(ev) {
      ev.preventDefault();
      fire();
      if (AUTO_REPEAT_ACTIONS.has(action)) {
        kickoffTimer = setTimeout(() => {
          repeatTimer = setInterval(fire, AUTO_REPEAT_INTERVAL_MS);
        }, AUTO_REPEAT_INITIAL_MS);
      }
    }
    function stop() {
      if (kickoffTimer) clearTimeout(kickoffTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      kickoffTimer = null;
      repeatTimer = null;
    }

    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);

    cleanups.push(() => {
      btn.removeEventListener('pointerdown', start);
      btn.removeEventListener('pointerup', stop);
      btn.removeEventListener('pointerleave', stop);
      btn.removeEventListener('pointercancel', stop);
    });
  });

  return () => cleanups.forEach((c) => c());
}
