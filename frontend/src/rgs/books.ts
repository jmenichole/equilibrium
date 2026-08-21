/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import type { BookEvent } from './types';

const UNIT_BET = 1_000_000;

export type Book = {
  id: number;
  payoutMultiplier: number;
  events: BookEvent[];
};

export function scaleBookForBet(
  book: BookEvent[],
  betAmount: number,
): BookEvent[] {
  return book.map((event) => {
    if (event.type === 'setTotalWin' || event.type === 'finalWin') {
      return {
        ...event,
        amount: Math.floor((event.amount * betAmount) / UNIT_BET),
      };
    }
    return event;
  });
}

export function pickBook(
  books: Book[],
  weights: number[],
  rng: () => number = Math.random,
): Book {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * total;
  for (let i = 0; i < books.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll < 0) {
      return books[i];
    }
  }
  return books[books.length - 1]!;
}
