// Accessible pause overlay component.
//
// Renders a focusable, ARIA-labeled dialog inside a host element. The visible
// label, focus management, and aria-live region let assistive tech announce
// pause state changes. All naming is generic ("pause", "block", "piece") — no
// proprietary brand references.

import '../../styles/pause-overlay.css';

export interface PauseOverlayHandle {
  /** The root overlay element appended to the host. */
  readonly element: HTMLElement;
  /** Show or hide the overlay; manages aria-hidden + class + focus. */
  setPaused(paused: boolean): void;
  /** True when the overlay is currently shown. */
  isPaused(): boolean;
  /** Remove the overlay from the DOM and unbind any listeners. */
  destroy(): void;
}

export interface PauseOverlayOptions {
  /** Host element that owns the overlay (usually the board wrap). */
  host: HTMLElement;
  /** Optional custom label; defaults to "Game paused". */
  label?: string;
  /** Optional hint text shown below the title. */
  hint?: string;
}

/**
 * Mount a pause overlay inside `host` and return a handle. The overlay is
 * hidden by default. Call `setPaused(true)` to reveal it.
 */
export function mountPauseOverlay(opts: PauseOverlayOptions): PauseOverlayHandle {
  const doc = opts.host.ownerDocument ?? document;
  const titleId = 'pause-overlay-title';
  const hintId = 'pause-overlay-hint';

  const overlay = doc.createElement('div');
  overlay.id = 'pause-overlay';
  overlay.className = 'pause-overlay pause-overlay--hidden';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('aria-labelledby', titleId);
  overlay.setAttribute('aria-describedby', hintId);
  overlay.setAttribute('aria-live', 'assertive');
  overlay.setAttribute('tabindex', '-1');
  overlay.dataset.state = 'resumed';

  const card = doc.createElement('div');
  card.className = 'pause-overlay__card';

  const title = doc.createElement('h2');
  title.id = titleId;
  title.className = 'pause-overlay__title';
  title.textContent = opts.label ?? 'Game paused';

  const hint = doc.createElement('p');
  hint.id = hintId;
  hint.className = 'pause-overlay__hint';
  hint.textContent = opts.hint ?? 'Press P or Esc to resume.';

  card.appendChild(title);
  card.appendChild(hint);
  overlay.appendChild(card);
  opts.host.appendChild(overlay);

  let paused = false;

  const setPaused = (next: boolean) => {
    if (next === paused) return;
    paused = next;
    if (next) {
      overlay.classList.remove('pause-overlay--hidden');
      overlay.setAttribute('aria-hidden', 'false');
      overlay.dataset.state = 'paused';
      // Update the live region text so assistive tech announces the change.
      title.textContent = opts.label ?? 'Game paused';
      try { overlay.focus({ preventScroll: true }); } catch { /* JSDOM may lack focus opts */ }
    } else {
      overlay.classList.add('pause-overlay--hidden');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.dataset.state = 'resumed';
    }
  };

  const destroy = () => {
    overlay.remove();
  };

  return {
    element: overlay,
    setPaused,
    isPaused: () => paused,
    destroy,
  };
}
