/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { EquilibriumApp } from './client/app';
import { LocalGameServer } from './server/localGameServer';
import './styles.css';

const root = document.getElementById('app');
if (!root) throw new Error('missing #app');
void new EquilibriumApp(root, new LocalGameServer()).mount();
