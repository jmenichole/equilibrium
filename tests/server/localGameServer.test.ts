/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { describe, expect, test } from 'vitest';
import { BET_LEVELS, STARTING_BALANCE } from '../../src/constants';
import { LocalGameServer } from '../../src/server/localGameServer';

const bet = BET_LEVELS[3]; // 1.00

describe('LocalGameServer', () => {
  test('authenticate returns starting balance and betLevels', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const auth = await s.authenticate();
    expect(auth.balance.amount).toBe(STARTING_BALANCE);
    expect(auth.config.betLevels).toEqual(BET_LEVELS);
    expect(auth.round).toBeNull();
  });

  test('play debits and returns quotes; C is not on the round', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const res = await s.play(bet, 'BASE');
    expect(res.status.statusCode).toBe('SUCCESS');
    expect(res.balance.amount).toBe(STARTING_BALANCE - bet);
    expect(res.round.active).toBe(true);
    expect(res.round.state[0]?.type).toBe('quotes');
    expect(JSON.stringify(res.round)).not.toMatch(/"C"/);
  });

  test('play while active is ERR_BE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const res = await s.play(bet, 'BASE');
    expect(res.status.statusCode).toBe('ERR_BE');
  });

  test('invalid bet level is ERR_GE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const res = await s.play(123, 'BASE');
    expect(res.status.statusCode).toBe('ERR_GE');
  });

  test('insufficient balance is ERR_IPB', async () => {
    const s = new LocalGameServer({ rollC: () => 0 });
    await s.resetBalance();
    // drain: 1000.00 starting; 10.00 bets — every block busts, debit never returned
    for (let i = 0; i < 100; i++) {
      const r = await s.play(BET_LEVELS[6], 'BASE');
      if (r.status.statusCode !== 'SUCCESS') break;
      await s.action('DECISION', { type: 'place', block: 'safe' });
      await s.endRound();
    }
    const res = await s.play(BET_LEVELS[6], 'BASE');
    expect(res.status.statusCode).toBe('ERR_IPB');
  });

  test('C=0 busts the first Safe and endRound pays 0', async () => {
    const s = new LocalGameServer({ rollC: () => 0 });
    await s.play(bet, 'BASE');
    const placed = await s.action('DECISION', { type: 'place', block: 'safe' });
    expect(placed.round.active).toBe(false);
    expect(placed.round.state.some((e) => e.type === 'bust')).toBe(true);
    const ended = await s.endRound();
    expect(ended.balance.amount).toBe(STARTING_BALANCE - bet);
    expect(ended.round.payout).toBe(0);
  });

  test('C=15 accepts Safe then cash-out credits payout', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const placed = await s.action('DECISION', { type: 'place', block: 'safe' });
    expect(placed.round.active).toBe(true);
    expect(placed.round.blocksPlaced).toBe(1);
    const ended = await s.endRound();
    expect(ended.round.state.some((e) => e.type === 'cashedOut')).toBe(true);
    expect(ended.balance.amount).toBe(STARTING_BALANCE - bet + ended.round.payout);
    expect(ended.round.payout).toBeGreaterThan(0);
  });

  test('endRound before first block is ERR_GE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const res = await s.endRound();
    expect(res.status.statusCode).toBe('ERR_GE');
  });

  test('endRound with no active round is SUCCESS no-op', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const res = await s.endRound();
    expect(res.status.statusCode).toBe('SUCCESS');
    expect(res.balance.amount).toBe(STARTING_BALANCE);
  });

  test('0% Heavy at high weight is ERR_GE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    for (let i = 0; i < 10; i++) {
      const r = await s.action('DECISION', { type: 'place', block: 'safe' });
      if (!r.round.active) break;
    }
    const res = await s.action('DECISION', { type: 'place', block: 'heavy' });
    expect(res.status.statusCode).toBe('ERR_GE');
  });

  test('resetBalance voids a round and restores 1000.00', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const res = await s.resetBalance();
    expect(res.balance.amount).toBe(STARTING_BALANCE);
    const again = await s.play(bet, 'BASE');
    expect(again.status.statusCode).toBe('SUCCESS');
  });
});
