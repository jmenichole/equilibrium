/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { beforeEach, expect, test, vi } from 'vitest';
import type { BookEvent } from '../src/rgs/types';
import type { RgsApi } from '../src/rgs/client';
import { EquilibriumEngineApp } from '../src/game/app';

const BET_LEVELS = [
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
];

const BUST_EVENTS: BookEvent[] = [
  { index: 0, type: 'stack', weight: 7, totalWeight: 7, payoutMultiplier: 120 },
  { index: 1, type: 'bust' },
];

const PEBBLE_WIN_EVENTS: BookEvent[] = [
  { index: 0, type: 'stack', weight: 1, totalWeight: 1, payoutMultiplier: 104 },
  { index: 1, type: 'setTotalWin', amount: 1_040_000 },
  { index: 2, type: 'finalWin', amount: 1_040_000 },
];

function createFakeRgs(): RgsApi & { play: ReturnType<typeof vi.fn> } {
  const play = vi.fn(async () => ({
    balance: { amount: 1_000_000_000 },
    round: {
      active: true,
      state: PEBBLE_WIN_EVENTS,
      payoutMultiplier: 104,
    },
  }));

  return {
    authenticate: vi.fn(async () => ({
      balance: { amount: 1_000_000_000, currency: 'USD' },
      config: {
        betLevels: BET_LEVELS,
        minBet: 100_000,
        maxBet: 10_000_000,
        stepBet: 100_000,
      },
      round: null,
    })),
    play,
    endRound: vi.fn(async () => ({ balance: { amount: 1_000_039_000 } })),
  };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  localStorage.clear();
});

test('mount resumes active round with bust UI and calls endRound once', async () => {
  const rgs = {
    authenticate: vi.fn(async () => ({
      balance: { amount: 999_000_000, currency: 'USD' },
      config: {
        betLevels: BET_LEVELS,
        minBet: 100_000,
        maxBet: 10_000_000,
        stepBet: 100_000,
      },
      round: { active: true, state: BUST_EVENTS },
    })),
    play: vi.fn(),
    endRound: vi.fn(async () => ({ balance: { amount: 999_000_000 } })),
  };

  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  expect(rgs.play).not.toHaveBeenCalled();
  expect(rgs.endRound).toHaveBeenCalledOnce();
  expect(document.getElementById('hint')?.textContent).toBe('×0.00');
  expect(
    document.querySelector('.equilibrium-shelf')?.classList.contains('is-bust'),
  ).toBe(true);
});

test('replay last re-runs book events without calling play again', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  const replayBtn = document.getElementById('btn-replay') as HTMLButtonElement;
  expect(replayBtn.disabled).toBe(true);

  (document.getElementById('btn-play') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    expect(rgs.play).toHaveBeenCalledOnce();
    expect(replayBtn.disabled).toBe(false);
  });
  replayBtn.click();
  await vi.waitFor(() => {
    expect(document.getElementById('hint')?.textContent).toContain('1.04');
  });

  expect(rgs.play).toHaveBeenCalledOnce();
  expect(document.querySelector('rect.book')).not.toBeNull();
});
