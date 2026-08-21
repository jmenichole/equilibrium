/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { BLOCKS, type BlockId } from '../constants';
import { displayMultiplier } from '../math/multiplier';
import type { Quote } from '../math/quotes';
import type { GameServer, Round } from '../server/types';
import { formatAmount } from './format';
import { ScaleView, type ScalePhase } from './scaleView';

export class EquilibriumApp {
  private busy = false;
  private round: Round | null = null;
  private betLevels: number[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly server: GameServer,
  ) {}

  async mount(): Promise<void> {
    const auth = await this.server.authenticate();
    this.betLevels = auth.config.betLevels;
    this.round = auth.round;
    this.render(auth.balance.amount);
    this.bind();
  }

  private scalePhase(): ScalePhase {
    const state = this.round?.state ?? [];
    for (let i = state.length - 1; i >= 0; i--) {
      const e = state[i];
      if (e.type === 'bust') return 'bust';
      if (e.type === 'cashedOut') return 'cashedOut';
    }
    if (this.round?.active) return 'playing';
    return 'idle';
  }

  private quotes(): Quote[] {
    const state = this.round?.state ?? [];
    for (let i = state.length - 1; i >= 0; i--) {
      const e = state[i];
      if (e.type === 'quotes') return e.quotes;
    }
    return [];
  }

  private render(balanceAmount: number) {
    const qs = this.quotes();
    const active = Boolean(this.round?.active);
    const canCash = active && (this.round?.blocksPlaced ?? 0) >= 1;
    this.root.querySelectorAll<HTMLButtonElement>('[data-bet]').forEach((btn) => {
      btn.disabled = active;
    });
    const q = (id: BlockId) => qs.find((x) => x.block === id);
    const label = (id: BlockId) => {
      const row = q(id);
      const meta = BLOCKS[id];
      if (!row) return `${meta.label.toUpperCase()}  +${meta.weight}`;
      const pct = Math.round(row.pSurvive * 100);
      return `${meta.label.toUpperCase()}  +${row.weight}  → ${displayMultiplier(row.nextMultiplierBps)}x  ${pct}%`;
    };
    this.root.innerHTML = `
      <header>
        <div id="balance">${formatAmount(balanceAmount)}</div>
        <div id="play-money">PLAY MONEY</div>
        <button type="button" id="btn-reset">Reset</button>
      </header>
      <p id="hint">Stack weight. Cash out before it breaks.</p>
      <div id="bet-levels">
        ${this.betLevels
          .map(
            (b) =>
              `<button type="button" data-bet="${b}" ${active ? 'disabled' : ''}>${formatAmount(b)}</button>`,
          )
          .join('')}
      </div>
      <div id="scale-slot"></div>
      <div id="blocks">
        ${(['safe', 'medium', 'heavy'] as BlockId[])
          .map((id) => {
            const row = q(id);
            const disabled = !active || !row || row.disabled || this.busy;
            return `<button type="button" id="btn-${id}" ${disabled ? 'disabled' : ''}>${label(id)}</button>`;
          })
          .join('')}
        <button type="button" id="btn-cashout" ${canCash && !this.busy ? '' : 'disabled'}>Cash Out</button>
      </div>
      <footer id="footer">Pitch demo — not on Stake/Bink. © 2026 jmenichole.</footer>
    `;
    const slot = this.root.querySelector('#scale-slot');
    if (slot) {
      new ScaleView(slot as HTMLElement).setState({
        weight: this.round?.weight ?? 0,
        phase: this.scalePhase(),
      });
    }
    this.bind();
  }

  private bind() {
    this.root.querySelectorAll<HTMLButtonElement>('[data-bet]').forEach((btn) => {
      btn.onclick = () => void this.onBet(Number(btn.dataset.bet));
    });
    const safe = this.root.querySelector<HTMLButtonElement>('#btn-safe');
    const medium = this.root.querySelector<HTMLButtonElement>('#btn-medium');
    const heavy = this.root.querySelector<HTMLButtonElement>('#btn-heavy');
    const cash = this.root.querySelector<HTMLButtonElement>('#btn-cashout');
    const reset = this.root.querySelector<HTMLButtonElement>('#btn-reset');
    if (safe) safe.onclick = () => void this.onPlace('safe');
    if (medium) medium.onclick = () => void this.onPlace('medium');
    if (heavy) heavy.onclick = () => void this.onPlace('heavy');
    if (cash) cash.onclick = () => void this.onCash();
    if (reset) reset.onclick = () => void this.onReset();
  }

  private async onBet(amount: number) {
    if (this.busy || this.round?.active) return;
    this.busy = true;
    const res = await this.server.play(amount, 'BASE');
    this.busy = false;
    if (res.status.statusCode !== 'SUCCESS') return;
    this.round = res.round;
    this.render(res.balance.amount);
  }

  private async onPlace(block: BlockId) {
    if (this.busy || !this.round?.active) return;
    this.busy = true;
    const res = await this.server.action('DECISION', { type: 'place', block });
    this.busy = false;
    this.round = res.round;
    this.render(res.balance.amount);
    if (!res.round.active) {
      this.busy = true;
      const ended = await this.server.endRound();
      this.busy = false;
      this.round = ended.round;
      this.render(ended.balance.amount);
    }
  }

  private async onCash() {
    if (this.busy || !this.round?.active || this.round.blocksPlaced < 1) return;
    this.busy = true;
    const res = await this.server.endRound();
    this.busy = false;
    this.round = res.round;
    this.render(res.balance.amount);
  }

  private async onReset() {
    this.busy = true;
    const res = await this.server.resetBalance();
    this.busy = false;
    this.round = null;
    this.render(res.balance.amount);
  }
}
