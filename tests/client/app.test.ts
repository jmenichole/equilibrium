/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { beforeEach, expect, test } from 'vitest';
import { BET_LEVELS } from '../../src/constants';
import { EquilibriumApp } from '../../src/client/app';
import { LocalGameServer } from '../../src/server/localGameServer';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

test('shows PLAY MONEY, cashout disabled at start, no footer', async () => {
  const app = new EquilibriumApp(
    document.getElementById('app')!,
    new LocalGameServer({ rollC: () => 15 }),
  );
  await app.mount();
  expect(document.getElementById('play-money')?.textContent).toMatch(/PLAY MONEY/);
  expect(document.getElementById('footer')).toBeNull();
  expect((document.getElementById('btn-cashout') as HTMLButtonElement).disabled).toBe(
    true,
  );
});

test('after play, bet levels lock and cashout stays disabled until a survivor', async () => {
  const app = new EquilibriumApp(
    document.getElementById('app')!,
    new LocalGameServer({ rollC: () => 15 }),
  );
  await app.mount();
  const betBtn = document.querySelector(`[data-bet="${BET_LEVELS[3]}"]`) as HTMLButtonElement;
  betBtn.click();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  expect((document.getElementById('btn-cashout') as HTMLButtonElement).disabled).toBe(
    true,
  );
  document.querySelectorAll<HTMLButtonElement>('[data-bet]').forEach((btn) => {
    expect(btn.disabled).toBe(true);
  });
});

test('0% heavy is disabled when it cannot fit', async () => {
  const server = new LocalGameServer({ rollC: () => 15 });
  const app = new EquilibriumApp(document.getElementById('app')!, server);
  await app.mount();
  (document.querySelector(`[data-bet="${BET_LEVELS[3]}"]`) as HTMLButtonElement).click();
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 10; i++) {
    const safe = document.getElementById('btn-safe') as HTMLButtonElement;
    if (safe.disabled) break;
    safe.click();
    await new Promise((r) => setTimeout(r, 0));
  }
  expect((document.getElementById('btn-heavy') as HTMLButtonElement).disabled).toBe(
    true,
  );
});

test('safe stack then cash out increases balance', async () => {
  const app = new EquilibriumApp(
    document.getElementById('app')!,
    new LocalGameServer({ rollC: () => 15 }),
  );
  await app.mount();
  const initialBalance = document.getElementById('balance')!.textContent;

  (document.querySelector(`[data-bet="${BET_LEVELS[3]}"]`) as HTMLButtonElement).click();
  await new Promise((r) => setTimeout(r, 0));

  (document.getElementById('btn-safe') as HTMLButtonElement).click();
  await new Promise((r) => setTimeout(r, 0));

  const cashout = document.getElementById('btn-cashout') as HTMLButtonElement;
  expect(cashout.disabled).toBe(false);

  cashout.click();
  await new Promise((r) => setTimeout(r, 0));

  expect(document.getElementById('balance')!.textContent).not.toBe(initialBalance);
  expect((document.getElementById('btn-cashout') as HTMLButtonElement).disabled).toBe(
    true,
  );
});
