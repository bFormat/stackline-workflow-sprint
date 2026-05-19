/**
 * Hold-slot rules.
 *
 * The player may stash the active piece into a hold slot. If the slot is
 * empty, the slot fills and the next queue piece is drawn. If the slot has
 * a held piece, the active and held pieces swap. The hold action is
 * permitted at most once per active piece — repeated holds before the
 * piece locks are rejected.
 */
export function createHoldState() {
  return { held: null, usedThisPiece: false };
}

export function canHold(state) {
  return state.usedThisPiece === false;
}

/**
 * Pure swap: given a current hold state, the active piece id, and a
 * function that draws a fresh piece id from the queue, return the new
 * state plus the id of the piece that should now be active.
 *
 * Throws if hold has already been used for this piece. Caller should
 * check `canHold(state)` first.
 */
export function performHold(state, activeId, drawNext) {
  if (!canHold(state)) {
    throw new Error('hold already used for the current piece');
  }
  if (state.held === null) {
    const incoming = drawNext();
    return {
      state: { held: activeId, usedThisPiece: true },
      activeId: incoming,
    };
  }
  return {
    state: { held: activeId, usedThisPiece: true },
    activeId: state.held,
  };
}

/** Called by the engine after the active piece locks. */
export function resetHoldLock(state) {
  return { ...state, usedThisPiece: false };
}
