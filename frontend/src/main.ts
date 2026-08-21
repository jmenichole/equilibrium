/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import './styles.css';
import { EquilibriumEngineApp } from './game/app';
import { createRgsFromWindow } from './rgs/client';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount point');
}

const app = new EquilibriumEngineApp(root, createRgsFromWindow());
void app.mount();
