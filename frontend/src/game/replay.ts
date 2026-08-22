/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import type { BookEvent } from '../rgs/types';

export type BookEventHandlers = {
  stack: (e: Extract<BookEvent, { type: 'stack' }>) => void | Promise<void>;
  bust: () => void | Promise<void>;
  setTotalWin: (e: Extract<BookEvent, { type: 'setTotalWin' }>) => void | Promise<void>;
  finalWin: (e: Extract<BookEvent, { type: 'finalWin' }>) => void | Promise<void>;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function playBookEvents(
  events: BookEvent[],
  handlers: BookEventHandlers,
  delayMs = 0,
): Promise<void> {
  for (const event of events) {
    if (event.type === 'stack') {
      if (delayMs > 0) await delay(delayMs);
      await handlers.stack(event);
    } else if (event.type === 'bust') {
      if (delayMs > 0) await delay(delayMs);
      await handlers.bust();
      if (delayMs > 0) await delay(delayMs);
    } else if (event.type === 'setTotalWin') {
      await handlers.setTotalWin(event);
    } else if (event.type === 'finalWin') {
      await handlers.finalWin(event);
    }
  }
}
