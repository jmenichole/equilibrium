# Equilibrium Pitch Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable static-web pitch demo of Equilibrium (one-stack scale, hidden capacity, play money) with a Stake-shaped in-process `GameServer`.

**Architecture:** Vite + TypeScript SPA. `src/server/` owns the ledger, secret `C`, quotes, and settle. `src/client/` renders HUD and an SVG scale from server events only. Tests (Vitest) lock math, engine, HUD rules, and the jmenichole copyright header.

**Tech Stack:** TypeScript 5.9, Vite 7, Vitest 3, happy-dom. No React, no Pixi, no `stake-engine` package.

## Global Constraints

- Copyright line on every `.ts`, `.css`, `.html`, `.yml` source file and `LICENSE`: `Copyright (c) 2026 jmenichole. All rights reserved.`
- `package.json` `"license": "UNLICENSED"`, `"author": "jmenichole"`
- Amounts are integers; `1_000_000` = `1.00` credit
- Secret `C` uniform on `{0…15}`; never in events, DOM, or logs
- Blocks: Safe `1`, Medium `3`, Heavy `7`
- `nextMultiplierBps = floor(currentBps * 98 * remainCount / (100 * fitCount))`
- `payout = floor(betAmount * multiplierBps / 10000)`
- Cash-out is `endRound()` after ≥1 surviving block; bust pays `0`
- Wobble uses `currentWeight / 15` only
- Footer: `Pitch demo — not on Stake/Bink. © 2026 jmenichole.`
- Starting balance `1_000_000_000` (display `1,000.00`); betLevels `[100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000]`
- Refresh resets everything (no persistence)

## File map

| Path | Responsibility |
| --- | --- |
| `LICENSE` | Proprietary notice, jmenichole 2026 |
| `package.json`, `tsconfig.json`, `vite.config.ts` | Tooling; `base: './'` |
| `index.html` | Mount node + copyright comment |
| `src/constants.ts` | Amounts, blocks, scales, copyright string |
| `src/math/quotes.ts` | `remainCount`, `fitCount`, `pSurvive`, `buildQuotes` |
| `src/math/multiplier.ts` | `nextMultiplierBps`, `payoutAmount`, `displayMultiplier` |
| `src/server/types.ts` | `GameServer`, `Round`, `BookEvent`, `Balance` |
| `src/server/localGameServer.ts` | In-process RGS-shaped engine; `C` stays private |
| `src/client/format.ts` | Integer amount ↔ display string |
| `src/client/scaleView.ts` | SVG platform, lerp blocks, weight-only wobble |
| `src/client/app.ts` | HUD, buttons, event playback |
| `src/styles.css` | Dark charcoal/gold layout |
| `src/main.ts` | Boot |
| `tests/**` | Vitest |
| `.github/workflows/pages.yml` | GitHub Pages from `npm run build` |
| `README.md` | How to run / pitch |

---

### Task 1: Scaffold, LICENSE, copyright gate

**Files:**
- Create: `LICENSE`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/constants.ts`
- Create: `tests/copyright.test.ts`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: `COPYRIGHT_NOTICE` in `src/constants.ts` equal to `Copyright (c) 2026 jmenichole. All rights reserved.`

- [ ] **Step 1: Write the failing copyright test**

Create `tests/copyright.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOTICE = 'Copyright (c) 2026 jmenichole. All rights reserved.';

function walk(dir: string, acc: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|css|html|yml)$/.test(name) || name === 'LICENSE') acc.push(p);
  }
  return acc;
}

test('LICENSE and all source/test files name jmenichole as copyright holder', () => {
  const files = [
    join(ROOT, 'LICENSE'),
    ...walk(join(ROOT, 'src')),
    ...walk(join(ROOT, 'tests')),
    ...walk(join(ROOT, '.github')),
  ];
  const html = join(ROOT, 'index.html');
  try {
    readFileSync(html);
    files.push(html);
  } catch {
    /* index.html added in a later task; LICENSE must already exist */
  }
  expect(files.some((f) => f.endsWith('LICENSE'))).toBe(true);
  expect(readFileSync(join(ROOT, 'LICENSE'), 'utf8')).toContain(NOTICE);
  for (const f of files) {
    if (f.endsWith('LICENSE')) continue;
    expect(readFileSync(f, 'utf8'), f).toContain(NOTICE);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm init -y && npm install -D vitest typescript vite happy-dom && npx vitest run tests/copyright.test.ts`

Expected: FAIL (no `LICENSE`, or missing notice). If `npm` has no lockfile yet, creating `package.json` first is allowed as config (not production code). Do **not** add `src/` production modules yet.

Minimal `package.json` (config):

```json
{
  "name": "equilibrium",
  "private": true,
  "version": "0.1.0",
  "license": "UNLICENSED",
  "author": "jmenichole",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

`vite.config.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

`.gitignore`: `node_modules`, `dist`, `.DS_Store`

- [ ] **Step 3: Write LICENSE, constants, make copyright test pass**

`LICENSE`:

```
Copyright (c) 2026 jmenichole. All rights reserved.

This source code and all associated files are proprietary.
Unauthorized copying, modification, distribution, or use is
prohibited without prior written permission from jmenichole.

Equilibrium is an original game by jmenichole.
```

`src/constants.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export const COPYRIGHT_NOTICE =
  'Copyright (c) 2026 jmenichole. All rights reserved.';

export const AMOUNT_SCALE = 1_000_000;
export const STARTING_BALANCE = 1000 * AMOUNT_SCALE;
export const BET_LEVELS = [
  0.1, 0.2, 0.5, 1, 2, 5, 10,
].map((n) => Math.round(n * AMOUNT_SCALE));

export const MAX_C = 15;
export const C_SPAN = 16;

export type BlockId = 'safe' | 'medium' | 'heavy';

export const BLOCKS: Record<
  BlockId,
  { id: BlockId; label: string; weight: number }
> = {
  safe: { id: 'safe', label: 'Safe', weight: 1 },
  medium: { id: 'medium', label: 'Medium', weight: 3 },
  heavy: { id: 'heavy', label: 'Heavy', weight: 7 },
};

export const BLOCK_ORDER: BlockId[] = ['safe', 'medium', 'heavy'];

export const HOUSE_EDGE_NUM = 98;
export const HOUSE_EDGE_DEN = 100;
export const MULTIPLIER_BPS_SCALE = 10_000;
export const STARTING_MULTIPLIER_BPS = 10_000;
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run tests/copyright.test.ts`

Expected: PASS. `src/constants.ts` and `vite.config.ts` contain the notice. `index.html` and `.github` are still optional.

- [ ] **Step 5: Commit**

```bash
git add LICENSE package.json package-lock.json tsconfig.json vite.config.ts .gitignore src/constants.ts tests/copyright.test.ts
git commit -m "chore: scaffold Vite/Vitest with jmenichole copyright gate"
```

---

### Task 2: Quote math

**Files:**
- Create: `src/math/quotes.ts`
- Create: `tests/math/quotes.test.ts`

**Interfaces:**
- Consumes: `BLOCKS`, `BLOCK_ORDER`, `C_SPAN`, `BlockId` from `src/constants.ts`; `nextMultiplierBps` is **not** used yet — quotes tests in this task only cover `remainCount` / `fitCount` / `pSurvive`. `buildQuotes` is Task 3 after multiplier exists.
- Produces:
  - `remainCount(currentWeight: number): number`
  - `fitCount(currentWeight: number, blockWeight: number): number`
  - `pSurvive(currentWeight: number, blockWeight: number): number`

- [ ] **Step 1: Write the failing test**

`tests/math/quotes.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { describe, expect, test } from 'vitest';
import { fitCount, pSurvive, remainCount } from '../../src/math/quotes';

describe('remainCount / fitCount', () => {
  test('at weight 0, 16 possible C values (0..15)', () => {
    expect(remainCount(0)).toBe(16);
  });

  test('Safe w=1 at x=0 needs C>=1 → 15 fits', () => {
    expect(fitCount(0, 1)).toBe(15);
    expect(pSurvive(0, 1)).toBe(15 / 16);
  });

  test('Medium w=3 at x=0 → 13/16', () => {
    expect(fitCount(0, 3)).toBe(13);
    expect(pSurvive(0, 3)).toBe(13 / 16);
  });

  test('Heavy w=7 at x=0 → 9/16', () => {
    expect(fitCount(0, 7)).toBe(9);
    expect(pSurvive(0, 7)).toBe(9 / 16);
  });

  test('at x=10, remain is 6 (10..15); Heavy +7 cannot fit', () => {
    expect(remainCount(10)).toBe(6);
    expect(fitCount(10, 7)).toBe(0);
    expect(pSurvive(10, 7)).toBe(0);
  });

  test('pSurvive is 0 when remainCount is 0', () => {
    expect(remainCount(16)).toBe(0);
    expect(pSurvive(16, 1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/math/quotes.test.ts`

Expected: FAIL — `Cannot find module` or `remainCount is not a function`.

- [ ] **Step 3: Write minimal implementation**

`src/math/quotes.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { C_SPAN } from '../constants';

export function remainCount(currentWeight: number): number {
  return Math.max(0, C_SPAN - currentWeight);
}

export function fitCount(currentWeight: number, blockWeight: number): number {
  return Math.max(0, C_SPAN - (currentWeight + blockWeight));
}

export function pSurvive(currentWeight: number, blockWeight: number): number {
  const remain = remainCount(currentWeight);
  if (remain === 0) return 0;
  return fitCount(currentWeight, blockWeight) / remain;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/math/quotes.test.ts tests/copyright.test.ts`

Expected: PASS (quotes.ts has the copyright header).

- [ ] **Step 5: Commit**

```bash
git add src/math/quotes.ts tests/math/quotes.test.ts
git commit -m "feat: add public survive-probability math for block quotes"
```

---

### Task 3: Multiplier and payout

**Files:**
- Create: `src/math/multiplier.ts`
- Create: `src/math/quotesBuild.ts` — skip; add `buildQuotes` to `src/math/quotes.ts`
- Modify: `src/math/quotes.ts`
- Create: `tests/math/multiplier.test.ts`
- Modify: `tests/math/quotes.test.ts`

**Interfaces:**
- Consumes: `remainCount`, `fitCount`, `pSurvive`; `HOUSE_EDGE_NUM/DEN`, `MULTIPLIER_BPS_SCALE`, `BLOCKS`, `BLOCK_ORDER`, `STARTING_MULTIPLIER_BPS`
- Produces:
  - `nextMultiplierBps(currentBps: number, remain: number, fit: number): number`
  - `payoutAmount(betAmount: number, multiplierBps: number): number`
  - `displayMultiplier(multiplierBps: number): string` — 2 decimal places, truncated
  - `buildQuotes(currentWeight: number, currentBps: number): Quote[]`
  - `export type Quote = { block: BlockId; weight: number; remainCount: number; fitCount: number; pSurvive: number; nextMultiplierBps: number; disabled: boolean }`

- [ ] **Step 1: Write the failing tests**

`tests/math/multiplier.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { describe, expect, test } from 'vitest';
import {
  displayMultiplier,
  nextMultiplierBps,
  payoutAmount,
} from '../../src/math/multiplier';

describe('nextMultiplierBps', () => {
  test('first Medium: floor(10000 * 98 * 16 / (100 * 13))', () => {
    expect(nextMultiplierBps(10_000, 16, 13)).toBe(
      Math.floor((10_000 * 98 * 16) / (100 * 13)),
    );
  });

  test('rejects fit=0', () => {
    expect(() => nextMultiplierBps(10_000, 6, 0)).toThrow();
  });
});

describe('payoutAmount', () => {
  test('1.00 bet at 12061 bps', () => {
    const bps = Math.floor((10_000 * 98 * 16) / (100 * 13));
    expect(payoutAmount(1_000_000, bps)).toBe(
      Math.floor((1_000_000 * bps) / 10_000),
    );
  });
});

describe('displayMultiplier', () => {
  test('truncates to 2 decimals, does not round up', () => {
    expect(displayMultiplier(12061)).toBe('1.20');
  });
});
```

Add to `tests/math/quotes.test.ts`:

```ts
import { BLOCKS } from '../../src/constants';
import { buildQuotes } from '../../src/math/quotes';

test('buildQuotes at x=0 marks no block disabled except none', () => {
  const quotes = buildQuotes(0, 10_000);
  expect(quotes.map((q) => q.block)).toEqual(['safe', 'medium', 'heavy']);
  expect(quotes.every((q) => q.disabled === false)).toBe(true);
  expect(quotes.find((q) => q.block === 'medium')?.pSurvive).toBe(13 / 16);
});

test('buildQuotes disables Heavy at x=10', () => {
  const quotes = buildQuotes(10, 10_000);
  expect(quotes.find((q) => q.block === 'heavy')?.disabled).toBe(true);
  expect(quotes.find((q) => q.block === 'heavy')?.nextMultiplierBps).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/math/multiplier.test.ts tests/math/quotes.test.ts`

Expected: FAIL — missing `nextMultiplierBps` / `buildQuotes`.

- [ ] **Step 3: Write minimal implementation**

`src/math/multiplier.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { HOUSE_EDGE_DEN, HOUSE_EDGE_NUM, MULTIPLIER_BPS_SCALE } from '../constants';

export function nextMultiplierBps(
  currentBps: number,
  remain: number,
  fit: number,
): number {
  if (fit <= 0 || remain <= 0) {
    throw new Error('ERR_ZERO_SURVIVE');
  }
  return Math.floor(
    (currentBps * HOUSE_EDGE_NUM * remain) / (HOUSE_EDGE_DEN * fit),
  );
}

export function payoutAmount(betAmount: number, multiplierBps: number): number {
  return Math.floor((betAmount * multiplierBps) / MULTIPLIER_BPS_SCALE);
}

export function displayMultiplier(multiplierBps: number): string {
  const hundredths = Math.floor(multiplierBps / 100);
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  return `${whole}.${frac.toString().padStart(2, '0')}`;
}
```

Append to `src/math/quotes.ts`:

```ts
import { BLOCK_ORDER, BLOCKS, type BlockId } from '../constants';
import { nextMultiplierBps } from './multiplier';

export type Quote = {
  block: BlockId;
  weight: number;
  remainCount: number;
  fitCount: number;
  pSurvive: number;
  nextMultiplierBps: number;
  disabled: boolean;
};

export function buildQuotes(
  currentWeight: number,
  currentBps: number,
): Quote[] {
  return BLOCK_ORDER.map((block) => {
    const weight = BLOCKS[block].weight;
    const remain = remainCount(currentWeight);
    const fit = fitCount(currentWeight, weight);
    const p = pSurvive(currentWeight, weight);
    const disabled = p <= 0;
    return {
      block,
      weight,
      remainCount: remain,
      fitCount: fit,
      pSurvive: p,
      nextMultiplierBps: disabled ? 0 : nextMultiplierBps(currentBps, remain, fit),
      disabled,
    };
  });
}
```

Keep existing `remainCount` / `fitCount` / `pSurvive` exports. Put `Quote` + `buildQuotes` in the same file; imports at top of `quotes.ts` should be a single import block (merge with `C_SPAN` import — do not duplicate).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/math`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/math/multiplier.ts src/math/quotes.ts tests/math/multiplier.test.ts tests/math/quotes.test.ts
git commit -m "feat: add house-edge multiplier, payout, and quote builder"
```

---

### Task 4: LocalGameServer

**Files:**
- Create: `src/server/types.ts`
- Create: `src/server/localGameServer.ts`
- Create: `tests/server/localGameServer.test.ts`

**Interfaces:**
- Consumes: `buildQuotes`, `payoutAmount`, `BLOCKS`, `BET_LEVELS`, `STARTING_BALANCE`, `STARTING_MULTIPLIER_BPS`, `C_SPAN`
- Produces: `GameServer` with
  - `authenticate(): Promise<{ balance: Balance; config: GameConfig; round: Round | null }>`
  - `play(amount: number, mode: 'BASE'): Promise<EngineResponse>`
  - `action(kind: 'DECISION', payload: { type: 'place'; block: BlockId }): Promise<EngineResponse>`
  - `endRound(): Promise<EngineResponse>`
  - `resetBalance(): Promise<{ balance: Balance }>`
  - `Balance = { amount: number; currency: 'XSC' }`
  - `GameConfig = { betLevels: number[]; minBet: number; maxBet: number; stepBet: number }`
  - `StatusCode = 'SUCCESS' | 'ERR_BE' | 'ERR_IPB' | 'ERR_GE'`
  - `BookEvent` union: `quotes` | `blockAccepted` | `bust` | `cashedOut`
  - `Round` **public** fields only (no `C`): `{ betID, active, mode, amount, payout, multiplierBps, weight, blocksPlaced, state }`
  - Constructor `new LocalGameServer(opts?: { rollC?: () => number })`

- [ ] **Step 1: Write the failing tests**

`tests/server/localGameServer.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { describe, expect, test } from 'vitest';
import { BET_LEVELS, STARTING_BALANCE } from '../../src/constants';
import { LocalGameServer } from '../../src/server/localGameServer';

const bet = BET_LEVELS[3]; // 1.00

describe('LocalGameServer', () => {
  test('authenticate returns starting balance and betLevels', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const auth = await s.authenticate();
    expect(auth.balance.amount).toBe(STARTING_BALANCE);
    expect(auth.config.betLevels).toEqual(BET_LEVELS);
    expect(auth.round).toBeNull();
  });

  test('play debits and returns quotes; C is not on the round', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const res = await s.play(bet, 'BASE');
    expect(res.status.statusCode).toBe('SUCCESS');
    expect(res.balance.amount).toBe(STARTING_BALANCE - bet);
    expect(res.round.active).toBe(true);
    expect(res.round.state[0]?.type).toBe('quotes');
    expect(JSON.stringify(res.round)).not.toMatch(/"C"/);
  });

  test('play while active is ERR_BE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const res = await s.play(bet, 'BASE');
    expect(res.status.statusCode).toBe('ERR_BE');
  });

  test('invalid bet level is ERR_GE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const res = await s.play(123, 'BASE');
    expect(res.status.statusCode).toBe('ERR_GE');
  });

  test('insufficient balance is ERR_IPB', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.resetBalance();
    // drain: 1000.00 starting; 10.00 bets
    for (let i = 0; i < 100; i++) {
      const r = await s.play(BET_LEVELS[6], 'BASE');
      if (r.status.statusCode !== 'SUCCESS') break;
      await s.action('DECISION', { type: 'place', block: 'safe' });
      await s.endRound();
    }
    const res = await s.play(BET_LEVELS[6], 'BASE');
    expect(res.status.statusCode).toBe('ERR_IPB');
  });

  test('C=0 busts the first Safe and endRound pays 0', async () => {
    const s = new LocalGameServer({ rollC: () => 0 });
    await s.play(bet, 'BASE');
    const placed = await s.action('DECISION', { type: 'place', block: 'safe' });
    expect(placed.round.active).toBe(false);
    expect(placed.round.state.some((e) => e.type === 'bust')).toBe(true);
    const ended = await s.endRound();
    expect(ended.balance.amount).toBe(STARTING_BALANCE - bet);
    expect(ended.round.payout).toBe(0);
  });

  test('C=15 accepts Safe then cash-out credits payout', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const placed = await s.action('DECISION', { type: 'place', block: 'safe' });
    expect(placed.round.active).toBe(true);
    expect(placed.round.blocksPlaced).toBe(1);
    const ended = await s.endRound();
    expect(ended.round.state.some((e) => e.type === 'cashedOut')).toBe(true);
    expect(ended.balance.amount).toBe(STARTING_BALANCE - bet + ended.round.payout);
    expect(ended.round.payout).toBeGreaterThan(0);
  });

  test('endRound before first block is ERR_GE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const res = await s.endRound();
    expect(res.status.statusCode).toBe('ERR_GE');
  });

  test('endRound with no active round is SUCCESS no-op', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    const res = await s.endRound();
    expect(res.status.statusCode).toBe('SUCCESS');
    expect(res.balance.amount).toBe(STARTING_BALANCE);
  });

  test('0% Heavy at high weight is ERR_GE', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    for (let i = 0; i < 10; i++) {
      const r = await s.action('DECISION', { type: 'place', block: 'safe' });
      if (!r.round.active) break;
    }
    const res = await s.action('DECISION', { type: 'place', block: 'heavy' });
    expect(res.status.statusCode).toBe('ERR_GE');
  });

  test('resetBalance voids a round and restores 1000.00', async () => {
    const s = new LocalGameServer({ rollC: () => 15 });
    await s.play(bet, 'BASE');
    const res = await s.resetBalance();
    expect(res.balance.amount).toBe(STARTING_BALANCE);
    const again = await s.play(bet, 'BASE');
    expect(again.status.statusCode).toBe('SUCCESS');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/server/localGameServer.test.ts`

Expected: FAIL — cannot find `LocalGameServer`.

- [ ] **Step 3: Write types + LocalGameServer**

`src/server/types.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import type { BlockId } from '../constants';
import type { Quote } from '../math/quotes';

export type StatusCode = 'SUCCESS' | 'ERR_BE' | 'ERR_IPB' | 'ERR_GE';

export type Balance = { amount: number; currency: 'XSC' };

export type GameConfig = {
  betLevels: number[];
  minBet: number;
  maxBet: number;
  stepBet: number;
};

export type BookEvent =
  | { index: number; type: 'quotes'; quotes: Quote[] }
  | {
      index: number;
      type: 'blockAccepted';
      block: BlockId;
      weight: number;
      totalWeight: number;
      multiplierBps: number;
    }
  | { index: number; type: 'bust'; block: BlockId }
  | {
      index: number;
      type: 'cashedOut';
      payout: number;
      multiplierBps: number;
    };

export type Round = {
  betID: number;
  active: boolean;
  mode: 'BASE';
  amount: number;
  payout: number;
  multiplierBps: number;
  weight: number;
  blocksPlaced: number;
  state: BookEvent[];
};

export type EngineResponse = {
  status: { statusCode: StatusCode };
  balance: Balance;
  round: Round;
};

export type PlacePayload = { type: 'place'; block: BlockId };

export interface GameServer {
  authenticate(): Promise<{
    balance: Balance;
    config: GameConfig;
    round: Round | null;
  }>;
  play(amount: number, mode: 'BASE'): Promise<EngineResponse>;
  action(kind: 'DECISION', payload: PlacePayload): Promise<EngineResponse>;
  endRound(): Promise<EngineResponse>;
  resetBalance(): Promise<{ balance: Balance }>;
}
```

`src/server/localGameServer.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import {
  BET_LEVELS,
  BLOCKS,
  C_SPAN,
  STARTING_BALANCE,
  STARTING_MULTIPLIER_BPS,
  type BlockId,
} from '../constants';
import { buildQuotes } from '../math/quotes';
import { payoutAmount } from '../math/multiplier';
import type {
  Balance,
  BookEvent,
  EngineResponse,
  GameConfig,
  GameServer,
  PlacePayload,
  Round,
} from './types';

type InternalRound = Round & { C: number };

function defaultRollC(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % C_SPAN;
}

function emptyRound(): Round {
  return {
    betID: 0,
    active: false,
    mode: 'BASE',
    amount: 0,
    payout: 0,
    multiplierBps: STARTING_MULTIPLIER_BPS,
    weight: 0,
    blocksPlaced: 0,
    state: [],
  };
}

export class LocalGameServer implements GameServer {
  private balance: Balance = { amount: STARTING_BALANCE, currency: 'XSC' };
  private nextBetID = 1;
  private internal: InternalRound | null = null;
  private lastPublic: Round = emptyRound();
  private readonly rollC: () => number;

  constructor(opts?: { rollC?: () => number }) {
    this.rollC = opts?.rollC ?? defaultRollC;
  }

  private config(): GameConfig {
    return {
      betLevels: [...BET_LEVELS],
      minBet: BET_LEVELS[0],
      maxBet: BET_LEVELS[BET_LEVELS.length - 1],
      stepBet: BET_LEVELS[0],
    };
  }

  private publicRound(round: InternalRound | null): Round {
    if (!round) return this.lastPublic;
    const { C: _c, ...pub } = round;
    void _c;
    this.lastPublic = pub;
    return pub;
  }

  private ok(round: InternalRound | null, code: EngineResponse['status']['statusCode'] = 'SUCCESS'): EngineResponse {
    return {
      status: { statusCode: code },
      balance: { ...this.balance },
      round: this.publicRound(round),
    };
  }

  private fail(code: EngineResponse['status']['statusCode']): EngineResponse {
    return {
      status: { statusCode: code },
      balance: { ...this.balance },
      round: this.publicRound(this.internal),
    };
  }

  async authenticate() {
    return {
      balance: { ...this.balance },
      config: this.config(),
      round: this.internal ? this.publicRound(this.internal) : null,
    };
  }

  async play(amount: number, mode: 'BASE'): Promise<EngineResponse> {
    void mode;
    if (this.internal?.active) return this.fail('ERR_BE');
    if (!BET_LEVELS.includes(amount)) return this.fail('ERR_GE');
    if (this.balance.amount < amount) return this.fail('ERR_IPB');
    this.balance.amount -= amount;
    const quotes = buildQuotes(0, STARTING_MULTIPLIER_BPS);
    const state: BookEvent[] = [{ index: 0, type: 'quotes', quotes }];
    this.internal = {
      betID: this.nextBetID++,
      active: true,
      mode: 'BASE',
      amount,
      payout: 0,
      multiplierBps: STARTING_MULTIPLIER_BPS,
      weight: 0,
      blocksPlaced: 0,
      state,
      C: this.rollC(),
    };
    return this.ok(this.internal);
  }

  async action(kind: 'DECISION', payload: PlacePayload): Promise<EngineResponse> {
    void kind;
    const round = this.internal;
    if (!round?.active) return this.fail('ERR_GE');
    const block: BlockId = payload.block;
    const spec = BLOCKS[block];
    if (!spec) return this.fail('ERR_GE');
    const quotesNow = buildQuotes(round.weight, round.multiplierBps);
    const q = quotesNow.find((x) => x.block === block);
    if (!q || q.disabled) return this.fail('ERR_GE');
    const nextWeight = round.weight + spec.weight;
    if (nextWeight > round.C) {
      round.active = false;
      round.payout = 0;
      round.multiplierBps = 0;
      round.state = [
        ...round.state,
        { index: round.state.length, type: 'bust', block },
      ];
      return this.ok(round);
    }
    round.weight = nextWeight;
    round.multiplierBps = q.nextMultiplierBps;
    round.blocksPlaced += 1;
    const quotes = buildQuotes(round.weight, round.multiplierBps);
    round.state = [
      ...round.state,
      {
        index: round.state.length,
        type: 'blockAccepted',
        block,
        weight: spec.weight,
        totalWeight: round.weight,
        multiplierBps: round.multiplierBps,
      },
      { index: round.state.length + 1, type: 'quotes', quotes },
    ];
    return this.ok(round);
  }

  async endRound(): Promise<EngineResponse> {
    const round = this.internal;
    if (!round) return this.ok(null);
    if (!round.active) {
      this.internal = null;
      return this.ok(null);
    }
    if (round.blocksPlaced < 1) return this.fail('ERR_GE');
    const payout = payoutAmount(round.amount, round.multiplierBps);
    round.payout = payout;
    round.active = false;
    round.state = [
      ...round.state,
      {
        index: round.state.length,
        type: 'cashedOut',
        payout,
        multiplierBps: round.multiplierBps,
      },
    ];
    this.balance.amount += payout;
    this.internal = null;
    return this.ok(round);
  }

  async resetBalance() {
    this.internal = null;
    this.lastPublic = emptyRound();
    this.balance = { amount: STARTING_BALANCE, currency: 'XSC' };
    return { balance: { ...this.balance } };
  }
}
```

Fix `endRound` after bust: spec says client calls `endRound` after bust, which credits 0. After bust `round.active` is false but `internal` is still set. The implementation above treats `!round.active` as no-op and clears `internal` without paying (payout already 0, debit already happened). That matches.

`endRound` twice: second call `internal` is null → SUCCESS no-op. Matches.

Do not log `internal.C`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/server/localGameServer.test.ts tests/copyright.test.ts`

Expected: PASS. If the drain test is slow or flaky, keep `rollC: () => 15` so Safe always survives while draining.

- [ ] **Step 5: Commit**

```bash
git add src/server/types.ts src/server/localGameServer.ts tests/server/localGameServer.test.ts
git commit -m "feat: add Stake-shaped LocalGameServer with hidden capacity"
```

---

### Task 5: Monte Carlo RTP

**Files:**
- Create: `tests/math/monteCarlo.test.ts`

**Interfaces:**
- Consumes: `LocalGameServer`, `BET_LEVELS`, `BlockId`
- Produces: none (test only)

- [ ] **Step 1: Write the failing test**

`tests/math/monteCarlo.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { BET_LEVELS, type BlockId } from '../../src/constants';
import { LocalGameServer } from '../../src/server/localGameServer';
import type { Quote } from '../../src/math/quotes';

function latestQuotes(state: { type: string; quotes?: Quote[] }[]): Quote[] {
  for (let i = state.length - 1; i >= 0; i--) {
    const e = state[i];
    if (e.type === 'quotes' && e.quotes) return e.quotes;
  }
  throw new Error('no quotes');
}

async function rtp(
  rounds: number,
  decide: (q: Quote[], blocksPlaced: number) => BlockId | 'cash',
): Promise<number> {
  const bet = BET_LEVELS[3];
  let wagered = 0;
  let returned = 0;
  for (let i = 0; i < rounds; i++) {
    const s = new LocalGameServer();
    let res = await s.play(bet, 'BASE');
    wagered += bet;
    while (res.round.active) {
      const quotes = latestQuotes(res.round.state);
      const choice = decide(quotes, res.round.blocksPlaced);
      if (choice === 'cash') {
        res = await s.endRound();
        break;
      }
      res = await s.action('DECISION', { type: 'place', block: choice });
    }
    if (res.round.active) res = await s.endRound();
    else await s.endRound();
    returned += res.round.payout;
  }
  return returned / wagered;
}

test('RTP bounds for standard policies', async () => {
  const n = 100_000;
  const cashMedium = await rtp(n, (_q, placed) =>
    placed >= 1 ? 'cash' : 'medium',
  );
  const alwaysSafe = await rtp(n, (_q, placed) =>
    placed >= 1 ? 'cash' : 'safe',
  );
  const alwaysHeavy = await rtp(n, (_q, placed) =>
    placed >= 1 ? 'cash' : 'heavy',
  );
  const mixed = await rtp(n, (q, placed) => {
    if (placed >= 3) return 'cash';
    const live = q.find((x) => !x.disabled);
    return live ? live.block : 'cash';
  });
  for (const r of [cashMedium, alwaysSafe, alwaysHeavy, mixed]) {
    expect(r).toBeLessThanOrEqual(1);
  }
  expect(cashMedium).toBeGreaterThanOrEqual(0.96);
  expect(cashMedium).toBeLessThanOrEqual(0.98);
}, 120_000);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/math/monteCarlo.test.ts`

Expected: FAIL only if RTP is outside bounds (implementation bug) or the file/assert is new and a helper throws. If it **passes immediately**, that is acceptable for a statistical test of existing code — do not weaken the bounds. If it fails because `endRound` after bust returns `payout` from `lastPublic` incorrectly, fix `endRound` to return the busted round’s public copy (set `lastPublic` before clearing `internal`). That production fix belongs here only after this test fails for that reason.

If the test passes first run because Task 4 already meets RTP, keep the test as a regression gate and note it in the commit.

- [ ] **Step 3: Fix engine if RTP or payout accounting is wrong**

If bust `endRound` reports the wrong `round.payout`, change `endRound` so that when `round.active === false` and `blocksPlaced` may be 0 (bust), it still returns that round as `lastPublic` then clears `internal`:

```ts
async endRound(): Promise<EngineResponse> {
  const round = this.internal;
  if (!round) return this.ok(null);
  if (!round.active) {
    const snapshot = this.publicRound(round);
    this.internal = null;
    return {
      status: { statusCode: 'SUCCESS' },
      balance: { ...this.balance },
      round: snapshot,
    };
  }
  if (round.blocksPlaced < 1) return this.fail('ERR_GE');
  const payout = payoutAmount(round.amount, round.multiplierBps);
  round.payout = payout;
  round.active = false;
  round.state = [
    ...round.state,
    {
      index: round.state.length,
      type: 'cashedOut',
      payout,
      multiplierBps: round.multiplierBps,
    },
  ];
  this.balance.amount += payout;
  const snapshot = this.publicRound(round);
  this.internal = null;
  return {
    status: { statusCode: 'SUCCESS' },
    balance: { ...this.balance },
    round: snapshot,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/math/monteCarlo.test.ts tests/server/localGameServer.test.ts`

Expected: PASS. `cashMedium` in `[0.96, 0.98]`. All policies `<= 1`.

- [ ] **Step 5: Commit**

```bash
git add tests/math/monteCarlo.test.ts src/server/localGameServer.ts
git commit -m "test: lock RTP bounds for cash-out policies"
```

---

### Task 6: Amount formatting and HUD (no scale yet)

**Files:**
- Create: `src/client/format.ts`
- Create: `src/client/app.ts`
- Create: `src/styles.css`
- Create: `tests/client/format.test.ts`
- Create: `tests/client/app.test.ts`
- Modify: `vite.config.ts` (happy-dom for `tests/client`)

**Interfaces:**
- Consumes: `GameServer`, `displayMultiplier`, `BLOCKS`, `BET_LEVELS`
- Produces:
  - `formatAmount(amount: number): string` — e.g. `1,000.00`
  - `class EquilibriumApp { constructor(root: HTMLElement, server: GameServer); mount(): Promise<void> }`
  - Root inner DOM uses these ids: `balance`, `bet-levels`, `btn-safe`, `btn-medium`, `btn-heavy`, `btn-cashout`, `btn-reset`, `hint`, `footer`, `play-money`

- [ ] **Step 1: Write failing format + HUD tests**

`tests/client/format.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { formatAmount } from '../../src/client/format';

test('formats integer 1e6-scale amounts with 2 decimals', () => {
  expect(formatAmount(1_000_000_000)).toBe('1,000.00');
  expect(formatAmount(100_000)).toBe('0.10');
});
```

`tests/client/app.test.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { beforeEach, expect, test } from 'vitest';
import { BET_LEVELS } from '../../src/constants';
import { EquilibriumApp } from '../../src/client/app';
import { LocalGameServer } from '../../src/server/localGameServer';

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

test('shows PLAY MONEY, footer copyright, cashout disabled at start', async () => {
  const app = new EquilibriumApp(
    document.getElementById('app')!,
    new LocalGameServer({ rollC: () => 15 }),
  );
  await app.mount();
  expect(document.getElementById('play-money')?.textContent).toMatch(/PLAY MONEY/);
  expect(document.getElementById('footer')?.textContent).toContain(
    'Pitch demo — not on Stake/Bink. © 2026 jmenichole.',
  );
  expect((document.getElementById('btn-cashout') as HTMLButtonElement).disabled).toBe(
    true,
  );
});

test('after play, bet levels lock and cashout stays disabled until a survivor', async () => {
  const app = new EquilibriumApp(
    document.getElementById('app')!,
    new LocalGameServer({ rollC: () => 15 }),
  );
  await app.mount();
  const betBtn = document.querySelector(`[data-bet="${BET_LEVELS[3]}"]`) as HTMLButtonElement;
  betBtn.click();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  expect((document.getElementById('btn-cashout') as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(betBtn.disabled).toBe(true);
});

test('0% heavy is disabled when it cannot fit', async () => {
  const server = new LocalGameServer({ rollC: () => 15 });
  const app = new EquilibriumApp(document.getElementById('app')!, server);
  await app.mount();
  (document.querySelector(`[data-bet="${BET_LEVELS[3]}"]`) as HTMLButtonElement).click();
  await new Promise((r) => setTimeout(r, 0));
  for (let i = 0; i < 10; i++) {
    const safe = document.getElementById('btn-safe') as HTMLButtonElement;
    if (safe.disabled) break;
    safe.click();
    await new Promise((r) => setTimeout(r, 0));
  }
  expect((document.getElementById('btn-heavy') as HTMLButtonElement).disabled).toBe(
    true,
  );
});
```

Set `vite.config.ts` test environment to `happy-dom` (still include the copyright header).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/client`

Expected: FAIL — missing modules.

- [ ] **Step 3: Implement format + app + css**

`src/client/format.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { AMOUNT_SCALE } from '../constants';

export function formatAmount(amount: number): string {
  const whole = amount / AMOUNT_SCALE;
  const [i, f] = whole.toFixed(2).split('.');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}.${f}`;
}
```

`src/client/app.ts` — vanilla HUD:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { BLOCKS, type BlockId } from '../constants';
import { displayMultiplier } from '../math/multiplier';
import type { Quote } from '../math/quotes';
import type { GameServer, Round } from '../server/types';
import { formatAmount } from './format';

export class EquilibriumApp {
  private busy = false;
  private round: Round | null = null;
  private betLevels: number[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly server: GameServer,
  ) {}

  async mount(): Promise<void> {
    const auth = await this.server.authenticate();
    this.betLevels = auth.config.betLevels;
    this.round = auth.round;
    this.render(auth.balance.amount);
    this.bind();
  }

  private quotes(): Quote[] {
    const state = this.round?.state ?? [];
    for (let i = state.length - 1; i >= 0; i--) {
      const e = state[i];
      if (e.type === 'quotes') return e.quotes;
    }
    return [];
  }

  private render(balanceAmount: number) {
    const qs = this.quotes();
    const active = Boolean(this.round?.active);
    const canCash = active && (this.round?.blocksPlaced ?? 0) >= 1;
    const q = (id: BlockId) => qs.find((x) => x.block === id);
    const label = (id: BlockId) => {
      const row = q(id);
      const meta = BLOCKS[id];
      if (!row) return `${meta.label.toUpperCase()}  +${meta.weight}`;
      const pct = Math.round(row.pSurvive * 100);
      return `${meta.label.toUpperCase()}  +${row.weight}  → ${displayMultiplier(row.nextMultiplierBps)}x  ${pct}%`;
    };
    this.root.innerHTML = `
      <header>
        <div id="balance">${formatAmount(balanceAmount)}</div>
        <div id="play-money">PLAY MONEY</div>
        <button type="button" id="btn-reset">Reset</button>
      </header>
      <p id="hint">Stack weight. Cash out before it breaks.</p>
      <div id="bet-levels">
        ${this.betLevels
          .map(
            (b) =>
              `<button type="button" data-bet="${b}" ${active ? 'disabled' : ''}>${formatAmount(b)}</button>`,
          )
          .join('')}
      </div>
      <div id="scale-slot"></div>
      <div id="blocks">
        ${(['safe', 'medium', 'heavy'] as BlockId[])
          .map((id) => {
            const row = q(id);
            const disabled = !active || !row || row.disabled || this.busy;
            return `<button type="button" id="btn-${id}" ${disabled ? 'disabled' : ''}>${label(id)}</button>`;
          })
          .join('')}
        <button type="button" id="btn-cashout" ${canCash && !this.busy ? '' : 'disabled'}>Cash Out</button>
      </div>
      <footer id="footer">Pitch demo — not on Stake/Bink. © 2026 jmenichole.</footer>
    `;
    this.bind();
  }

  private bind() {
    this.root.querySelectorAll<HTMLButtonElement>('[data-bet]').forEach((btn) => {
      btn.onclick = () => void this.onBet(Number(btn.dataset.bet));
    });
    const safe = this.root.querySelector<HTMLButtonElement>('#btn-safe');
    const medium = this.root.querySelector<HTMLButtonElement>('#btn-medium');
    const heavy = this.root.querySelector<HTMLButtonElement>('#btn-heavy');
    const cash = this.root.querySelector<HTMLButtonElement>('#btn-cashout');
    const reset = this.root.querySelector<HTMLButtonElement>('#btn-reset');
    if (safe) safe.onclick = () => void this.onPlace('safe');
    if (medium) medium.onclick = () => void this.onPlace('medium');
    if (heavy) heavy.onclick = () => void this.onPlace('heavy');
    if (cash) cash.onclick = () => void this.onCash();
    if (reset) reset.onclick = () => void this.onReset();
  }

  private async onBet(amount: number) {
    if (this.busy || this.round?.active) return;
    this.busy = true;
    const res = await this.server.play(amount, 'BASE');
    this.busy = false;
    if (res.status.statusCode !== 'SUCCESS') return;
    this.round = res.round;
    this.render(res.balance.amount);
  }

  private async onPlace(block: BlockId) {
    if (this.busy || !this.round?.active) return;
    this.busy = true;
    const res = await this.server.action('DECISION', { type: 'place', block });
    this.busy = false;
    this.round = res.round;
    this.render(res.balance.amount);
    if (!res.round.active) {
      this.busy = true;
      const ended = await this.server.endRound();
      this.busy = false;
      this.round = ended.round;
      this.render(ended.balance.amount);
    }
  }

  private async onCash() {
    if (this.busy || !this.round?.active || this.round.blocksPlaced < 1) return;
    this.busy = true;
    const res = await this.server.endRound();
    this.busy = false;
    this.round = res.round;
    this.render(res.balance.amount);
  }

  private async onReset() {
    this.busy = true;
    const res = await this.server.resetBalance();
    this.busy = false;
    this.round = null;
    this.render(res.balance.amount);
  }
}
```

`src/styles.css` — charcoal background `#121212`, gold accent `#d4af37`, full-width column, large tap targets, footer muted. Include the copyright comment as the first line.

`vite.config.ts` test.environment: `'happy-dom'`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/client tests/copyright.test.ts`

Expected: PASS. If click tests race, `await` a microtask loop (already in tests). If they still fail, expose `app.mount` and make click handlers return the same promises the test can await by storing last action — keep the test’s `setTimeout(0)` first.

- [ ] **Step 5: Commit**

```bash
git add src/client/format.ts src/client/app.ts src/styles.css tests/client/format.test.ts tests/client/app.test.ts vite.config.ts
git commit -m "feat: add play-money HUD with Stake-style bet and block buttons"
```

---

### Task 7: SVG scale and weight-only wobble

**Files:**
- Create: `src/client/scaleView.ts`
- Modify: `src/client/app.ts` (mount scale into `#scale-slot`)
- Create: `tests/client/scaleView.test.ts`

**Interfaces:**
- Consumes: current `weight: number` only (plus `phase: 'idle' | 'playing' | 'bust' | 'cashedOut'`, `maxWeight = 15`)
- Produces: `class ScaleView { constructor(host: HTMLElement); setState(s: { weight: number; phase: 'idle' | 'playing' | 'bust' | 'cashedOut' }): void }`
- CSS variable `--wobble` on the platform group = `weight / 15` (0 if idle with weight 0)
- SVG ids: `scale-platform`, `scale-stack`. Blocks are rects with `data-block-index`
- `setState` must not accept `C` or `pSurvive`

- [ ] **Step 1: Write the failing test**

`tests/client/scaleView.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/client/scaleView.test.ts`

Expected: FAIL — missing `ScaleView`.

- [ ] **Step 3: Implement ScaleView and wire `#scale-slot`**

`src/client/scaleView.ts`: SVG 320×240, base, platform group with CSS animation `wobble` whose `rotate` amplitude is `calc(var(--wobble) * 4deg)`. Stack N rectangles for `weight` units (1 rect per weight unit, gold). Bust: add class `bust` (platform translates down). Cash-out: class `win`. Idle noise: animation always running; `--wobble` at 0 is visually still.

In `EquilibriumApp.render`, after setting innerHTML, `new ScaleView(slot).setState({ weight: this.round?.weight ?? 0, phase })` where phase is `bust` if last event is bust, `cashedOut` if last is cashedOut, `playing` if active, else `idle`. Creating a new `ScaleView` each render is OK for the demo.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/client`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/client/scaleView.ts src/client/app.ts src/styles.css tests/client/scaleView.test.ts
git commit -m "feat: add SVG scale wobble driven only by stacked weight"
```

---

### Task 8: Boot, Pages, README

**Files:**
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/vite-env.d.ts`
- Create: `.github/workflows/pages.yml`
- Create: `README.md`
- Modify: `src/client/app.ts` if the scale slot is empty on first paint
- Delete or ignore root `init` if it is still an empty placeholder (do not put game logic in it)

**Interfaces:**
- Consumes: `EquilibriumApp`, `LocalGameServer`
- Produces: `npm run dev` playable game; `npm run build` static `dist/`

- [ ] **Step 1: Write a failing smoke test that index.html mentions the copyright and #app**

`tests/client/indexHtml.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run tests/client/indexHtml.test.ts`

Expected: FAIL — no `index.html`.

- [ ] **Step 3: Add boot files**

`index.html`:

```html
<!doctype html>
<!-- Copyright (c) 2026 jmenichole. All rights reserved. -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Equilibrium</title>
    <link rel="stylesheet" href="/src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { EquilibriumApp } from './client/app';
import { LocalGameServer } from './server/localGameServer';

const root = document.getElementById('app');
if (!root) throw new Error('missing #app');
void new EquilibriumApp(root, new LocalGameServer()).mount();
```

`src/vite-env.d.ts`:

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
/// <reference types="vite/client" />
```

`.github/workflows/pages.yml`:

```yml
# Copyright (c) 2026 jmenichole. All rights reserved.
name: pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`README.md`: how to `npm install`, `npm test`, `npm run dev`; that this is a pitch demo with play money; © 2026 jmenichole; not on Stake/Bink.

- [ ] **Step 4: Run full verification**

Run:

```
npx vitest run
npx tsc --noEmit
npx vite build
```

Expected: all tests PASS, `tsc` clean, `dist/index.html` exists. Manually open `npx vite preview` and play one Safe cash-out and one forced bust (`rollC` not needed in UI).

- [ ] **Step 5: Commit**

```bash
git add index.html src/main.ts src/vite-env.d.ts .github/workflows/pages.yml README.md tests/client/indexHtml.test.ts
git commit -m "feat: boot Equilibrium pitch demo and add GitHub Pages workflow"
```

---

## Self-review (plan vs spec)

| Spec item | Task |
| --- | --- |
| Vite + TS, server/client split | 1, 4, 6–8 |
| Hidden `C`, quotes Bayesian | 2, 4 |
| Integer money, betLevels | 1, 4, 6 |
| Multiplicative 2% edge, floor bps | 3 |
| Bust loses bet; cash-out = endRound | 4 |
| Cosmetic wobble from weight/15 | 7 |
| Full HUD numbers | 6 |
| Three blocks 1/3/7 | 1 |
| PLAY MONEY + footer + © jmenichole | 6, 8 |
| LICENSE + header on all code | 1, copyright test ongoing |
| Monte Carlo RTP | 5 |
| No Stake SDK, no resume | 4, 8 |
| GitHub Pages | 8 |
| Reset to 1,000.00 | 4, 6 |
| `C` not in DOM/events/logs | 4, 7 tests |

No remaining spec gaps. Type names (`Quote`, `GameServer`, `EngineResponse`, `multiplierBps`, `blocksPlaced`) are consistent across tasks.
