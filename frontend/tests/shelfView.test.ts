/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { ShelfView } from '../src/game/shelfView';

test('render one weight-7 piece produces SVG with book rect', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({ pieces: [{ weight: 7 }], phase: 'playing', totalWeight: 7 });

  const svg = host.querySelector('svg');
  expect(svg).not.toBeNull();

  const rect = host.querySelector('rect.book');
  expect(rect).not.toBeNull();
  expect(rect?.getAttribute('height')).toBe('70');
});

test('innerHTML does not expose C or / 15 HUD strings', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({ pieces: [{ weight: 7 }], phase: 'playing', totalWeight: 7 });

  const html = host.innerHTML;
  expect(html).not.toMatch(/\bC\b/);
  expect(html).not.toContain(' / 15');
});

test('book widths grow with weight and last book is marked entering', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({
    pieces: [{ weight: 1 }, { weight: 3 }, { weight: 7 }],
    phase: 'playing',
    totalWeight: 11,
  });

  const books = [...host.querySelectorAll('rect.book')];
  expect(books).toHaveLength(3);
  expect(Number(books[0].getAttribute('width'))).toBeLessThan(
    Number(books[1].getAttribute('width')),
  );
  expect(Number(books[1].getAttribute('width'))).toBeLessThan(
    Number(books[2].getAttribute('width')),
  );
  expect(books[2].classList.contains('book-enter')).toBe(true);
  expect(books[0].classList.contains('book-enter')).toBe(false);
});

test('bust and win phases add state classes', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);

  view.render({ pieces: [], phase: 'bust', totalWeight: 12 });
  expect(host.querySelector('svg')?.classList.contains('is-bust')).toBe(true);

  view.render({ pieces: [{ weight: 1 }], phase: 'win', totalWeight: 1 });
  expect(host.querySelector('svg')?.classList.contains('is-win')).toBe(true);
});

test('books stack upward as a pile not a row', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({
    pieces: [{ weight: 1 }, { weight: 3 }],
    phase: 'playing',
    totalWeight: 4,
  });
  const books = [...host.querySelectorAll('rect.book')];
  const y0 = Number(books[0].getAttribute('y'));
  const y1 = Number(books[1].getAttribute('y'));
  expect(y1).toBeLessThan(y0);
});

test('bust does not rotate the shelf board', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({ pieces: [{ weight: 7 }], phase: 'bust', totalWeight: 7 });
  expect(host.querySelector('svg')?.classList.contains('is-bust')).toBe(true);
  expect(host.querySelector('.shelf-tilt')).toBeNull();
  expect(host.innerHTML).not.toMatch(/\bC\b/);
  expect(host.innerHTML).not.toContain(' / 15');
});
