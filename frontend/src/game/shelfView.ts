/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
export type ShelfPhase = 'idle' | 'playing' | 'bust' | 'win';

export type ShelfRenderInput = {
  pieces: { weight: number }[];
  phase: ShelfPhase;
  totalWeight: number;
};

const CHARCOAL = '#1c1814';
const GOLD = '#c8a84e';
const SHELF_WOOD = '#5a4030';
const SHELF_EDGE = '#3d2a20';
const WALL = '#241c16';

const SPINES: Record<number, { fill: string; band: string }> = {
  1: { fill: '#c4a574', band: '#e8dcc8' },
  3: { fill: '#7a3030', band: '#d4a05a' },
  7: { fill: '#2d4a3a', band: '#c8a84e' },
};

export function bookWidth(weight: number): number {
  if (weight >= 7) return 28;
  if (weight >= 3) return 20;
  return 14;
}

export function bookHeight(weight: number): number {
  return Math.max(14, weight * 10);
}

function shelfSagDegrees(totalWeight: number): number {
  return (totalWeight / 15) * 8;
}

function bookGroup(
  pieces: { weight: number }[],
  shelfY: number,
): string {
  const gap = 5;
  let x = 36;
  const parts: string[] = [];

  pieces.forEach((piece, index) => {
    const w = bookWidth(piece.weight);
    const h = bookHeight(piece.weight);
    const y = shelfY - h;
    const palette = SPINES[piece.weight] ?? SPINES[1];
    const enter = index === pieces.length - 1 ? ' book-enter' : '';
    const lean = ((index % 5) - 2) * 0.8;
    parts.push(
      `<g class="book-wrap${enter}" transform="rotate(${lean} ${x + w / 2} ${shelfY})">`,
      `<rect class="book book-w${piece.weight}${enter}" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${palette.fill}" stroke="${GOLD}" stroke-width="1"/>`,
      `<rect x="${x + 3}" y="${y + 3}" width="3" height="${h - 6}" fill="${palette.band}" opacity="0.9"/>`,
      `<rect x="${x + w - 4}" y="${y + 2}" width="2" height="${h - 4}" fill="#e8dcc8" opacity="0.35"/>`,
      `</g>`,
    );
    x += w + gap;
  });

  return parts.join('');
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
    const shelfY = 168;

    this.host.innerHTML = `<svg class="equilibrium-shelf${phaseClass}" viewBox="0 0 360 220" width="100%" role="img" aria-label="Books stack on a shelf" xmlns="http://www.w3.org/2000/svg">
  <rect width="360" height="220" fill="${CHARCOAL}" rx="10"/>
  <rect x="12" y="12" width="336" height="196" fill="${WALL}" rx="8"/>
  <g class="shelf-tilt" style="transform: rotate(${sag}deg); transform-origin: 180px 176px">
    <rect class="shelf-board" x="20" y="${shelfY}" width="320" height="14" rx="3" fill="${SHELF_WOOD}" stroke="${GOLD}" stroke-width="1.2"/>
    <rect x="20" y="${shelfY + 10}" width="320" height="6" fill="${SHELF_EDGE}"/>
    <g class="books">${bookGroup(pieces, shelfY)}</g>
  </g>
</svg>`;
  }
}
