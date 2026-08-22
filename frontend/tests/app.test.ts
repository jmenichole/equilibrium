/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { beforeEach, expect, test, vi } from 'vitest';
import type { BookEvent } from '../src/rgs/types';
import type { RgsApi } from '../src/rgs/client';
import { formatRgsAmount } from '../src/rgs/display';
import { EquilibriumEngineApp } from '../src/game/app';

const BET_LEVELS = [
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
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

test('play replays pebble win and shows formatted hint and win', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  (document.getElementById('btn-play') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    expect(document.getElementById('hint')?.textContent).toContain('1.04');
  });

  const winAmount = formatRgsAmount(1_040_000);
  expect(document.getElementById('win')?.textContent).toContain(winAmount);
  expect(rgs.endRound).toHaveBeenCalledOnce();
});

test('disclaimer mentions Remote Game Server and omits cash out controls', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  expect(document.getElementById('disclaimer')?.textContent).toContain(
    'Remote Game Server',
  );
  expect(document.getElementById('btn-cashout')).toBeNull();
  expect(document.body.textContent).not.toMatch(/Cash out/i);
  expect(document.body.textContent).not.toMatch(/survive/i);
  expect(document.body.textContent).not.toContain(' / 15');
});

test('spacebar triggers play when enabled', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  document.dispatchEvent(
    new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true }),
  );
  await vi.waitFor(() => {
    expect(rgs.play).toHaveBeenCalledOnce();
  });
});

test('info panel lists rules, RTP, and max win', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  (document.getElementById('btn-info') as HTMLButtonElement).click();
  const panel = document.getElementById('info-panel');
  expect(panel?.textContent).toContain('96.5%');
  expect(panel?.textContent).toContain('15.05');
  expect(panel?.textContent).toMatch(/visual/i);
  expect(panel?.textContent).toMatch(/falls/i);
  expect(document.getElementById('disclaimer')?.textContent).toMatch(/Stake Engine/i);
});

test('does not call endRound when play returns an already-closed round', async () => {
  const rgs = createFakeRgs();
  rgs.play = vi.fn(async () => ({
    balance: { amount: 999_000_000 },
    round: {
      active: false,
      state: PEBBLE_WIN_EVENTS,
      payoutMultiplier: 104,
    },
  }));
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  (document.getElementById('btn-play') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    expect(document.getElementById('hint')?.textContent).toContain('1.04');
  });

  expect(rgs.endRound).not.toHaveBeenCalled();
  expect(document.getElementById('error')?.textContent).toBe('');
});

test('play retries after a stuck active-round error', async () => {
  const rgs = createFakeRgs();
  rgs.play = vi
    .fn()
    .mockRejectedValueOnce(
      new Error('A round is already active, please call EndRound() before starting a new round'),
    )
    .mockResolvedValueOnce({
      balance: { amount: 999_000_000 },
      round: {
        active: true,
        state: PEBBLE_WIN_EVENTS,
        payoutMultiplier: 104,
      },
    });

  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  (document.getElementById('btn-play') as HTMLButtonElement).click();
  await vi.waitFor(() => {
    expect(rgs.play).toHaveBeenCalledTimes(2);
    expect(document.getElementById('hint')?.textContent).toContain('1.04');
  });

  expect(rgs.endRound).toHaveBeenCalled();
  expect(document.getElementById('error')?.textContent).toBe('');
});

test('sound button toggles muted state', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  const btn = document.getElementById('btn-sound') as HTMLButtonElement;
  expect(btn.getAttribute('aria-pressed')).toBe('false');
  btn.click();
  expect(btn.getAttribute('aria-pressed')).toBe('true');
  expect(btn.classList.contains('muted')).toBe(true);
});
