/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import {
  COPYRIGHT_NOTICE,
  DISCLAIMER,
  GAME_TITLE,
  MAX_WIN_X,
  RTP_DISPLAY,
} from '../constants';
import type { RgsApi } from '../rgs/client';
import { displayPayoutX, formatRgsAmount } from '../rgs/display';
import type { BookEvent } from '../rgs/types';
import { playBookEvents } from './replay';
import { ShelfView } from './shelfView';

const BET_STORAGE_KEY = 'equilibrium.bet';

export class EquilibriumEngineApp {
  private busy = false;
  private balance = 0;
  private betLevels: number[] = [];
  private selectedBet = 0;
  private muted = false;
  private infoOpen = false;
  private shelfView: ShelfView | null = null;
  private pieces: { weight: number }[] = [];
  private totalWeight = 0;
  private phase: 'idle' | 'playing' | 'bust' | 'win' = 'idle';
  private hintText = '×1.00';
  private winText = '';
  private lastBookState: BookEvent[] | null = null;
  private hasFinishedBook = false;
  private bound = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly rgs: RgsApi,
    private readonly delayMs = 40,
  ) {}

  async mount(): Promise<void> {
    const auth = await this.rgs.authenticate();
    this.betLevels = auth.config.betLevels;
    this.balance = auth.balance.amount;
    this.selectedBet = this.loadSavedBet();
    this.renderShell();
    this.updateDisplay();
    this.bindEvents();
    await this.resumeActiveRound(auth.round);
  }

  private async resumeActiveRound(
    round: { active: boolean; state: BookEvent[] } | null,
  ): Promise<void> {
    if (!round?.active || round.state.length === 0) return;

    this.busy = true;
    this.updateDisplay();
    await this.replayRound(round.state);
    this.lastBookState = round.state;
    this.hasFinishedBook = true;
    await this.rgs.endRound();
    this.busy = false;
    this.updateDisplay();
  }

  private loadSavedBet(): number {
    const saved = localStorage.getItem(BET_STORAGE_KEY);
    const parsed = saved ? Number(saved) : NaN;
    if (Number.isFinite(parsed) && this.betLevels.includes(parsed)) {
      return parsed;
    }
    return this.betLevels.includes(1_000_000)
      ? 1_000_000
      : (this.betLevels[0] ?? 0);
  }

  private renderShell(): void {
    if (this.root.querySelector('#shelf-slot')) return;

    this.root.innerHTML = `
      <main class="equilibrium-app">
        <div id="balance" aria-live="polite"></div>
        <label for="bet">Bet</label>
        <select id="bet"></select>
        <button type="button" id="btn-play">Play</button>
        <div id="hint" aria-live="polite"></div>
        <div id="shelf-slot"></div>
        <div id="win" aria-live="polite"></div>
        <button type="button" id="btn-sound" aria-pressed="false">Sound</button>
        <button type="button" id="btn-info">Info</button>
        <div id="info-panel" hidden>
          <h2>Rules</h2>
          <p>Press Play and watch the shelf. If the shelf busts, you lose. Wins pay the multiplier shown (×).</p>
          <p>RTP: ${RTP_DISPLAY}</p>
          <p>Max win: ×${MAX_WIN_X}</p>
          <p id="disclaimer"></p>
          <button type="button" id="btn-replay" disabled>Replay last</button>
        </div>
        <footer>${COPYRIGHT_NOTICE}</footer>
      </main>
    `;

    const slot = this.root.querySelector('#shelf-slot') as HTMLElement;
    this.shelfView = new ShelfView(slot);
    const disclaimer = this.root.querySelector('#disclaimer');
    if (disclaimer) disclaimer.textContent = DISCLAIMER;
  }

  private updateDisplay(): void {
    const balanceEl = this.root.querySelector('#balance');
    if (balanceEl) balanceEl.textContent = formatRgsAmount(this.balance);

    const betEl = this.root.querySelector('#bet') as HTMLSelectElement | null;
    if (betEl) {
      betEl.innerHTML = this.betLevels
        .map(
          (level) =>
            `<option value="${level}"${level === this.selectedBet ? ' selected' : ''}>${formatRgsAmount(level)}</option>`,
        )
        .join('');
      betEl.disabled = this.busy;
    }

    const playBtn = this.root.querySelector('#btn-play') as HTMLButtonElement | null;
    if (playBtn) playBtn.disabled = this.busy;

    const hintEl = this.root.querySelector('#hint');
    if (hintEl) hintEl.textContent = this.hintText;

    const winEl = this.root.querySelector('#win');
    if (winEl) winEl.textContent = this.winText;

    const soundBtn = this.root.querySelector('#btn-sound') as HTMLButtonElement | null;
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', String(this.muted));
      soundBtn.classList.toggle('muted', this.muted);
    }

    const infoPanel = this.root.querySelector('#info-panel') as HTMLElement | null;
    if (infoPanel) infoPanel.hidden = !this.infoOpen;

    const replayBtn = this.root.querySelector('#btn-replay') as HTMLButtonElement | null;
    if (replayBtn) replayBtn.disabled = this.busy || !this.hasFinishedBook;

    this.shelfView?.render({
      pieces: this.pieces,
      phase: this.phase,
      totalWeight: this.totalWeight,
    });
  }

  private bindEvents(): void {
    if (this.bound) return;
    this.bound = true;

    const betEl = this.root.querySelector('#bet') as HTMLSelectElement;
    betEl.addEventListener('change', () => {
      this.selectedBet = Number(betEl.value);
      localStorage.setItem(BET_STORAGE_KEY, String(this.selectedBet));
    });

    const playBtn = this.root.querySelector('#btn-play') as HTMLButtonElement;
    playBtn.addEventListener('click', () => void this.onPlay());

    const soundBtn = this.root.querySelector('#btn-sound') as HTMLButtonElement;
    soundBtn.addEventListener('click', () => {
      this.muted = !this.muted;
      this.updateDisplay();
    });

    const infoBtn = this.root.querySelector('#btn-info') as HTMLButtonElement;
    infoBtn.addEventListener('click', () => {
      this.infoOpen = !this.infoOpen;
      this.updateDisplay();
    });

    const replayBtn = this.root.querySelector('#btn-replay') as HTMLButtonElement;
    replayBtn.addEventListener('click', () => void this.onReplayLast());

    document.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' && event.key !== ' ') return;
      const btn = this.root.querySelector('#btn-play') as HTMLButtonElement | null;
      if (!btn || btn.disabled) return;
      event.preventDefault();
      btn.click();
    });
  }

  private async onPlay(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.hintText = '×1.00';
    this.winText = '';
    this.pieces = [];
    this.totalWeight = 0;
    this.phase = 'playing';
    this.updateDisplay();

    const result = await this.rgs.play(this.selectedBet, 'base');
    this.balance = result.balance.amount;

    await this.replayRound(result.round.state);
    this.lastBookState = result.round.state;
    this.hasFinishedBook = true;
    await this.rgs.endRound();
    this.busy = false;
    this.updateDisplay();
  }

  private async onReplayLast(): Promise<void> {
    if (this.busy || !this.lastBookState) return;

    this.busy = true;
    this.hintText = '×1.00';
    this.winText = '';
    this.pieces = [];
    this.totalWeight = 0;
    this.phase = 'playing';
    this.updateDisplay();

    await this.replayRound(this.lastBookState);
    this.busy = false;
    this.updateDisplay();
  }

  private async replayRound(events: BookEvent[]): Promise<void> {
    await playBookEvents(
      events,
      {
        stack: (event) => {
          this.pieces = [...this.pieces, { weight: event.weight }];
          this.totalWeight = event.totalWeight;
          this.hintText = `×${displayPayoutX(event.payoutMultiplier)}`;
          this.phase = 'playing';
          this.updateDisplay();
        },
        bust: () => {
          this.hintText = '×0.00';
          this.phase = 'bust';
          this.updateDisplay();
        },
        setTotalWin: (event) => {
          this.winText = formatRgsAmount(event.amount);
          this.updateDisplay();
        },
        finalWin: () => {
          this.phase = 'win';
          this.updateDisplay();
        },
      },
      this.delayMs,
    );
  }
}
