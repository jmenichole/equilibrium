/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { createRgs } from '../src/rgs/client';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('createRgs play fetch URL uses the host from rgsUrl', async () => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      urls.push(url);
      return new Response(
        JSON.stringify({
          balance: { amount: 0 },
          round: { active: true, state: [], payoutMultiplier: 0 },
        }),
        { status: 200 },
      );
    }),
  );

  await createRgs('https://staging.rgs.example', 's').play(1_000_000, 'base');
  await createRgs('https://prod.rgs.example', 's').play(1_000_000, 'base');

  expect(urls[0]).toBe('https://staging.rgs.example/wallet/play');
  expect(urls[1]).toBe('https://prod.rgs.example/wallet/play');
});
