/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
});
