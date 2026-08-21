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

test('bust and win phases add state classes', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);

  view.render({ pieces: [], phase: 'bust', totalWeight: 12 });
  expect(host.querySelector('svg')?.classList.contains('is-bust')).toBe(true);

  view.render({ pieces: [{ weight: 1 }], phase: 'win', totalWeight: 1 });
  expect(host.querySelector('svg')?.classList.contains('is-win')).toBe(true);
});
