/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { describe, expect, test } from 'vitest';
import {
  displayMultiplier,
  nextMultiplierBps,
  payoutAmount,
} from '../../src/math/multiplier';

describe('nextMultiplierBps', () => {
  test('first Medium: floor(10000 * 98 * 16 / (100 * 13))', () => {
    expect(nextMultiplierBps(10_000, 16, 13)).toBe(
      Math.floor((10_000 * 98 * 16) / (100 * 13)),
    );
  });

  test('rejects fit=0', () => {
    expect(() => nextMultiplierBps(10_000, 6, 0)).toThrow();
  });
});

describe('payoutAmount', () => {
  test('1.00 bet at 12061 bps', () => {
    const bps = Math.floor((10_000 * 98 * 16) / (100 * 13));
    expect(payoutAmount(1_000_000, bps)).toBe(
      Math.floor((1_000_000 * bps) / 10_000),
    );
  });
});

describe('displayMultiplier', () => {
  test('truncates to 2 decimals, does not round up', () => {
    expect(displayMultiplier(12061)).toBe('1.20');
  });
});
