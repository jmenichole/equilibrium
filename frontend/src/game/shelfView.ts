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
const PLASTER = '#cbb79a';
const WAINSCOT = '#5c4334';
const WAINSCOT_EDGE = '#3f2d22';
const LIGHT_GOLD = '#e8d9a8';
const PAGE = '#f3ead8';

const SPINES: Record<number, { fill: string; band: string }> = {
  1: { fill: '#c4a574', band: '#e8dcc8' },
  3: { fill: '#7a3030', band: '#d4a05a' },
  7: { fill: '#2d4a3a', band: '#c8a84e' },
};

export function bookWidth(weight: number): number {
  if (weight >= 7) return 168;
  if (weight >= 3) return 148;
  return 128;
}

export function bookHeight(weight: number): number {
  if (weight >= 7) return 24;
  if (weight >= 3) return 16;
  return 10;
}

function sceneryBooks(): string {
  const left = [
    { x: 18, y: 28, w: 11, h: 52, fill: '#6b3a32' },
    { x: 31, y: 36, w: 9, h: 44, fill: '#3d4f3a' },
    { x: 42, y: 24, w: 13, h: 56, fill: '#8a5a2b' },
    { x: 18, y: 92, w: 12, h: 40, fill: '#4a3030' },
    { x: 32, y: 98, w: 10, h: 34, fill: '#2f3d4a' },
    { x: 44, y: 88, w: 11, h: 44, fill: '#7a4e2a' },
  ];
  const right = left.map((b) => ({ ...b, x: 360 - b.x - b.w }));
  return `<g class="scenery" opacity="0.55">${[...left, ...right]
    .map(
      (b) =>
        `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="1.2" fill="${b.fill}" stroke="${GOLD}" stroke-width="0.6"/>`,
    )
    .join('')}</g>`;
}

function libraryWall(): string {
  return `<g class="library-wall">
    <rect width="360" height="220" fill="${PLASTER}"/>
    <rect x="8" y="16" width="56" height="132" rx="4" fill="#4a372c"/>
    <rect x="296" y="16" width="56" height="132" rx="4" fill="#4a372c"/>
    ${sceneryBooks()}
    <rect x="0" y="148" width="360" height="72" fill="${WAINSCOT}"/>
    <rect x="0" y="146" width="360" height="5" fill="${WAINSCOT_EDGE}"/>
    <ellipse cx="180" cy="64" rx="78" ry="36" fill="${LIGHT_GOLD}" opacity="0.34"/>
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
    const lean = ((index % 5) - 2) * 0.7;
    parts.push(
      `<g class="book-wrap${enter}" transform="rotate(${lean} ${centerX} ${y + h})">`,
      `<rect x="${x}" y="${y + h - 2}" width="${w}" height="3" rx="1" fill="#2a1c14" opacity="0.28"/>`,
      `<rect class="book book-w${piece.weight}${enter}" x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="${palette.fill}" stroke="${GOLD}" stroke-width="1.1"/>`,
      `<rect x="${x + 6}" y="${y + 3}" width="${w - 18}" height="${Math.max(3, h - 6)}" rx="1" fill="${palette.band}" opacity="0.22"/>`,
      `<rect x="${x + w - 8}" y="${y + 1}" width="6" height="${h - 2}" fill="${PAGE}"/>`,
      `<rect x="${x + 4}" y="${y + 2}" width="3" height="${h - 4}" fill="${palette.band}"/>`,
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
    <rect x="72" y="${shelfY}" width="216" height="16" rx="3" fill="${SHELF_WOOD}" stroke="${GOLD}" stroke-width="1.4"/>
    <rect x="72" y="${shelfY + 12}" width="216" height="7" fill="${SHELF_EDGE}"/>
    <rect x="78" y="${shelfY + 18}" width="8" height="14" rx="1" fill="${SHELF_EDGE}"/>
    <rect x="274" y="${shelfY + 18}" width="8" height="14" rx="1" fill="${SHELF_EDGE}"/>
  </g>
  <g class="pile">${pileGroup(pieces, shelfY)}</g>
</svg>`;
  }
}
