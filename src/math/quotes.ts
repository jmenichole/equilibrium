/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import {
  BLOCK_ORDER,
  BLOCKS,
  C_SPAN,
  type BlockId,
} from '../constants';
import { nextMultiplierBps } from './multiplier';

export function remainCount(currentWeight: number): number {
  return Math.max(0, C_SPAN - currentWeight);
}

export function fitCount(currentWeight: number, blockWeight: number): number {
  return Math.max(0, C_SPAN - (currentWeight + blockWeight));
}

export function pSurvive(currentWeight: number, blockWeight: number): number {
  const remain = remainCount(currentWeight);
  if (remain === 0) return 0;
  return fitCount(currentWeight, blockWeight) / remain;
}

export type Quote = {
  block: BlockId;
  weight: number;
  remainCount: number;
  fitCount: number;
  pSurvive: number;
  nextMultiplierBps: number;
  disabled: boolean;
};

export function buildQuotes(
  currentWeight: number,
  currentBps: number,
): Quote[] {
  return BLOCK_ORDER.map((block) => {
    const weight = BLOCKS[block].weight;
    const remain = remainCount(currentWeight);
    const fit = fitCount(currentWeight, weight);
    const p = pSurvive(currentWeight, weight);
    const disabled = p <= 0;
    return {
      block,
      weight,
      remainCount: remain,
      fitCount: fit,
      pSurvive: p,
      nextMultiplierBps: disabled ? 0 : nextMultiplierBps(currentBps, remain, fit),
      disabled,
    };
  });
}
