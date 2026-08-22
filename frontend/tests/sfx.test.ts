/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test, vi } from 'vitest';
import { createSfx } from '../src/game/sfx';

function fakeCtx() {
  const osc = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 }, type: 'sine' };
  const gain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
  return {
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
    destination: {},
    currentTime: 0,
    osc,
    gain,
  };
}

test('play starts an oscillator when not muted', () => {
  const ctx = fakeCtx();
  const sfx = createSfx(ctx);
  sfx.play('land');
  expect(ctx.createOscillator).toHaveBeenCalledOnce();
  expect(ctx.osc.start).toHaveBeenCalledOnce();
});

test('muted play does not start an oscillator', () => {
  const ctx = fakeCtx();
  const sfx = createSfx(ctx);
  sfx.muted = true;
  sfx.play('tumble');
  sfx.play('win');
  expect(ctx.createOscillator).not.toHaveBeenCalled();
});
