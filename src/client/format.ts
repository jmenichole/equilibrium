/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { AMOUNT_SCALE } from '../constants';

export function formatAmount(amount: number): string {
  const hundredths = Math.floor(amount / (AMOUNT_SCALE / 100));
  const credits = hundredths / 100;
  const [i, f] = credits.toFixed(2).split('.');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${f}`;
}
