import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clearLines,
  createBoard,
  isPlacementValid,
  lockPiece,
  projectedDrop,
} from './board.js';
import { spawnPosition } from './pieces.js';
import { createBagRandomizer } from './randomizer.js';
import { tryRotate } from './rotation.js';
import { hardDropScore, lineClearScore, softDropScore } from './scoring.js';
import { gravityDelayMs, levelForLines } from './gravity.js';
import { canHold, createHoldState, performHold, resetHoldLock } from './hold.js';

/**
 * Build a fresh engine state. The engine is intentionally a plain object
 * graph manipulated by pure-ish helpers so it can be driven from tests.
 */
export function createEngine({ rng = Math.random } = {}) {
  const randomizer = createBagRandomizer(rng);
  const state = {
    board: createBoard(BOARD_WIDTH, BOARD_HEIGHT),
    active: null,
    hold: createHoldState(),
    randomizer,
    score: 0,
    lines: 0,
    level: 1,
    gravityMs: gravityDelayMs(1),
    isOver: false,
    isPaused: false,
    msSinceDrop: 0,
  };
  spawnNext(state);
  return state;
}

function spawnNext(state) {
  const id = state.randomizer.next();
  const piece = spawnPosition(id, BOARD_WIDTH);
  if (!isPlacementValid(state.board, piece)) {
    state.isOver = true;
    state.active = piece;
    return;
  }
  state.active = piece;
}

export function moveActive(state, dx, dy) {
  if (!state.active || state.isOver) return false;
  const candidate = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (!isPlacementValid(state.board, candidate)) return false;
  state.active = candidate;
  return true;
}

export function rotateActive(state, dir) {
  if (!state.active || state.isOver) return false;
  const next = tryRotate(state.board, state.active, dir);
  if (!next) return false;
  state.active = next;
  return true;
}

export function softDrop(state) {
  if (!state.active || state.isOver) return 0;
  if (moveActive(state, 0, 1)) {
    state.score += softDropScore(1);
    return 1;
  }
  // Cannot fall any further -> lock.
  lockAndAdvance(state);
  return 0;
}

export function hardDrop(state) {
  if (!state.active || state.isOver) return 0;
  const distance = projectedDrop(state.board, state.active);
  state.active = { ...state.active, y: state.active.y + distance };
  state.score += hardDropScore(distance);
  lockAndAdvance(state);
  return distance;
}

export function holdActive(state) {
  if (!state.active || state.isOver) return false;
  if (!canHold(state.hold)) return false;
  const { state: nextHold, activeId } = performHold(
    state.hold,
    state.active.id,
    () => state.randomizer.next(),
  );
  state.hold = nextHold;
  const piece = spawnPosition(activeId, BOARD_WIDTH);
  if (!isPlacementValid(state.board, piece)) {
    state.isOver = true;
  }
  state.active = piece;
  return true;
}

export function tick(state, deltaMs) {
  if (state.isOver || state.isPaused || !state.active) return;
  state.msSinceDrop += deltaMs;
  while (state.msSinceDrop >= state.gravityMs) {
    state.msSinceDrop -= state.gravityMs;
    if (!moveActive(state, 0, 1)) {
      lockAndAdvance(state);
      if (state.isOver) return;
    }
  }
}

function lockAndAdvance(state) {
  state.board = lockPiece(state.board, state.active);
  const { board: clearedBoard, cleared } = clearLines(state.board);
  state.board = clearedBoard;
  if (cleared > 0) {
    state.score += lineClearScore(cleared, state.level);
    state.lines += cleared;
    state.level = levelForLines(state.lines);
    state.gravityMs = gravityDelayMs(state.level);
  }
  state.hold = resetHoldLock(state.hold);
  state.msSinceDrop = 0;
  spawnNext(state);
}

export function togglePause(state) {
  if (state.isOver) return;
  state.isPaused = !state.isPaused;
}

export function ghostPosition(state) {
  if (!state.active) return null;
  const delta = projectedDrop(state.board, state.active);
  return { ...state.active, y: state.active.y + delta };
}
