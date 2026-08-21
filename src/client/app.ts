/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { BLOCKS, STARTING_MULTIPLIER_BPS, type BlockId } from '../constants';
import { displayMultiplier, payoutAmount } from '../math/multiplier';
import type { Quote } from '../math/quotes';
import type { GameServer, Round, StatusCode } from '../server/types';
import { formatAmount } from './format';
import { ScaleView, type ScalePhase } from './scaleView';

export class EquilibriumApp {
  private busy = false;
  private round: Round | null = null;
  private betLevels: number[] = [];
  private balanceAmount = 0;
  private statusMessage = '';
  private scaleView: ScaleView | null = null;
  private lastPhase: ScalePhase = 'idle';

  constructor(
    private readonly root: HTMLElement,
    private readonly server: GameServer,
  ) {}

  async mount(): Promise<void> {
    const auth = await this.server.authenticate();
    this.betLevels = auth.config.betLevels;
    this.round = auth.round;
    this.balanceAmount = auth.balance.amount;
    this.render(auth.balance.amount);
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

  private statusFor(code: StatusCode): string {
    if (code === 'ERR_IPB') return 'Insufficient balance for that bet.';
    if (code === 'ERR_GE') return 'That action is not allowed right now.';
    return '';
  }

  private ensureShell(): void {
    if (this.root.querySelector('#scale-slot')) return;
    this.root.innerHTML = `
      <header>
        <div id="balance"></div>
        <div id="play-money">PLAY MONEY</div>
        <button type="button" id="btn-reset">Reset</button>
      </header>
      <p id="status" hidden></p>
      <p id="hint">Stack weight. Cash out before it breaks.</p>
      <div id="hud">
        <span id="multiplier"></span>
        <span id="weight"></span>
      </div>
      <div id="bet-levels"></div>
      <div id="scale-slot"></div>
      <div id="blocks"></div>
      <footer id="footer">Pitch demo — not on Stake/Bink. © 2026 jmenichole.</footer>
    `;
    const slot = this.root.querySelector('#scale-slot') as HTMLElement;
    this.scaleView = new ScaleView(slot);
  }

  private render(balanceAmount: number) {
    this.balanceAmount = balanceAmount;
    this.ensureShell();

    const qs = this.quotes();
    const active = Boolean(this.round?.active);
    const canCash = active && (this.round?.blocksPlaced ?? 0) >= 1;
    const phase = this.scalePhase();
    const isBust = phase === 'bust';
    const multiplierText = isBust
      ? '0.00x'
      : `${displayMultiplier(this.round?.multiplierBps ?? STARTING_MULTIPLIER_BPS)}x`;
    const weight = this.round?.weight ?? 0;

    const balanceEl = this.root.querySelector('#balance');
    if (balanceEl) balanceEl.textContent = formatAmount(balanceAmount);

    const statusEl = this.root.querySelector('#status') as HTMLElement | null;
    if (statusEl) {
      statusEl.textContent = this.statusMessage;
      statusEl.hidden = this.statusMessage.length === 0;
    }

    const multiplierEl = this.root.querySelector('#multiplier');
    if (multiplierEl) {
      multiplierEl.textContent = multiplierText;
      multiplierEl.classList.remove('pulse');
      if (phase === 'cashedOut' && this.lastPhase !== 'cashedOut') {
        void (multiplierEl as HTMLElement).offsetWidth;
        multiplierEl.classList.add('pulse');
      }
    }

    const weightEl = this.root.querySelector('#weight');
    if (weightEl) weightEl.textContent = `Weight: ${weight}`;

    const q = (id: BlockId) => qs.find((x) => x.block === id);
    const label = (id: BlockId) => {
      const row = q(id);
      const meta = BLOCKS[id];
      if (!row) return `${meta.label.toUpperCase()}  +${meta.weight}`;
      const pct = Math.round(row.pSurvive * 100);
      return `${meta.label.toUpperCase()}  +${row.weight}  → ${displayMultiplier(row.nextMultiplierBps)}x  ${pct}%`;
    };

    const betLevelsEl = this.root.querySelector('#bet-levels');
    if (betLevelsEl) {
      betLevelsEl.innerHTML = this.betLevels
        .map((b) => {
          const disabled = active || b > balanceAmount || this.busy;
          return `<button type="button" data-bet="${b}" ${disabled ? 'disabled' : ''}>${formatAmount(b)}</button>`;
        })
        .join('');
    }

    const cashLabel =
      canCash && !this.busy && this.round
        ? `Cash Out ${formatAmount(payoutAmount(this.round.amount, this.round.multiplierBps))}`
        : 'Cash Out';

    const blocksEl = this.root.querySelector('#blocks');
    if (blocksEl) {
      blocksEl.innerHTML = `
        ${(['safe', 'medium', 'heavy'] as BlockId[])
          .map((id) => {
            const row = q(id);
            const disabled = !active || !row || row.disabled || this.busy;
            return `<button type="button" id="btn-${id}" ${disabled ? 'disabled' : ''}>${label(id)}</button>`;
          })
          .join('')}
        <button type="button" id="btn-cashout" ${canCash && !this.busy ? '' : 'disabled'}>${cashLabel}</button>
      `;
    }

    this.scaleView!.setState({
      weight,
      phase,
    });
    this.lastPhase = phase;
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
    this.statusMessage = '';
    this.render(this.balanceAmount);
    const res = await this.server.play(amount, 'BASE');
    this.busy = false;
    if (res.status.statusCode !== 'SUCCESS') {
      this.statusMessage = this.statusFor(res.status.statusCode);
      this.render(res.balance.amount);
      return;
    }
    this.round = res.round;
    this.render(res.balance.amount);
  }

  private async onPlace(block: BlockId) {
    if (this.busy || !this.round?.active) return;
    this.busy = true;
    this.statusMessage = '';
    this.render(this.balanceAmount);
    const res = await this.server.action('DECISION', { type: 'place', block });
    this.busy = false;
    if (res.status.statusCode !== 'SUCCESS') {
      this.statusMessage = this.statusFor(res.status.statusCode);
      this.render(res.balance.amount);
      return;
    }
    this.round = res.round;
    this.render(res.balance.amount);
    if (!res.round.active) {
      this.busy = true;
      this.render(res.balance.amount);
      const ended = await this.server.endRound();
      this.busy = false;
      this.round = ended.round;
      this.render(ended.balance.amount);
    }
  }

  private async onCash() {
    if (this.busy || !this.round?.active || this.round.blocksPlaced < 1) return;
    this.busy = true;
    this.statusMessage = '';
    this.render(this.balanceAmount);
    const res = await this.server.endRound();
    this.busy = false;
    if (res.status.statusCode !== 'SUCCESS') {
      this.statusMessage = this.statusFor(res.status.statusCode);
      this.render(res.balance.amount);
      return;
    }
    this.round = res.round;
    this.render(res.balance.amount);
  }

  private async onReset() {
    this.busy = true;
    this.statusMessage = '';
    this.render(this.balanceAmount);
    const res = await this.server.resetBalance();
    this.busy = false;
    this.round = null;
    this.render(res.balance.amount);
  }
}
