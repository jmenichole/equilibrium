/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export type BookEvent =
  | {
      index: number;
      type: 'stack';
      weight: 1 | 3 | 7;
      totalWeight: number;
      payoutMultiplier: number;
    }
  | { index: number; type: 'bust' }
  | { index: number; type: 'setTotalWin'; amount: number }
  | { index: number; type: 'finalWin'; amount: number };
