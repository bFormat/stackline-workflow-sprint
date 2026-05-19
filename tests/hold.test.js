import { describe, it, expect } from 'vitest';
import { canHold, createHoldState, performHold, resetHoldLock } from '../src/game/hold.js';

describe('hold slot rules', () => {
  it('starts empty and allows the first hold action', () => {
    const state = createHoldState();
    expect(state.held).toBeNull();
    expect(canHold(state)).toBe(true);
  });

  it('fills the empty slot and draws the next piece from the queue', () => {
    const state = createHoldState();
    const queue = ['ZAG', 'BAR'];
    const drawNext = () => queue.shift();
    const result = performHold(state, 'HOOK', drawNext);
    expect(result.state.held).toBe('HOOK');
    expect(result.state.usedThisPiece).toBe(true);
    expect(result.activeId).toBe('ZAG');
  });

  it('swaps the active and held piece when the slot is already occupied', () => {
    const state = { held: 'CROWN', usedThisPiece: false };
    const result = performHold(state, 'WAVE', () => {
      throw new Error('drawNext should not be called when slot is full');
    });
    expect(result.state.held).toBe('WAVE');
    expect(result.activeId).toBe('CROWN');
  });

  it('rejects a second hold attempt before the current piece has locked', () => {
    let state = createHoldState();
    const drawNext = () => 'BAR';
    state = performHold(state, 'HOOK', drawNext).state;
    expect(canHold(state)).toBe(false);
    expect(() => performHold(state, 'BAR', drawNext)).toThrow();
  });

  it('re-enables hold for the next piece once the lock is reset', () => {
    let state = createHoldState();
    state = performHold(state, 'HOOK', () => 'BAR').state;
    state = resetHoldLock(state);
    expect(canHold(state)).toBe(true);
    expect(state.held).toBe('HOOK');
  });
});
