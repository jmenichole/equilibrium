/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export function readRgsQuery(search: string): {
  rgsUrl: string;
  sessionID: string;
} {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  return {
    sessionID: params.get('sessionID') ?? '',
    rgsUrl: params.get('rgs_url') ?? '',
  };
}
