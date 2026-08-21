/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { HOUSE_EDGE_DEN, HOUSE_EDGE_NUM, MULTIPLIER_BPS_SCALE } from '../constants';

export function nextMultiplierBps(
  currentBps: number,
  remain: number,
  fit: number,
): number {
  if (fit <= 0 || remain <= 0) {
    throw new Error('ERR_ZERO_SURVIVE');
  }
  return Math.floor(
    (currentBps * HOUSE_EDGE_NUM * remain) / (HOUSE_EDGE_DEN * fit),
  );
}

export function payoutAmount(betAmount: number, multiplierBps: number): number {
  return Math.floor((betAmount * multiplierBps) / MULTIPLIER_BPS_SCALE);
}

export function displayMultiplier(multiplierBps: number): string {
  const hundredths = Math.floor(multiplierBps / 100);
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  return `${whole}.${frac.toString().padStart(2, '0')}`;
}
