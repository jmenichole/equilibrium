/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import {
  BET_LEVELS,
  BLOCKS,
  C_SPAN,
  STARTING_BALANCE,
  STARTING_MULTIPLIER_BPS,
  type BlockId,
} from '../constants';
import { buildQuotes } from '../math/quotes';
import { payoutAmount } from '../math/multiplier';
import type {
  Balance,
  BookEvent,
  EngineResponse,
  GameConfig,
  GameServer,
  PlacePayload,
  Round,
} from './types';

type InternalRound = Round & { C: number };

function defaultRollC(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % C_SPAN;
}

function emptyRound(): Round {
  return {
    betID: 0,
    active: false,
    mode: 'BASE',
    amount: 0,
    payout: 0,
    multiplierBps: STARTING_MULTIPLIER_BPS,
    weight: 0,
    blocksPlaced: 0,
    state: [],
  };
}

export class LocalGameServer implements GameServer {
  private balance: Balance = { amount: STARTING_BALANCE, currency: 'XSC' };
  private nextBetID = 1;
  private internal: InternalRound | null = null;
  private lastPublic: Round = emptyRound();
  private readonly rollC: () => number;

  constructor(opts?: { rollC?: () => number }) {
    this.rollC = opts?.rollC ?? defaultRollC;
  }

  private config(): GameConfig {
    return {
      betLevels: [...BET_LEVELS],
      minBet: BET_LEVELS[0],
      maxBet: BET_LEVELS[BET_LEVELS.length - 1],
      stepBet: BET_LEVELS[0],
    };
  }

  private publicRound(round: InternalRound | null): Round {
    if (!round) return this.lastPublic;
    const { C: _c, ...pub } = round;
    void _c;
    this.lastPublic = pub;
    return pub;
  }

  private ok(
    round: InternalRound | null,
    code: EngineResponse['status']['statusCode'] = 'SUCCESS',
  ): EngineResponse {
    return {
      status: { statusCode: code },
      balance: { ...this.balance },
      round: this.publicRound(round),
    };
  }

  private fail(code: EngineResponse['status']['statusCode']): EngineResponse {
    return {
      status: { statusCode: code },
      balance: { ...this.balance },
      round: this.publicRound(this.internal),
    };
  }

  async authenticate() {
    return {
      balance: { ...this.balance },
      config: this.config(),
      round: this.internal ? this.publicRound(this.internal) : null,
    };
  }

  async play(amount: number, mode: 'BASE'): Promise<EngineResponse> {
    void mode;
    if (this.internal?.active) return this.fail('ERR_BE');
    if (!BET_LEVELS.includes(amount)) return this.fail('ERR_GE');
    if (this.balance.amount < amount) return this.fail('ERR_IPB');
    this.balance.amount -= amount;
    const quotes = buildQuotes(0, STARTING_MULTIPLIER_BPS);
    const state: BookEvent[] = [{ index: 0, type: 'quotes', quotes }];
    this.internal = {
      betID: this.nextBetID++,
      active: true,
      mode: 'BASE',
      amount,
      payout: 0,
      multiplierBps: STARTING_MULTIPLIER_BPS,
      weight: 0,
      blocksPlaced: 0,
      state,
      C: this.rollC(),
    };
    return this.ok(this.internal);
  }

  async action(kind: 'DECISION', payload: PlacePayload): Promise<EngineResponse> {
    void kind;
    const round = this.internal;
    if (!round?.active) return this.fail('ERR_GE');
    const block: BlockId = payload.block;
    const spec = BLOCKS[block];
    if (!spec) return this.fail('ERR_GE');
    const quotesNow = buildQuotes(round.weight, round.multiplierBps);
    const q = quotesNow.find((x) => x.block === block);
    if (!q || q.disabled) return this.fail('ERR_GE');
    const nextWeight = round.weight + spec.weight;
    if (nextWeight > round.C) {
      round.active = false;
      round.payout = 0;
      round.multiplierBps = 0;
      round.state = [
        ...round.state,
        { index: round.state.length, type: 'bust', block },
      ];
      return this.ok(round);
    }
    round.weight = nextWeight;
    round.multiplierBps = q.nextMultiplierBps;
    round.blocksPlaced += 1;
    const quotes = buildQuotes(round.weight, round.multiplierBps);
    round.state = [
      ...round.state,
      {
        index: round.state.length,
        type: 'blockAccepted',
        block,
        weight: spec.weight,
        totalWeight: round.weight,
        multiplierBps: round.multiplierBps,
      },
      { index: round.state.length + 1, type: 'quotes', quotes },
    ];
    return this.ok(round);
  }

  async endRound(): Promise<EngineResponse> {
    const round = this.internal;
    if (!round) return this.ok(null);
    if (!round.active) {
      this.internal = null;
      return this.ok(null);
    }
    if (round.blocksPlaced < 1) return this.fail('ERR_GE');
    const payout = payoutAmount(round.amount, round.multiplierBps);
    round.payout = payout;
    round.active = false;
    round.state = [
      ...round.state,
      {
        index: round.state.length,
        type: 'cashedOut',
        payout,
        multiplierBps: round.multiplierBps,
      },
    ];
    this.balance.amount += payout;
    this.internal = null;
    return this.ok(round);
  }

  async resetBalance() {
    this.internal = null;
    this.lastPublic = emptyRound();
    this.balance = { amount: STARTING_BALANCE, currency: 'XSC' };
    return { balance: { ...this.balance } };
  }
}
