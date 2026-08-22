/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import type { BookEvent } from '../src/rgs/types';
import { playBookEvents } from '../src/game/replay';
import { ShelfView } from '../src/game/shelfView';

test('playBookEvents invokes handlers in event order', async () => {
  const events: BookEvent[] = [
    { index: 0, type: 'stack', weight: 1, totalWeight: 1, payoutMultiplier: 104 },
    { index: 1, type: 'setTotalWin', amount: 1_040_000 },
    { index: 2, type: 'finalWin', amount: 1_040_000 },
  ];
  const order: string[] = [];

  await playBookEvents(events, {
    stack: () => {
      order.push('stack');
    },
    bust: () => {
      order.push('bust');
    },
    setTotalWin: () => {
      order.push('setTotalWin');
    },
    finalWin: () => {
      order.push('finalWin');
    },
  });

  expect(order).toEqual(['stack', 'setTotalWin', 'finalWin']);
});

test('bust book with finalWin keeps is-bust on shelf', async () => {
  const bustBook: BookEvent[] = [
    { index: 0, type: 'bust' },
    { index: 1, type: 'setTotalWin', amount: 0 },
    { index: 2, type: 'finalWin', amount: 0 },
  ];
  const order: string[] = [];
  let phase: 'idle' | 'playing' | 'bust' | 'win' = 'playing';

  await playBookEvents(bustBook, {
    stack: () => {
      order.push('stack');
    },
    bust: () => {
      phase = 'bust';
      order.push('bust');
    },
    setTotalWin: () => {
      order.push('setTotalWin');
    },
    finalWin: () => {
      if (phase !== 'bust') phase = 'win';
      order.push('finalWin');
    },
  });

  expect(order).toEqual(['bust', 'setTotalWin', 'finalWin']);
  expect(phase).toBe('bust');

  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({ pieces: [], phase: 'bust', totalWeight: 0 });
  expect(host.querySelector('svg')?.classList.contains('is-bust')).toBe(true);
  expect(host.querySelector('svg')?.classList.contains('is-win')).toBe(false);
});

test('playBookEvents defaults delayMs to 0 for instant tests', async () => {
  const events: BookEvent[] = [
    { index: 0, type: 'stack', weight: 3, totalWeight: 3, payoutMultiplier: 110 },
    { index: 1, type: 'stack', weight: 7, totalWeight: 10, payoutMultiplier: 150 },
  ];
  const start = performance.now();

  await playBookEvents(events, {
    stack: () => {},
    bust: () => {},
    setTotalWin: () => {},
    finalWin: () => {},
  });

  expect(performance.now() - start).toBeLessThan(50);
});

test('playBookEvents holds after bust so the shelf can fall', async () => {
  const events: BookEvent[] = [{ index: 0, type: 'bust' }];
  const start = performance.now();

  await playBookEvents(
    events,
    {
      stack: () => {},
      bust: () => {},
      setTotalWin: () => {},
      finalWin: () => {},
    },
    20,
  );

  expect(performance.now() - start).toBeGreaterThanOrEqual(40);
});
