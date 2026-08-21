/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test('index.html mounts #app and names jmenichole', () => {
  const html = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../index.html'),
    'utf8',
  );
  expect(html).toContain('Copyright (c) 2026 jmenichole. All rights reserved.');
  expect(html).toContain('id="app"');
  expect(html).toContain('/src/main.ts');
});
