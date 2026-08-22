/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { computeEndRoundCredit, parseLookupWeights } from '../vite/devRgs';

test('parseLookupWeights reads probabilityWeight column', () => {
  const csv = `id,probabilityWeight,payoutMultiplier
1,10,104
2,90,0
`;
  expect(parseLookupWeights(csv)).toEqual([10, 90]);
});

test('parseLookupWeights reads headerless Engine lookup rows', () => {
  const csv = `1,10,104
2,90,0
`;
  expect(parseLookupWeights(csv)).toEqual([10, 90]);
});

test('computeEndRoundCredit floors bet * multiplier / 100', () => {
  expect(computeEndRoundCredit(2_000_000, 104)).toBe(2_080_000);
  expect(computeEndRoundCredit(1_000_000, 0)).toBe(0);
  expect(computeEndRoundCredit(150_000, 103)).toBe(154_500);
});
