/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

const AMOUNT_SCALE = 1_000_000;

export function displayPayoutX(payoutMultiplier: number): string {
  const hundredths = Math.floor(payoutMultiplier);
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  return `${whole}.${frac.toString().padStart(2, '0')}`;
}

export function formatRgsAmount(amount: number): string {
  const hundredths = Math.floor(amount / (AMOUNT_SCALE / 100));
  const credits = hundredths / 100;
  const [i, f] = credits.toFixed(2).split('.');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${f}`;
}
