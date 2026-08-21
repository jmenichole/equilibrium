/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export type ScalePhase = 'idle' | 'playing' | 'bust' | 'cashedOut';

const MAX_WEIGHT = 15;

export class ScaleView {
  private readonly platform: SVGGElement;
  private readonly stack: SVGGElement;
  private lastPhase: ScalePhase = 'idle';

  constructor(host: HTMLElement) {
    host.innerHTML = `
      <svg width="320" height="240" viewBox="0 0 320 240" aria-hidden="true">
        <rect x="40" y="210" width="240" height="14" rx="3" fill="#555" />
        <polygon points="160,50 30,210 290,210" fill="none" stroke="#777" stroke-width="4" />
        <g id="scale-platform">
          <rect x="60" y="175" width="200" height="12" rx="2" fill="#888" />
          <g id="scale-stack"></g>
        </g>
      </svg>
    `;
    this.platform = host.querySelector('#scale-platform')!;
    this.stack = host.querySelector('#scale-stack')!;
  }

  setState(s: { weight: number; phase: ScalePhase }): void {
    const wobble = s.weight / MAX_WEIGHT;
    this.platform.style.setProperty('--wobble', String(wobble));

    this.platform.classList.remove('bust', 'win');
    if (s.phase === 'bust' && this.lastPhase !== 'bust') {
      void this.platform.getBBox();
      this.platform.classList.add('bust');
    } else if (s.phase === 'bust') {
      this.platform.classList.add('bust');
    }
    if (s.phase === 'cashedOut' && this.lastPhase !== 'cashedOut') {
      void this.platform.getBBox();
      this.platform.classList.add('win');
    } else if (s.phase === 'cashedOut') {
      this.platform.classList.add('win');
    }

    const scatter = s.phase === 'bust';
    this.stack.replaceChildren();
    for (let i = 0; i < s.weight; i++) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('data-block-index', String(i));
      rect.setAttribute('x', String(72 + (i % 6) * 14));
      rect.setAttribute('y', String(168 - Math.floor(i / 6) * 14));
      rect.setAttribute('width', '18');
      rect.setAttribute('height', '12');
      rect.setAttribute('fill', '#d4af37');
      rect.setAttribute('rx', '2');
      if (scatter) {
        rect.classList.add('scatter');
        rect.style.setProperty('--sx', `${(Math.random() - 0.5) * 80}px`);
        rect.style.setProperty('--sy', `${20 + Math.random() * 60}px`);
        rect.style.setProperty('--rot', `${(Math.random() - 0.5) * 90}deg`);
      }
      this.stack.appendChild(rect);
    }

    this.lastPhase = s.phase;
  }
}
