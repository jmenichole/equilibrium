/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { pickBook, scaleBookForBet } from '../src/rgs/books';

test('scales unit-bet win amounts', () => {
  const events = scaleBookForBet(
    [
      { index: 0, type: 'stack', weight: 1, totalWeight: 1, payoutMultiplier: 104 },
      { index: 1, type: 'setTotalWin', amount: 1_040_000 },
      { index: 2, type: 'finalWin', amount: 1_040_000 },
    ],
    2_000_000,
  );
  expect(events[1]).toMatchObject({ type: 'setTotalWin', amount: 2_080_000 });
  expect(events[2]).toMatchObject({ type: 'finalWin', amount: 2_080_000 });
  expect(events[0]).toMatchObject({ type: 'stack', payoutMultiplier: 104 });
});

test('pickBook respects weights', () => {
  const books = [
    { id: 1, payoutMultiplier: 104, events: [] },
    { id: 2, payoutMultiplier: 0, events: [] },
  ];
  expect(pickBook(books, [1, 0], () => 0)).toEqual(books[0]);
  expect(pickBook(books, [1, 0], () => 0.99)).toEqual(books[0]);
  expect(pickBook(books, [0, 1], () => 0)).toEqual(books[1]);
});
