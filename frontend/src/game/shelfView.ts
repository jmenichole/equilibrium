/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
export type ShelfPhase = 'idle' | 'playing' | 'bust' | 'win';

export type ShelfRenderInput = {
  pieces: { weight: number }[];
  phase: ShelfPhase;
  totalWeight: number;
};

const GOLD = '#c8a84e';
const SHELF_WOOD = '#5a4030';
const SHELF_EDGE = '#3d2a20';
const PLASTER = '#d4c4a8';
const WAINSCOT = '#6b4e3d';
const WAINSCOT_EDGE = '#4a3428';
const LIGHT_GOLD = '#e8d9a8';

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

function libraryWall(): string {
  return `<g class="library-wall">
    <rect width="360" height="220" fill="${PLASTER}" rx="10"/>
    <rect x="0" y="150" width="360" height="70" fill="${WAINSCOT}"/>
    <rect x="0" y="148" width="360" height="4" fill="${WAINSCOT_EDGE}"/>
    <ellipse cx="180" cy="70" rx="120" ry="48" fill="${LIGHT_GOLD}" opacity="0.28"/>
  </g>`;
}

function pileGroup(pieces: { weight: number }[], shelfY: number): string {
  const centerX = 180;
  let y = shelfY;
  const parts: string[] = [];

  pieces.forEach((piece, index) => {
    const w = bookWidth(piece.weight);
    const h = bookHeight(piece.weight);
    y -= h;
    const x = centerX - w / 2;
    const palette = SPINES[piece.weight] ?? SPINES[1];
    const enter = index === pieces.length - 1 ? ' book-enter' : '';
    const lean = ((index % 5) - 2) * 0.8;
    parts.push(
      `<g class="book-wrap${enter}" transform="rotate(${lean} ${centerX} ${y + h})">`,
      `<rect class="book book-w${piece.weight}${enter}" x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${palette.fill}" stroke="${GOLD}" stroke-width="1"/>`,
      `<rect x="${x + 3}" y="${y + 3}" width="3" height="${h - 6}" fill="${palette.band}" opacity="0.9"/>`,
      `<rect x="${x + w - 4}" y="${y + 2}" width="2" height="${h - 4}" fill="#e8dcc8" opacity="0.35"/>`,
      `</g>`,
    );
  });

  return parts.join('');
}

export class ShelfView {
  private readonly host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
  }

  render(input: ShelfRenderInput): void {
    const { pieces, phase } = input;
    const phaseClass = phase === 'bust' ? ' is-bust' : phase === 'win' ? ' is-win' : '';
    const shelfY = 168;

    this.host.innerHTML = `<svg class="equilibrium-shelf${phaseClass}" viewBox="0 0 360 220" width="100%" role="img" aria-label="Books piled on a shelf" xmlns="http://www.w3.org/2000/svg">
  ${libraryWall()}
  <g class="shelf-board">
    <rect x="20" y="${shelfY}" width="320" height="14" rx="3" fill="${SHELF_WOOD}" stroke="${GOLD}" stroke-width="1.2"/>
    <rect x="20" y="${shelfY + 10}" width="320" height="6" fill="${SHELF_EDGE}"/>
  </g>
  <g class="pile">${pileGroup(pieces, shelfY)}</g>
</svg>`;
  }
}
