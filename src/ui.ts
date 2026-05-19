/**
 * Light-weight UI controller.
 *
 * Wires up the HUD numbers and the overlay panels (start, pause, game
 * over, help). Pure DOM — no framework.
 */

import type { Game } from './game.js';

export type OverlayId = 'start' | 'pause' | 'gameover' | 'help' | null;

export interface UIElements {
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
  overlayStart: HTMLElement;
  overlayPause: HTMLElement;
  overlayGameOver: HTMLElement;
  overlayHelp: HTMLElement;
}

export class UI {
  constructor(private readonly el: UIElements) {}

  updateHud(game: Game): void {
    this.el.score.textContent = String(game.score.score);
    this.el.level.textContent = String(game.score.level);
    this.el.lines.textContent = String(game.score.lines);
  }

  showOverlay(id: OverlayId): void {
    const map: Record<Exclude<OverlayId, null>, HTMLElement> = {
      start: this.el.overlayStart,
      pause: this.el.overlayPause,
      gameover: this.el.overlayGameOver,
      help: this.el.overlayHelp,
    };
    for (const node of Object.values(map)) node.classList.remove('visible');
    if (id) map[id].classList.add('visible');
  }

  reflectPhase(game: Game, helpOpen: boolean): void {
    if (helpOpen) {
      this.showOverlay('help');
      return;
    }
    switch (game.phase) {
      case 'ready':
        this.showOverlay('start');
        break;
      case 'paused':
        this.showOverlay('pause');
        break;
      case 'gameover':
        this.showOverlay('gameover');
        break;
      case 'playing':
      default:
        this.showOverlay(null);
        break;
    }
  }
}
