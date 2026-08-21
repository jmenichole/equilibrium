/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { formatAmount } from '../../src/client/format';

test('formats integer 1e6-scale amounts with 2 decimals', () => {
  expect(formatAmount(1_000_000_000)).toBe('1,000.00');
  expect(formatAmount(100_000)).toBe('0.10');
});
