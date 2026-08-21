/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import type { BlockId } from '../constants';
import type { Quote } from '../math/quotes';

export type StatusCode = 'SUCCESS' | 'ERR_BE' | 'ERR_IPB' | 'ERR_GE';

export type Balance = { amount: number; currency: 'XSC' };

export type GameConfig = {
  betLevels: number[];
  minBet: number;
  maxBet: number;
  stepBet: number;
};

export type BookEvent =
  | { index: number; type: 'quotes'; quotes: Quote[] }
  | {
      index: number;
      type: 'blockAccepted';
      block: BlockId;
      weight: number;
      totalWeight: number;
      multiplierBps: number;
    }
  | { index: number; type: 'bust'; block: BlockId }
  | {
      index: number;
      type: 'cashedOut';
      payout: number;
      multiplierBps: number;
    };

export type Round = {
  betID: number;
  active: boolean;
  mode: 'BASE';
  amount: number;
  payout: number;
  multiplierBps: number;
  weight: number;
  blocksPlaced: number;
  state: BookEvent[];
};

export type EngineResponse = {
  status: { statusCode: StatusCode };
  balance: Balance;
  round: Round;
};

export type PlacePayload = { type: 'place'; block: BlockId };

export interface GameServer {
  authenticate(): Promise<{
    balance: Balance;
    config: GameConfig;
    round: Round | null;
  }>;
  play(amount: number, mode: 'BASE'): Promise<EngineResponse>;
  action(kind: 'DECISION', payload: PlacePayload): Promise<EngineResponse>;
  endRound(): Promise<EngineResponse>;
  resetBalance(): Promise<{ balance: Balance }>;
}
