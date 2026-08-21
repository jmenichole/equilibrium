/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { createRgs, createRgsFromWindow } from '../src/rgs/client';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('createRgs posts to wallet endpoints with sessionID', async () => {
  const calls: { url: string; body: unknown }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) });
      const path = new URL(url).pathname;
      if (path.endsWith('/wallet/authenticate')) {
        return new Response(
          JSON.stringify({
            balance: { amount: 1_000_000_000, currency: 'USD' },
            config: {
              betLevels: [1_000_000],
              minBet: 1_000_000,
              maxBet: 1_000_000,
              stepBet: 1_000_000,
            },
            round: null,
          }),
          { status: 200 },
        );
      }
      if (path.endsWith('/wallet/play')) {
        return new Response(
          JSON.stringify({
            balance: { amount: 999_000_000 },
            round: {
              active: true,
              state: [{ index: 0, type: 'bust' }],
              payoutMultiplier: 0,
            },
          }),
          { status: 200 },
        );
      }
      if (path.endsWith('/wallet/end-round')) {
        return new Response(
          JSON.stringify({ balance: { amount: 999_000_000 } }),
          { status: 200 },
        );
      }
      return new Response('not found', { status: 404 });
    }),
  );

  const rgs = createRgs('https://rgs.example', 'sess-1');
  await rgs.authenticate();
  await rgs.play(1_000_000, 'base');
  await rgs.endRound();

  expect(calls.map((c) => c.url)).toEqual([
    'https://rgs.example/wallet/authenticate',
    'https://rgs.example/wallet/play',
    'https://rgs.example/wallet/end-round',
  ]);
  expect(calls.every((c) => (c.body as { sessionID: string }).sessionID === 'sess-1')).toBe(
    true,
  );
  expect(calls[1].body).toMatchObject({ amount: 1_000_000, mode: 'base' });
});

test('createRgs strips trailing slash from rgsUrl', async () => {
  let playUrl = '';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      playUrl = url;
      return new Response(
        JSON.stringify({
          balance: { amount: 0 },
          round: { active: true, state: [], payoutMultiplier: 0 },
        }),
        { status: 200 },
      );
    }),
  );

  await createRgs('https://rgs.example/', 's').play(1_000_000, 'base');
  expect(playUrl).toBe('https://rgs.example/wallet/play');
});

test('createRgsFromWindow defaults rgsUrl to location origin', () => {
  const original = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...original, origin: 'http://localhost:5173', search: '?sessionID=dev' },
  });

  let calledUrl = '';
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      calledUrl = url;
      return new Response(
        JSON.stringify({
          balance: { amount: 0, currency: 'USD' },
          config: {
            betLevels: [],
            minBet: 0,
            maxBet: 0,
            stepBet: 0,
          },
          round: null,
        }),
        { status: 200 },
      );
    }),
  );

  void createRgsFromWindow().authenticate();
  expect(calledUrl).toBe('http://localhost:5173/wallet/authenticate');
  Object.defineProperty(window, 'location', { configurable: true, value: original });
});
