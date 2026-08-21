/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOTICE = 'Copyright (c) 2026 jmenichole. All rights reserved.';

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'library']);

function walk(dir: string, acc: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|css|html|yml|py)$/.test(name) || name === 'LICENSE') acc.push(p);
  }
  return acc;
}

test('LICENSE and all source/test files name jmenichole as copyright holder', () => {
  const files = [
    join(ROOT, 'LICENSE'),
    ...walk(join(ROOT, 'src')),
    ...walk(join(ROOT, 'tests')),
    ...walk(join(ROOT, '.github')),
    ...walk(join(ROOT, 'frontend')),
    ...walk(join(ROOT, 'math')),
  ];
  const html = join(ROOT, 'index.html');
  try {
    readFileSync(html);
    files.push(html);
  } catch {
    /* index.html added in a later task; LICENSE must already exist */
  }
  const viteConfig = join(ROOT, 'vite.config.ts');
  try {
    readFileSync(viteConfig);
    files.push(viteConfig);
  } catch {
    /* vite.config.ts may not exist yet during RED phase */
  }
  expect(files.some((f) => f.endsWith('LICENSE'))).toBe(true);
  expect(readFileSync(join(ROOT, 'LICENSE'), 'utf8')).toContain(NOTICE);
  for (const f of files) {
    if (f.endsWith('LICENSE')) continue;
    expect(readFileSync(f, 'utf8'), f).toContain(NOTICE);
  }
});
