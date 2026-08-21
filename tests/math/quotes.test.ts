/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { describe, expect, test } from 'vitest';
import { fitCount, pSurvive, remainCount } from '../../src/math/quotes';

describe('remainCount / fitCount', () => {
  test('at weight 0, 16 possible C values (0..15)', () => {
    expect(remainCount(0)).toBe(16);
  });

  test('Safe w=1 at x=0 needs C>=1 → 15 fits', () => {
    expect(fitCount(0, 1)).toBe(15);
    expect(pSurvive(0, 1)).toBe(15 / 16);
  });

  test('Medium w=3 at x=0 → 13/16', () => {
    expect(fitCount(0, 3)).toBe(13);
    expect(pSurvive(0, 3)).toBe(13 / 16);
  });

  test('Heavy w=7 at x=0 → 9/16', () => {
    expect(fitCount(0, 7)).toBe(9);
    expect(pSurvive(0, 7)).toBe(9 / 16);
  });

  test('at x=10, remain is 6 (10..15); Heavy +7 cannot fit', () => {
    expect(remainCount(10)).toBe(6);
    expect(fitCount(10, 7)).toBe(0);
    expect(pSurvive(10, 7)).toBe(0);
  });

  test('pSurvive is 0 when remainCount is 0', () => {
    expect(remainCount(16)).toBe(0);
    expect(pSurvive(16, 1)).toBe(0);
  });
});
