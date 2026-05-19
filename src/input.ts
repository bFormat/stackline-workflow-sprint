/**
 * Input — keyboard and touch handling.
 *
 * Exposes a small action API: callers register a handler and we translate
 * raw events into action names. Touch buttons and playfield swipes are
 * supported in addition to the keyboard.
 */

export type Action =
  | 'left'
  | 'right'
  | 'soft'
  | 'hard'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold'
  | 'pause'
  | 'restart';

export type ActionHandler = (action: Action) => void;

export interface InputOptions {
  target: HTMLElement | Window;
  touchSurface?: HTMLElement | null;
  touchButtons?: HTMLElement | null;
}

interface KeyMap {
  [key: string]: Action | undefined;
}

const KEYS: KeyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowDown: 'soft',
  ArrowUp: 'rotateCW',
  ' ': 'hard',
  Spacebar: 'hard',
  Space: 'hard',
  x: 'rotateCW',
  X: 'rotateCW',
  z: 'rotateCCW',
  Z: 'rotateCCW',
  Shift: 'hold',
  c: 'hold',
  C: 'hold',
  p: 'pause',
  P: 'pause',
  Escape: 'pause',
  r: 'restart',
  R: 'restart',
};

export class InputController {
  private handler: ActionHandler | null = null;
  private readonly opts: InputOptions;
  private readonly listeners: Array<() => void> = [];

  constructor(opts: InputOptions) {
    this.opts = opts;
  }

  onAction(h: ActionHandler): void {
    this.handler = h;
  }

  start(): void {
    this.attachKeyboard();
    if (this.opts.touchButtons) this.attachButtons(this.opts.touchButtons);
    if (this.opts.touchSurface) this.attachSwipe(this.opts.touchSurface);
  }

  stop(): void {
    for (const off of this.listeners) off();
    this.listeners.length = 0;
  }

  private fire(action: Action): void {
    this.handler?.(action);
  }

  private attachKeyboard(): void {
    const t = this.opts.target as Window;
    const onKey = (e: Event): void => {
      const ke = e as KeyboardEvent;
      const action = KEYS[ke.key];
      if (!action) return;
      // Avoid scrolling on arrow keys / space.
      if (ke.key === ' ' || ke.key.startsWith('Arrow')) ke.preventDefault();
      this.fire(action);
    };
    t.addEventListener('keydown', onKey as EventListener);
    this.listeners.push(() => t.removeEventListener('keydown', onKey as EventListener));
  }

  private attachButtons(root: HTMLElement): void {
    const onClick = (e: Event): void => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('[data-action]') as HTMLElement | null;
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      switch (action) {
        case 'left':
          this.fire('left');
          break;
        case 'right':
          this.fire('right');
          break;
        case 'soft':
          this.fire('soft');
          break;
        case 'hard':
          this.fire('hard');
          break;
        case 'rotate':
          this.fire('rotateCW');
          break;
        case 'hold':
          this.fire('hold');
          break;
      }
    };
    root.addEventListener('click', onClick);
    this.listeners.push(() => root.removeEventListener('click', onClick));
  }

  private attachSwipe(surface: HTMLElement): void {
    let startX = 0;
    let startY = 0;
    let startT = 0;
    const TH = 24;
    const FAST = 240; // px / s threshold to count as hard drop.

    const onStart = (e: TouchEvent): void => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = e.timeStamp;
    };
    const onEnd = (e: TouchEvent): void => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Math.max(1, e.timeStamp - startT);
      if (Math.abs(dx) < TH && Math.abs(dy) < TH) {
        this.fire('rotateCW');
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        this.fire(dx > 0 ? 'right' : 'left');
      } else if (dy > 0) {
        const v = (dy / dt) * 1000;
        this.fire(v > FAST ? 'hard' : 'soft');
      } else {
        this.fire('rotateCW');
      }
    };
    surface.addEventListener('touchstart', onStart, { passive: true });
    surface.addEventListener('touchend', onEnd, { passive: true });
    this.listeners.push(() => surface.removeEventListener('touchstart', onStart));
    this.listeners.push(() => surface.removeEventListener('touchend', onEnd));
  }
}
