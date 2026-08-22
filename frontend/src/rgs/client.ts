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

function formatRgsFailure(raw: string, status: number): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: unknown;
      message?: unknown;
      status?: { statusCode?: unknown; message?: unknown };
    };
    return String(
      parsed.status?.message ??
        parsed.message ??
        parsed.error ??
        parsed.status?.statusCode ??
        raw,
    );
  } catch {
    return raw || `RGS request failed (${status})`;
  }
}

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
    throw new Error(formatRgsFailure(await response.text(), response.status));
  }
  return response.json() as Promise<T>;
}

function normalizeRgsUrl(rgsUrl: string): string {
  const trimmed = rgsUrl.replace(/\/$/, '');
  if (!trimmed || trimmed.includes('://')) return trimmed;
  const isLocal = /^(localhost|127\.0\.0\.1)(:|$)/i.test(trimmed);
  return `${isLocal ? 'http' : 'https'}://${trimmed}`;
}

export function createRgs(rgsUrl: string, sessionID: string): RgsApi {
  const baseUrl = normalizeRgsUrl(rgsUrl);

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
