# Overdue Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retune Overdue math to 96.5% RTP and polish the Engine frontend into a library pile that lands, glows gold on win, or topples on bust, with muteable SFX.

**Architecture:** Keep the existing RGS loop (`authenticate` / `play` / `end-round`). Change only lookup-weight target in Python. Rebuild the SVG pile (vertical stack, shelf does not tip), CSS library wall, and a small Web Audio helper gated by mute. No new npm packages. No remote fonts or audio URLs.

**Tech Stack:** Python 3 / pytest (`math/`), Vite + TypeScript + vitest + happy-dom (`frontend/`), Web Audio API for three short tones.

## Global Constraints

- Copyright header on every new/edited `.ts`/`.css`/`.py`/`.html` file: `Copyright (c) 2026 jmenichole. All rights reserved.`
- Frontend never computes payouts; display RGS `payoutMultiplier` and `amount` only.
- Hidden `C` / `S` never appear in events, DOM, logs, or rules copy (no `\bC\b`, no ` / 15`).
- Single mode `base`. No difficulty. No cash-out.
- Static build `base: './'`. No Google Fonts, no CDN audio, no `fetch` of SFX.
- Mute must silence SFX. No looping music.
- Lookup CSV stays headerless `id,weight,payout`. Books zstd when `zstandard` is installed.
- ACP title Overdue; do not add Megaways / Xways.
- Tests: `cd math && python3 -m pytest`; `cd frontend && npm test && npm run build`.
- Do not commit `math/library/` or nested `equilibrium/` clones.

**Spec:** `docs/superpowers/specs/2026-08-22-overdue-polish-design.md`

---

### Task 1: Target lookup RTP 96.5%

**Files:**
- Modify: `math/generate.py`
- Modify: `math/tests/test_rtp.py`
- Test: `math/tests/test_rtp.py`

**Interfaces:**
- Consumes: `compute_lookup_weights(books, target=...)`, `mix_to_band(books, target=...)`
- Produces: `generate.py` calls `mix_to_band(..., target=0.965)` and `compute_lookup_weights(..., target=0.965)` (band 0.960–0.970)

- [ ] **Step 1: Write the failing test**

In `math/tests/test_rtp.py`, change `test_compute_lookup_weights_hits_target_rtp` and add a 0.965 assertion:

```python
def test_compute_lookup_weights_hits_target_rtp():
    bust = simulate_round(c=0, s=1, draws=[1])
    win = simulate_round(c=15, s=1, draws=[1])
    books = [bust, win, bust, bust, win]
    weights = compute_lookup_weights(books, target=0.965)
    r = weighted_rtp(books, weights)
    assert 0.960 <= r <= 0.970
```

Keep `test_compute_lookup_weights_finishes_on_large_far_rtp_set` at `target=0.96` with `0.955 <= r <= 0.965` so the speed test still matches its far-from-target setup.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd math && python3 -m pytest tests/test_rtp.py::test_compute_lookup_weights_hits_target_rtp -q`

Expected: FAIL until generate/defaults are used; if the test already passes because the function takes `target`, it should PASS as soon as the test uses `0.965`. That is OK — the production gap is `generate.py` still passing `0.96`.

- [ ] **Step 3: Point generate at 0.965**

In `math/generate.py`:

```python
    books = mix_to_band(books, target=0.965)
    print(f"Computing lookup weights for {len(books)} books...", flush=True)
    weights = compute_lookup_weights(books, target=0.965)
```

- [ ] **Step 4: Run math tests**

Run: `cd math && python3 -m pytest -q`

Expected: all pass (including 100k mix band 0.90–0.98).

- [ ] **Step 5: Commit**

```bash
git add math/generate.py math/tests/test_rtp.py
git commit -m "feat: target 96.5% RTP when generating Engine lookup weights"
```

---

### Task 2: Rules copy, RTP display, disclaimer, title

**Files:**
- Modify: `frontend/src/constants.ts`
- Modify: `frontend/index.html` (`<title>`)
- Modify: `frontend/src/game/app.ts` (info panel paragraph)
- Modify: `frontend/tests/app.test.ts`
- Modify: `frontend/tests/copyright.test.ts` only if new strings must still include the jmenichole notice (disclaimer already does)

**Interfaces:**
- Consumes: existing `DISCLAIMER`, `RTP_DISPLAY`, `GAME_TITLE`
- Produces:
  - `GAME_TITLE = 'Overdue'`
  - `RTP_DISPLAY = '96.5%'`
  - `DISCLAIMER` ends with Stake Engine TM/© plus jmenichole copyright
  - Info rules mention pile, visual-only sizes, no shelf-bust wording

- [ ] **Step 1: Write the failing test**

In `frontend/tests/app.test.ts` update the info-panel test:

```typescript
test('info panel lists rules, RTP, and max win', async () => {
  const rgs = createFakeRgs();
  const app = new EquilibriumEngineApp(document.getElementById('app')!, rgs, 0);
  await app.mount();

  (document.getElementById('btn-info') as HTMLButtonElement).click();
  const panel = document.getElementById('info-panel');
  expect(panel?.textContent).toContain('96.5%');
  expect(panel?.textContent).toContain('15.05');
  expect(panel?.textContent).toMatch(/visual/i);
  expect(panel?.textContent).toMatch(/bust/i);
  expect(document.getElementById('disclaimer')?.textContent).toMatch(/Stake Engine/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run tests/app.test.ts -t "info panel"`

Expected: FAIL (still `96%`, no visual/Stake Engine).

- [ ] **Step 3: Update constants and copy**

`frontend/src/constants.ts`:

```typescript
export const GAME_TITLE = 'Overdue';

export const DISCLAIMER =
  'Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. Stake Engine™ and © Stake Engine. Copyright (c) 2026 jmenichole. All rights reserved.';

export const RTP_DISPLAY = '96.5%';
```

`frontend/index.html`: `<title>Overdue</title>`

`frontend/src/game/app.ts` info paragraph:

```html
<p>Press Play and watch books pile on the shelf. Thin, regular, and tome sizes are visual only. If the pile falls, you lose. Wins pay the multiplier shown (×).</p>
```

- [ ] **Step 4: Run frontend tests**

Run: `cd frontend && npm test`

Expected: PASS, including copyright test (disclaimer still contains jmenichole notice).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/constants.ts frontend/index.html frontend/src/game/app.ts frontend/tests/app.test.ts
git commit -m "feat: Overdue rules copy, 96.5% RTP, Stake Engine disclaimer"
```

---

### Task 3: Muteable land / tumble / win SFX

**Files:**
- Create: `frontend/src/game/sfx.ts`
- Create: `frontend/tests/sfx.test.ts`
- Modify: `frontend/src/game/app.ts` (call sfx from replay handlers; mute gates playback)

**Interfaces:**
- Consumes: none
- Produces:
  - `export type SfxName = 'land' | 'tumble' | 'win'`
  - `export type SfxPlayer = { muted: boolean; play(name: SfxName): void }`
  - `export function createSfx(ctx?: Pick<AudioContext, 'createOscillator' | 'createGain' | 'destination' | 'currentTime'>): SfxPlayer`
  - `play('win')` is a no-op when `muted === true`
  - Frequencies stay in-file (no network). Tests inject a fake context.

- [ ] **Step 1: Write the failing test**

Create `frontend/tests/sfx.test.ts`:

```typescript
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test, vi } from 'vitest';
import { createSfx } from '../src/game/sfx';

function fakeCtx() {
  const osc = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 }, type: 'sine' };
  const gain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
  return {
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
    destination: {},
    currentTime: 0,
    osc,
    gain,
  };
}

test('play starts an oscillator when not muted', () => {
  const ctx = fakeCtx();
  const sfx = createSfx(ctx);
  sfx.play('land');
  expect(ctx.createOscillator).toHaveBeenCalledOnce();
  expect(ctx.osc.start).toHaveBeenCalledOnce();
});

test('muted play does not start an oscillator', () => {
  const ctx = fakeCtx();
  const sfx = createSfx(ctx);
  sfx.muted = true;
  sfx.play('tumble');
  sfx.play('win');
  expect(ctx.createOscillator).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run tests/sfx.test.ts`

Expected: FAIL, cannot find module `../src/game/sfx`.

- [ ] **Step 3: Implement `createSfx`**

`frontend/src/game/sfx.ts` — copyright header. `createSfx` uses the injected ctx, or `new AudioContext()` when omitted (wrap in try; if AudioContext missing, `play` no-ops). `land` ~520Hz 0.08s, `tumble` ~180Hz 0.2s, `win` ~660Hz 0.18s. If `muted`, return immediately.

- [ ] **Step 4: Wire into `EquilibriumEngineApp`**

Private `sfx = createSfx()`. In `stack` handler: `this.sfx.play('land')`. In `bust`: `this.sfx.play('tumble')`. In `finalWin` when `this.phase !== 'bust'`: `this.sfx.play('win')`. Sound button already toggles `this.muted`; also set `this.sfx.muted = this.muted`.

- [ ] **Step 5: Run tests**

Run: `cd frontend && npm test`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/game/sfx.ts frontend/tests/sfx.test.ts frontend/src/game/app.ts
git commit -m "feat: play land, tumble, and win tones gated by mute"
```

---

### Task 4: Vertical pile, still shelf, library wall

**Files:**
- Modify: `frontend/src/game/shelfView.ts`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/tests/shelfView.test.ts`

**Interfaces:**
- Consumes: `ShelfRenderInput` `{ pieces, phase, totalWeight }`
- Produces: SVG `class="equilibrium-shelf"` with `g.library-wall`, `g.shelf-board` that does **not** rotate on bust; `g.pile` stacking books **upward**; last book `.book-enter`; `is-bust` / `is-win` on the svg. `bookHeight(7)` stays `'70'` (existing test). Bust CSS animates `.book-wrap`, not `.shelf-tilt`.

- [ ] **Step 1: Write the failing tests**

Replace/extend `frontend/tests/shelfView.test.ts`:

```typescript
test('books stack upward as a pile not a row', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({
    pieces: [{ weight: 1 }, { weight: 3 }],
    phase: 'playing',
    totalWeight: 4,
  });
  const books = [...host.querySelectorAll('rect.book')];
  const y0 = Number(books[0].getAttribute('y'));
  const y1 = Number(books[1].getAttribute('y'));
  expect(y1).toBeLessThan(y0);
});

test('bust does not rotate the shelf board', () => {
  const host = document.createElement('div');
  const view = new ShelfView(host);
  view.render({ pieces: [{ weight: 7 }], phase: 'bust', totalWeight: 7 });
  expect(host.querySelector('svg')?.classList.contains('is-bust')).toBe(true);
  expect(host.querySelector('.shelf-tilt')).toBeNull();
  expect(host.innerHTML).not.toMatch(/\bC\b/);
  expect(host.innerHTML).not.toContain(' / 15');
});
```

Keep existing height-70, enter-class, and no-C tests working (update enter-class if pile markup changes).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run tests/shelfView.test.ts`

Expected: FAIL (`y1` not less than `y0`; `.shelf-tilt` still present).

- [ ] **Step 3: Implement pile layout**

Stack from the shelf board: `let y = shelfY` then for each piece `h = bookHeight(w); y -= h; draw at (centerX - width/2, y)`. Center X = 180. Include a library wall group (lighter plaster `#d4c4a8`, wood wainscot, soft gold light ellipse). Remove `shelfSagDegrees` rotate on the board (idle wobble of the **pile** of at most 2deg via CSS is OK; do not tip the board). `aria-label="Books piled on a shelf"`.

- [ ] **Step 4: CSS**

`frontend/src/styles.css`:

- `body` / `.equilibrium-app` background `#c4b49a` (warm library), not a void `#1c1814` page.
- `.equilibrium-shelf.is-bust .shelf-tilt` animation **deleted**.
- `.equilibrium-shelf.is-bust .book-wrap` keeps tumble (translateY + rotate).
- `.equilibrium-shelf.is-win .pile` filter gold drop-shadow.
- `.book-enter` land from `translateY(-24px)`.

- [ ] **Step 5: Run tests and build**

Run: `cd frontend && npm test && npm run build`

Expected: PASS, `dist/` written.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/game/shelfView.ts frontend/src/styles.css frontend/tests/shelfView.test.ts
git commit -m "feat: pile books on a still shelf against a library wall"
```

---

### Task 5: Medium pace already set; bust hold stays

**Files:**
- Modify: `frontend/src/game/app.ts` only if `delayMs` default is not 380
- Modify: `frontend/tests/replay.test.ts` if needed

**Interfaces:**
- Consumes: `playBookEvents(events, handlers, delayMs)`
- Produces: default `delayMs = 380` on `EquilibriumEngineApp`

- [ ] **Step 1: Confirm default**

If constructor already `private readonly delayMs = 380`, no code change. Replay already delays before/after bust.

- [ ] **Step 2: Run tests**

Run: `cd frontend && npx vitest run tests/replay.test.ts tests/app.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit only if you changed a file**

```bash
git add frontend/src/game/app.ts
git commit -m "chore: keep medium 380ms book replay pacing"
```

Skip commit if nothing changed.

---

### Task 6: Brighter tile + human checklist

**Files:**
- Modify: `docs/assets/overdue-tile.png` (replace with a brighter 512×512 PNG: light plaster, gold rim, pile of books, no × / numbers)
- Modify: `docs/MANUAL-TASKS.md` Engine section

**Interfaces:**
- Consumes: spec tile + upload steps
- Produces: bright tile; checklist tells Jamie to regenerate math at 96.5% and re-import `dist` + tile

- [ ] **Step 1: Replace tile**

Generate or draw `docs/assets/overdue-tile.png` 512×512, **bright** background (cream/gold, not dark walnut void), gold rim, books pile, no multipliers.

- [ ] **Step 2: Update `docs/MANUAL-TASKS.md` Engine block**

Replace the Engine upload rows with:

```markdown
| Math | `math/library/publish_files/` | `cd math && python3 generate.py --count 100000 --out library` (96.5% weights) |
| Frontend | `frontend/dist/` | `cd frontend && npm run build` |
| Tile | `docs/assets/overdue-tile.png` | bright edges, no baked × |

- [ ] Re-import math `publish_files` after generate; confirm Engine math page ~96.5% RTP
- [ ] Re-import entire `frontend/dist` (new hashed JS/CSS)
- [ ] Replace game tile with `docs/assets/overdue-tile.png`
- [ ] Play: pile grows, gold hold on win, books collapse on bust, mute silences tones
- [ ] Then Start Approval (math + frontend). Do not promise listing.
```

- [ ] **Step 3: Commit**

```bash
git add docs/assets/overdue-tile.png docs/MANUAL-TASKS.md
git commit -m "docs: bright Overdue tile and Engine re-upload checklist"
```

---

### Task 7: Verify full suite

- [ ] **Step 1: Math**

Run: `cd math && python3 -m pytest -q`

Expected: all passed.

- [ ] **Step 2: Frontend**

Run: `cd frontend && npm test && npm run build`

Expected: all passed; `dist/index.html` + hashed css/js.

- [ ] **Step 3: Spec coverage check**

Confirm each spec success line has a task: 96.5% (T1+T2), pile/topple/gold (T4), SFX/mute (T3), library wall (T4), no extra modes (unchanged), tile (T6), disclaimer (T2), EndRound recover (already shipped, do not regress).

- [ ] **Step 4: Commit only if a fix landed**

If tests forced a fix, commit that fix with a descriptive message.

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| 96.5% lookup target | 1 |
| RTP copy 96.5%, Overdue title, visual-only rules, Stake Engine TM | 2 |
| Land/tumble/win SFX, mute | 3 |
| Vertical pile, shelf stays, library wall, gold win, collapse bust | 4 |
| Medium pace | 5 (already 380ms) |
| Bright tile, human re-upload | 6 |
| Keep ~15.05× and high hit-rate | 1 (weights only; no new simulator) |
| No extra modes / no music | global + T3 |

Do not run `generate.py --count 100000` in CI. Jamie runs it locally, then imports `publish_files` and `dist`.
