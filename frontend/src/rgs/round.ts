/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import type { BookEvent } from './types';

export function readRoundState(round: {
  state?: unknown;
  events?: unknown;
} | null | undefined): BookEvent[] {
  const raw = round?.state ?? round?.events;
  return Array.isArray(raw) ? (raw as BookEvent[]) : [];
}
