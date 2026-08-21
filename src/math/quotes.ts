/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { C_SPAN } from '../constants';

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
