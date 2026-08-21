/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { devRgs } from './vite/devRgs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  plugins: [
    devRgs({ mathDir: path.resolve(__dirname, '../math/library') }),
  ],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
});
