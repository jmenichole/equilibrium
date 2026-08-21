/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { readRgsQuery } from '../src/rgs/query';

test('readRgsQuery parses sessionID and rgs_url', () => {
  expect(
    readRgsQuery('?sessionID=abc&rgs_url=https://rgs.example/v1'),
  ).toEqual({
    sessionID: 'abc',
    rgsUrl: 'https://rgs.example/v1',
  });
});

test('readRgsQuery returns empty strings for missing params', () => {
  expect(readRgsQuery('')).toEqual({
    sessionID: '',
    rgsUrl: '',
  });
});
