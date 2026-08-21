/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { AMOUNT_SCALE } from '../constants';

export function formatAmount(amount: number): string {
  const whole = amount / AMOUNT_SCALE;
  const [i, f] = whole.toFixed(2).split('.');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${f}`;
}
