/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { displayPayoutX, formatRgsAmount } from '../src/rgs/display';

test('displayPayoutX truncates 104 → 1.04', () => {
  expect(displayPayoutX(104)).toBe('1.04');
});

test('formatRgsAmount floors like the pitch demo', () => {
  expect(formatRgsAmount(1_000_000)).toBe('1.00');
  expect(formatRgsAmount(1_040_000)).toBe('1.04');
});
