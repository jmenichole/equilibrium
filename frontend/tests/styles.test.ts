/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../src/styles.css'),
  'utf8',
);

test('library theme keeps readable ink and cream contrast', () => {
  expect(css).toMatch(/#hint\s*\{[^}]*color:\s*#2a231c/s);
  expect(css).toMatch(/#error\s*\{[^}]*color:\s*#7a1a1a/s);
  expect(css).toMatch(/#info-panel\s*\{[^}]*color:\s*#e8dcc8/s);
  expect(css).not.toMatch(/#hint\s*\{[^}]*color:\s*#c8a84e/s);
});
