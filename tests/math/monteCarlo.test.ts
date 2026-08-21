/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { BET_LEVELS, type BlockId } from '../../src/constants';
import { LocalGameServer } from '../../src/server/localGameServer';
import type { Quote } from '../../src/math/quotes';

function latestQuotes(state: { type: string; quotes?: Quote[] }[]): Quote[] {
  for (let i = state.length - 1; i >= 0; i--) {
    const e = state[i];
    if (e.type === 'quotes' && e.quotes) return e.quotes;
  }
  throw new Error('no quotes');
}

async function rtp(
  rounds: number,
  decide: (q: Quote[], blocksPlaced: number) => BlockId | 'cash',
): Promise<number> {
  const bet = BET_LEVELS[3];
  let wagered = 0;
  let returned = 0;
  for (let i = 0; i < rounds; i++) {
    const s = new LocalGameServer();
    let res = await s.play(bet, 'BASE');
    wagered += bet;
    while (res.round.active) {
      const quotes = latestQuotes(res.round.state);
      const choice = decide(quotes, res.round.blocksPlaced);
      if (choice === 'cash') {
        res = await s.endRound();
        break;
      }
      res = await s.action('DECISION', { type: 'place', block: choice });
    }
    if (res.round.active) res = await s.endRound();
    else await s.endRound();
    returned += res.round.payout;
  }
  return returned / wagered;
}

test('RTP bounds for standard policies', async () => {
  const n = 100_000;
  const cashMedium = await rtp(n, (_q, placed) =>
    placed >= 1 ? 'cash' : 'medium',
  );
  const alwaysSafe = await rtp(n, (_q, placed) =>
    placed >= 1 ? 'cash' : 'safe',
  );
  const alwaysHeavy = await rtp(n, (_q, placed) =>
    placed >= 1 ? 'cash' : 'heavy',
  );
  const mixed = await rtp(n, (q, placed) => {
    if (placed >= 3) return 'cash';
    const live = q.find((x) => !x.disabled);
    return live ? live.block : 'cash';
  });
  for (const r of [cashMedium, alwaysSafe, alwaysHeavy, mixed]) {
    expect(r).toBeLessThanOrEqual(1);
  }
  expect(cashMedium).toBeGreaterThanOrEqual(0.96);
  expect(cashMedium).toBeLessThanOrEqual(0.98);
}, 120_000);
