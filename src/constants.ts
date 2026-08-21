/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export const COPYRIGHT_NOTICE =
  'Copyright (c) 2026 jmenichole. All rights reserved.';

export const AMOUNT_SCALE = 1_000_000;
export const STARTING_BALANCE = 1000 * AMOUNT_SCALE;
export const BET_LEVELS = [
  0.1, 0.2, 0.5, 1, 2, 5, 10,
].map((n) => Math.round(n * AMOUNT_SCALE));

export const MAX_C = 15;
export const C_SPAN = 16;

export type BlockId = 'safe' | 'medium' | 'heavy';

export const BLOCKS: Record<
  BlockId,
  { id: BlockId; label: string; weight: number }
> = {
  safe: { id: 'safe', label: 'Safe', weight: 1 },
  medium: { id: 'medium', label: 'Medium', weight: 3 },
  heavy: { id: 'heavy', label: 'Heavy', weight: 7 },
};

export const BLOCK_ORDER: BlockId[] = ['safe', 'medium', 'heavy'];

export const HOUSE_EDGE_NUM = 98;
export const HOUSE_EDGE_DEN = 100;
export const MULTIPLIER_BPS_SCALE = 10_000;
export const STARTING_MULTIPLIER_BPS = 10_000;
