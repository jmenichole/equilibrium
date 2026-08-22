/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export function rgsErrorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isStuckRoundError(error: unknown): boolean {
  const text = rgsErrorText(error);
  return /already active|ERR_PAB|already has bet|player already has bet/i.test(
    text,
  );
}

export function isNoActiveRoundError(error: unknown): boolean {
  const text = rgsErrorText(error);
  return /no active round|ERR_NAR/i.test(text);
}
