/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { readRgsQuery } from './query';
import type { BookEvent } from './types';

export type RgsApi = {
  authenticate(): Promise<{
    balance: { amount: number; currency: string };
    config: {
      betLevels: number[];
      minBet: number;
      maxBet: number;
      stepBet: number;
    };
    round: { active: boolean; state: BookEvent[] } | null;
  }>;
  play(
    amount: number,
    mode: 'base',
  ): Promise<{
    balance: { amount: number };
    round: {
      active: boolean;
      state: BookEvent[];
      payoutMultiplier: number;
    };
  }>;
  endRound(): Promise<{ balance: { amount: number } }>;
};

async function postJson<T>(
  baseUrl: string,
  path: string,
  sessionID: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionID, ...body }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export function createRgs(rgsUrl: string, sessionID: string): RgsApi {
  const baseUrl = rgsUrl.replace(/\/$/, '');

  return {
    authenticate: () => postJson(baseUrl, '/wallet/authenticate', sessionID),
    play: (amount, mode) =>
      postJson(baseUrl, '/wallet/play', sessionID, { amount, mode }),
    endRound: () => postJson(baseUrl, '/wallet/end-round', sessionID),
  };
}

export function createRgsFromWindow(): RgsApi {
  const { rgsUrl, sessionID } = readRgsQuery(window.location.search);
  const url = rgsUrl || window.location.origin;
  return createRgs(url, sessionID);
}
