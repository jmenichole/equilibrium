/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import type { BookEvent } from '../rgs/types';

export type ShelfPhase = 'idle' | 'playing' | 'bust' | 'win';

export type ShelfRenderInput = {
  pieces: { weight: number }[];
  phase: ShelfPhase;
  totalWeight: number;
};

const CHARCOAL = '#1c1814';
const GOLD = '#c8a84e';
const SHELF_WOOD = '#3d3428';
const BOOK_SPINE = '#2a231c';
const BOOK_PAGE = '#e8dcc8';

function bookHeight(weight: number): number {
  return Math.max(14, weight * 10);
}

function shelfSagDegrees(totalWeight: number): number {
  const idle = 0.3 * Math.sin(performance.now() / 1000);
  return (totalWeight / 15) * 6 + idle;
}

function bookRects(pieces: { weight: number }[]): string {
  const gap = 4;
  let x = 24;
  const baseY = 72;
  const rects: string[] = [];

  for (const piece of pieces) {
    const h = bookHeight(piece.weight);
    const y = baseY - h;
    rects.push(
      `<rect class="book" x="${x}" y="${y}" width="18" height="${h}" rx="2" fill="${BOOK_SPINE}" stroke="${GOLD}" stroke-width="1"/>`,
      `<rect x="${x + 3}" y="${y + 2}" width="3" height="${h - 4}" fill="${BOOK_PAGE}" opacity="0.85"/>`,
    );
    x += 18 + gap;
  }

  return rects.join('');
}

export class ShelfView {
  private readonly host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  render(input: ShelfRenderInput): void {
    const { pieces, phase, totalWeight } = input;
    const sag = shelfSagDegrees(totalWeight);
    const phaseClass = phase === 'bust' ? ' is-bust' : phase === 'win' ? ' is-win' : '';

    this.host.innerHTML = `<svg class="equilibrium-shelf${phaseClass}" viewBox="0 0 320 96" width="100%" role="img" aria-label="Bookshelf" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="96" fill="${CHARCOAL}" rx="6"/>
  <g class="shelf-tilt" transform="rotate(${sag} 160 72)">
    <rect class="shelf-board" x="16" y="68" width="288" height="8" rx="2" fill="${SHELF_WOOD}" stroke="${GOLD}" stroke-width="1"/>
    <g class="books">${bookRects(pieces)}</g>
  </g>
</svg>`;
  }
}
