/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { ScaleView } from '../../src/client/scaleView';

test('wobble intensity follows weight/15 and never takes a capacity argument', () => {
  document.body.innerHTML = '<div id="slot"></div>';
  const view = new ScaleView(document.getElementById('slot')!);
  view.setState({ weight: 0, phase: 'playing' });
  const platform = document.getElementById('scale-platform')!;
  expect(platform.style.getPropertyValue('--wobble')).toBe('0');
  view.setState({ weight: 15, phase: 'playing' });
  expect(platform.style.getPropertyValue('--wobble')).toBe('1');
  view.setState({ weight: 5, phase: 'playing' });
  expect(Number(platform.style.getPropertyValue('--wobble'))).toBeCloseTo(5 / 15);
  expect(document.getElementById('scale-stack')!.children.length).toBeGreaterThan(0);
  expect(view.setState.length).toBe(1);
});
