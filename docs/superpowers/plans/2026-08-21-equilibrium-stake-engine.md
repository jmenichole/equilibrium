# Equilibrium Stake Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Stake Engine–submittable Equilibrium: Python math that publishes stateless books, and a Vite frontend that only replays those books on a bookshelf (Play and watch, no cash-out).

**Architecture:** `math/` simulates hidden `C` and `S`, emits `stack` / `bust` / `setTotalWin` / `finalWin`, and writes `library/` books. `frontend/` authenticates and plays through `rgs_url` (dev mock reads `math/library`; production uses `stake-engine` `RGSClient`). The existing `src/` Pages demo is left alone.

**Tech Stack:** Python 3.12+ and pytest for math. Vite 8, TypeScript, Vitest, happy-dom, `stake-engine` for the Engine frontend. No Svelte, no Pixi, no web-sdk fork.

## Global Constraints

- Copyright on every new `.ts`, `.css`, `.html`, `.yml`, `.py` source file and tests: `Copyright (c) 2026 jmenichole. All rights reserved.`
- Title: **Equilibrium**. No Megaways, Xways, Stake™, or Kick™ branding
- Stateless: one `Play` returns the full book; no Stack or Cash out controls
- Secret `C` uniform `{0…15}`; secret `S` uniform `{1…15}`; never in events, DOM, logs, or rules copy
- Piece weights `{1, 3, 7}` drawn uniformly; `next_bps = floor(current_bps * 98 * remain / (100 * fit))` with `C_SPAN = 16`
- Published `payoutMultiplier` is integer **× 100** (`123` = `1.23×`); `bps_to_x100 = bps // 100`
- Book `setTotalWin.amount` / `finalWin.amount` are win credits **at a 1.00 bet** (`1_000_000 * payoutMultiplier // 100`); the mock RGS scales by `betAmount / 1_000_000`
- Frontend never computes `bet * multiplier`; it displays RGS / event fields only
- `rgs_url` and `sessionID` come from the query string; no hardcoded RGS host
- RTP target **96.0%**, must land in **90.0%–98.0%**; single `base` mode
- Static frontend build with `base: './'`; no Google Fonts
- Existing `src/` Pages demo is not the upload artifact

## File map

| Path | Responsibility |
| --- | --- |
| `math/equilibrium/constants.py` | Weights, `C_SPAN`, bps scale, house edge |
| `math/equilibrium/quotes.py` | `remain_count`, `fit_count`, `p_survive` |
| `math/equilibrium/multiplier.py` | `next_multiplier_bps`, `bps_to_x100` |
| `math/equilibrium/simulate.py` | `simulate_round`, `run_round` |
| `math/equilibrium/publish.py` | Write books JSON, lookup CSV, index.json |
| `math/generate.py` | CLI to fill `math/library/` |
| `math/tests/*.py` | pytest |
| `math/library/` | Generated books (gitignored except a tiny fixture if needed) |
| `frontend/package.json` | Engine UI package; depends on `stake-engine` |
| `frontend/vite.config.ts` | `base: './'`, vitest, `devRgs` plugin |
| `frontend/vite/devRgs.ts` | Mock `/wallet/*` from `math/library` |
| `frontend/src/rgs/types.ts` | Auth / play / book event types |
| `frontend/src/rgs/client.ts` | `createRgs(rgsUrl, sessionID)` fetch client |
| `frontend/src/rgs/query.ts` | Read `rgs_url` and `sessionID` from `location.search` |
| `frontend/src/rgs/display.ts` | Format RGS amounts and `payoutMultiplier` |
| `frontend/src/game/replay.ts` | `playBookEvents` in order |
| `frontend/src/game/shelfView.ts` | SVG shelf, book rects, sag from `totalWeight` |
| `frontend/src/game/app.ts` | HUD, Play, info/disclaimer, mute, spacebar |
| `frontend/src/constants.ts` | Disclaimer, copyright, copy |
| `frontend/src/styles.css` | Charcoal/gold, mini-player-safe layout |
| `frontend/index.html` | Mount + copyright |
| `frontend/src/main.ts` | Boot |
| `frontend/tests/**` | Vitest |
| `docs/MANUAL-TASKS.md` | Add ACP upload steps (human) |

---

### Task 1: Math kernel (quotes, multiplier, one round)

**Files:**
- Create: `math/equilibrium/__init__.py`
- Create: `math/equilibrium/constants.py`
- Create: `math/equilibrium/quotes.py`
- Create: `math/equilibrium/multiplier.py`
- Create: `math/equilibrium/simulate.py`
- Create: `math/tests/test_quotes.py`
- Create: `math/tests/test_simulate.py`
- Create: `math/requirements.txt`
- Modify: `.gitignore` (add `math/library/`, `math/.pytest_cache/`, `__pycache__/`)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `remain_count(x: int) -> int`
  - `fit_count(x: int, w: int) -> int`
  - `p_survive(x: int, w: int) -> float`
  - `next_multiplier_bps(current_bps: int, remain: int, fit: int) -> int`
  - `bps_to_x100(bps: int) -> int`
  - `simulate_round(*, c: int, s: int, draws: list[int]) -> dict` with keys `payoutMultiplier: int` and `events: list[dict]`

- [ ] **Step 1: Write the failing quote tests**

Create `math/requirements.txt`:

```
pytest>=8.0
```

Create `math/tests/test_quotes.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from math.equilibrium.quotes import fit_count, p_survive, remain_count
from math.equilibrium.multiplier import bps_to_x100, next_multiplier_bps


def test_remain_at_zero_is_16():
    assert remain_count(0) == 16


def test_safe_at_zero():
    assert fit_count(0, 1) == 15
    assert p_survive(0, 1) == 15 / 16


def test_medium_at_zero():
    assert fit_count(0, 3) == 13
    assert p_survive(0, 3) == 13 / 16


def test_heavy_at_zero():
    assert fit_count(0, 7) == 9
    assert p_survive(0, 7) == 9 / 16


def test_heavy_at_ten_cannot_fit():
    assert remain_count(10) == 6
    assert fit_count(10, 7) == 0
    assert p_survive(10, 7) == 0


def test_next_bps_safe_from_start():
    # floor(10000 * 98 * 16 / (100 * 15)) = 10453
    assert next_multiplier_bps(10000, 16, 15) == 10453


def test_bps_to_x100():
    assert bps_to_x100(10000) == 100
    assert bps_to_x100(10453) == 104
```

If `math` collides with the stdlib when running from repo root, run pytest with `PYTHONPATH=.` from repo root **or** name the package import `equilibrium` by putting `math/equilibrium` on the path. Prefer running from `math/` with `sys.path` via `conftest.py`:

Create `math/tests/conftest.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
```

Then imports are `from equilibrium.quotes import ...` (package dir `math/equilibrium`). Use **`from equilibrium.quotes import ...`** in all math tests, not `from math.equilibrium`.

Update `test_quotes.py` imports to `from equilibrium.quotes import ...` and `from equilibrium.multiplier import ...`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd math && python3 -m pytest tests/test_quotes.py -v`

Expected: FAIL with `ModuleNotFoundError: equilibrium`

- [ ] **Step 3: Write quote and multiplier modules**

`math/equilibrium/__init__.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
```

`math/equilibrium/constants.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.

WEIGHTS = (1, 3, 7)
MAX_C = 15
C_SPAN = 16
HOUSE_EDGE_NUM = 98
HOUSE_EDGE_DEN = 100
MULTIPLIER_BPS_SCALE = 10_000
STARTING_MULTIPLIER_BPS = 10_000
UNIT_BET = 1_000_000
```

`math/equilibrium/quotes.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.constants import C_SPAN


def remain_count(current_weight: int) -> int:
    return max(0, C_SPAN - current_weight)


def fit_count(current_weight: int, block_weight: int) -> int:
    return max(0, C_SPAN - (current_weight + block_weight))


def p_survive(current_weight: int, block_weight: int) -> float:
    remain = remain_count(current_weight)
    if remain == 0:
        return 0.0
    return fit_count(current_weight, block_weight) / remain
```

`math/equilibrium/multiplier.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.constants import HOUSE_EDGE_DEN, HOUSE_EDGE_NUM


def next_multiplier_bps(current_bps: int, remain: int, fit: int) -> int:
    if fit <= 0 or remain <= 0:
        raise ValueError("ERR_ZERO_SURVIVE")
    return (current_bps * HOUSE_EDGE_NUM * remain) // (HOUSE_EDGE_DEN * fit)


def bps_to_x100(bps: int) -> int:
    return bps // 100
```

- [ ] **Step 4: Re-run quote tests**

Run: `cd math && python3 -m pytest tests/test_quotes.py -v`

Expected: PASS

- [ ] **Step 5: Write failing simulate tests**

Create `math/tests/test_simulate.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.simulate import simulate_round


def test_c_zero_busts_on_first_piece():
    book = simulate_round(c=0, s=1, draws=[1])
    assert book["payoutMultiplier"] == 0
    types = [e["type"] for e in book["events"]]
    assert types == ["bust", "setTotalWin", "finalWin"]
    assert all("C" not in e and "S" not in e and "c" not in e and "s" not in e for e in book["events"])


def test_win_after_first_pebble_when_s_is_1():
    book = simulate_round(c=15, s=1, draws=[1])
    assert book["payoutMultiplier"] == 104
    types = [e["type"] for e in book["events"]]
    assert types[0] == "stack"
    assert book["events"][0]["weight"] == 1
    assert book["events"][0]["totalWeight"] == 1
    assert book["events"][0]["payoutMultiplier"] == 104
    assert types[-2:] == ["setTotalWin", "finalWin"]
    assert book["events"][-1]["amount"] == 1_000_000 * 104 // 100


def test_bust_when_piece_exceeds_c():
    book = simulate_round(c=2, s=15, draws=[7])
    assert book["payoutMultiplier"] == 0
    assert book["events"][0]["type"] == "bust"


def test_secrets_never_in_events():
    book = simulate_round(c=10, s=3, draws=[1, 3, 7, 1, 1, 1, 1, 1, 1, 1])
    for event in book["events"]:
        assert "c" not in event
        assert "s" not in event
        assert "C" not in event
        assert "S" not in event
```

- [ ] **Step 6: Run simulate tests to verify they fail**

Run: `cd math && python3 -m pytest tests/test_simulate.py -v`

Expected: FAIL `ModuleNotFoundError` or `cannot import simulate`

- [ ] **Step 7: Implement `simulate_round`**

Create `math/equilibrium/simulate.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import random

from equilibrium.constants import STARTING_MULTIPLIER_BPS, UNIT_BET, WEIGHTS
from equilibrium.multiplier import bps_to_x100, next_multiplier_bps
from equilibrium.quotes import fit_count, remain_count


def simulate_round(*, c: int, s: int, draws: list[int]) -> dict:
    events: list[dict] = []
    x = 0
    m = STARTING_MULTIPLIER_BPS
    index = 0
    for w in draws:
        if x + w > c:
            events.append({"index": index, "type": "bust"})
            index += 1
            events.append({"index": index, "type": "setTotalWin", "amount": 0})
            index += 1
            events.append({"index": index, "type": "finalWin", "amount": 0})
            return {"payoutMultiplier": 0, "events": events}
        remain = remain_count(x)
        fit = fit_count(x, w)
        m = next_multiplier_bps(m, remain, fit)
        x = x + w
        px = bps_to_x100(m)
        events.append(
            {
                "index": index,
                "type": "stack",
                "weight": w,
                "totalWeight": x,
                "payoutMultiplier": px,
            }
        )
        index += 1
        if x >= s:
            amount = UNIT_BET * px // 100
            events.append({"index": index, "type": "setTotalWin", "amount": amount})
            index += 1
            events.append({"index": index, "type": "finalWin", "amount": amount})
            return {"payoutMultiplier": px, "events": events}
    raise ValueError("ran out of draws before bust or win")


def run_round(rng: random.Random) -> dict:
    c = rng.randrange(0, 16)
    s = rng.randrange(1, 16)
    draws: list[int] = []
    # Cap draws well above max stacks (weight 1 up to 16 times)
    for _ in range(32):
        draws.append(rng.choice(WEIGHTS))
    return simulate_round(c=c, s=s, draws=draws)
```

- [ ] **Step 8: Run all math unit tests**

Run: `cd math && python3 -m pytest tests/test_quotes.py tests/test_simulate.py -v`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add math .gitignore
git commit -m "feat(math): simulate stateless Equilibrium rounds"
```

---

### Task 2: Publish books library

**Files:**
- Create: `math/equilibrium/publish.py`
- Create: `math/generate.py`
- Create: `math/tests/test_publish.py`
- Modify: `.gitignore` (ensure `math/library/` is ignored except keep directory via `math/library/.gitkeep` only if generate is required in CI — **do not commit 100k books**. Tests write to a temp dir.)

**Interfaces:**
- Consumes: `run_round(rng) -> dict`
- Produces:
  - `write_library(out_dir: Path, books: list[dict]) -> None` writing `books/books_base.json`, `publish_files/index.json`, `publish_files/lookUpTable_base_0.csv`, `publish_files/books_base.jsonl`
  - Each book: `{ "id": int, "payoutMultiplier": int, "events": list }`
  - Lookup CSV headerless or `id,probabilityWeight,payoutMultiplier` — use header `id,probabilityWeight,payoutMultiplier`

- [ ] **Step 1: Write the failing publish test**

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
import csv
import json
from pathlib import Path

from equilibrium.publish import write_library
from equilibrium.simulate import simulate_round


def test_write_library_roundtrip(tmp_path: Path):
    book = simulate_round(c=15, s=1, draws=[1])
    write_library(tmp_path, [book])
    books = json.loads((tmp_path / "books" / "books_base.json").read_text())
    assert books[0]["id"] == 1
    assert books[0]["payoutMultiplier"] == 104
    assert books[0]["events"][0]["type"] == "stack"
    for event in books[0]["events"]:
        assert "c" not in event and "s" not in event and "C" not in event and "S" not in event
    rows = list(csv.DictReader((tmp_path / "publish_files" / "lookUpTable_base_0.csv").open()))
    assert rows[0]["id"] == "1"
    assert rows[0]["probabilityWeight"] == "1"
    assert rows[0]["payoutMultiplier"] == "104"
    index = json.loads((tmp_path / "publish_files" / "index.json").read_text())
    assert index["modes"][0]["name"] == "base"
```

- [ ] **Step 2: Run to verify fail**

Run: `cd math && python3 -m pytest tests/test_publish.py -v`

Expected: FAIL import `publish`

- [ ] **Step 3: Implement publisher**

`math/equilibrium/publish.py`:

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import csv
import json
from pathlib import Path


def write_library(out_dir: Path, books: list[dict]) -> None:
    numbered = []
    for i, raw in enumerate(books, start=1):
        numbered.append(
            {
                "id": i,
                "payoutMultiplier": raw["payoutMultiplier"],
                "events": raw["events"],
            }
        )
    books_dir = out_dir / "books"
    pub = out_dir / "publish_files"
    books_dir.mkdir(parents=True, exist_ok=True)
    pub.mkdir(parents=True, exist_ok=True)
    (books_dir / "books_base.json").write_text(json.dumps(numbered))
    with (pub / "books_base.jsonl").open("w") as fh:
        for row in numbered:
            fh.write(json.dumps(row) + "\n")
    with (pub / "lookUpTable_base_0.csv").open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["id", "probabilityWeight", "payoutMultiplier"])
        w.writeheader()
        for row in numbered:
            w.writerow(
                {
                    "id": row["id"],
                    "probabilityWeight": 1,
                    "payoutMultiplier": row["payoutMultiplier"],
                }
            )
    (pub / "index.json").write_text(
        json.dumps(
            {
                "modes": [
                    {
                        "name": "base",
                        "cost": 1,
                        "events": "books_base.jsonl",
                        "weights": "lookUpTable_base_0.csv",
                    }
                ]
            }
        )
    )
```

`math/generate.py` (used in Task 3; include now so Task 2 commit has the CLI stub that writes 20 books for manual check):

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import argparse
import random
from pathlib import Path

from equilibrium.publish import write_library
from equilibrium.simulate import run_round


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=20)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "library")
    args = parser.parse_args()
    rng = random.Random(args.seed)
    books = [run_round(rng) for _ in range(args.count)]
    write_library(args.out, books)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Tests pass**

Run: `cd math && python3 -m pytest tests/test_publish.py -v`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add math
git commit -m "feat(math): publish Engine-shaped book library files"
```

---

### Task 3: RTP gate and 100k library

**Files:**
- Create: `math/tests/test_rtp.py`
- Modify: `math/equilibrium/publish.py` — add `write_library(..., weights: list[int] | None = None)` so `probabilityWeight` can be tuned
- Modify: `math/generate.py` — default `--count 100000`

**Interfaces:**
- Consumes: `run_round`, `write_library`
- Produces: empirical RTP in `[0.90, 0.98]`; `generate.py --count 100000` writes `math/library/` (gitignored)

RTP for equal-weight books is `mean(payoutMultiplier / 100)` because a 1.00 bet pays `payoutMultiplier/100` credits.

If raw `mean(px/100)` is **outside** 90–98%, implement **rejection sampling in `generate.py`**: keep drawing `run_round` until 100k books whose running mean is in range is not valid (biased). Instead **reweight**: start with 100k i.i.d. books. Let `m_i = px_i / 100`. If `mean(m)` is `r` and target is `0.96`, set each `probabilityWeight` to `1` for all (optimizer later). If `r` is already in 90–98%, **do not reweight**. If `r > 0.98` or `r < 0.90`, mix in extra bust or extra win books:

```python
def mix_to_band(books: list[dict], target: float = 0.96) -> list[dict]:
    r = sum(b["payoutMultiplier"] / 100 for b in books) / len(books)
    if 0.90 <= r <= 0.98:
        return books
    # Duplicate random busts or wins until mean in band (cap 20 passes)
    rng = random.Random(0)
    busts = [b for b in books if b["payoutMultiplier"] == 0]
    wins = [b for b in books if b["payoutMultiplier"] > 0]
    out = list(books)
    for _ in range(20):
        r = sum(b["payoutMultiplier"] / 100 for b in out) / len(out)
        if 0.90 <= r <= 0.98:
            return out
        if r > 0.98 and busts:
            out.append(rng.choice(busts))
        elif r < 0.90 and wins:
            out.append(rng.choice(wins))
        else:
            break
    return out
```

Put `mix_to_band` in `publish.py`. Test it with a tiny list of all-win books and assert the mixed mean is ≤ 0.98.

- [ ] **Step 1: Write failing RTP test (small n for unit, plus a function test)**

```python
# Copyright (c) 2026 jmenichole. All rights reserved.
import random

from equilibrium.publish import mix_to_band
from equilibrium.simulate import run_round, simulate_round


def test_mix_pulls_all_wins_into_band():
    win = simulate_round(c=15, s=1, draws=[1])
    books = [win] * 10
    mixed = mix_to_band(books, target=0.96)
    r = sum(b["payoutMultiplier"] / 100 for b in mixed) / len(mixed)
    assert 0.90 <= r <= 0.98


def test_100k_rtp_in_band():
    rng = random.Random(1)
    books = [run_round(rng) for _ in range(100_000)]
    books = mix_to_band(books, target=0.96)
    r = sum(b["payoutMultiplier"] / 100 for b in books) / len(books)
    assert 0.90 <= r <= 0.98
    wins = sum(1 for b in books if b["payoutMultiplier"] > 0)
    assert wins > 1000
    assert max(b["payoutMultiplier"] for b in books) > 100
```

`test_mix_pulls_all_wins_into_band` will not enter band by appending wins; need busts in the pool. Change mix to **synthesize a bust book** if `busts` is empty:

```python
EMPTY_BUST = {
    "payoutMultiplier": 0,
    "events": [
        {"index": 0, "type": "bust"},
        {"index": 1, "type": "setTotalWin", "amount": 0},
        {"index": 2, "type": "finalWin", "amount": 0},
    ],
}
```

Use `simulate_round(c=0, s=1, draws=[1])` as the bust template inside `mix_to_band` when `busts` is empty. Use `simulate_round(c=15, s=1, draws=[1])` when `wins` is empty.

- [ ] **Step 2: Run fail**

Run: `cd math && python3 -m pytest tests/test_rtp.py::test_mix_pulls_all_wins_into_band -v`

Expected: FAIL `mix_to_band` missing

- [ ] **Step 3: Implement `mix_to_band` and wire `generate.py --count`**

Implement as specified. `generate.py` calls `mix_to_band` before `write_library`.

- [ ] **Step 4: Run mix test then 100k test**

Run: `cd math && python3 -m pytest tests/test_rtp.py -v`

Expected: PASS (100k may take ~10–30s)

- [ ] **Step 5: Commit**

```bash
git add math
git commit -m "feat(math): keep published RTP inside the Engine 90-98% band"
```

---

### Task 4: Frontend scaffold, types, RGS display helpers

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/src/constants.ts`
- Create: `frontend/src/rgs/types.ts`
- Create: `frontend/src/rgs/display.ts`
- Create: `frontend/src/rgs/query.ts`
- Create: `frontend/tests/display.test.ts`
- Create: `frontend/tests/query.test.ts`
- Create: `frontend/tests/copyright.test.ts`
- Modify: root `tests/copyright.test.ts` **or** keep Pages copyright as-is and put Engine copyright tests only under `frontend/tests/copyright.test.ts` (walk `frontend/src`, `frontend/tests`, `frontend/index.html`, `frontend/vite.config.ts`, `frontend/vite`)

**Interfaces:**
- Consumes: nothing from Python at runtime
- Produces:
  - `BookEvent` union: `{index:number,type:'stack',weight:1|3|7,totalWeight:number,payoutMultiplier:number} | {index:number,type:'bust'} | {index:number,type:'setTotalWin',amount:number} | {index:number,type:'finalWin',amount:number}`
  - `displayPayoutX(payoutMultiplier: number) -> string` e.g. `104` → `1.04` (truncate, no round-up: `Math.floor(px) / 100` formatted to 2 decimals)
  - `formatRgsAmount(amount: number) -> string` same truncation as Pages `formatAmount` (`AMOUNT_SCALE = 1_000_000`)
  - `readRgsQuery(search: string) -> { rgsUrl: string, sessionID: string }`
  - `COPYRIGHT_NOTICE`, `DISCLAIMER`, `GAME_TITLE = 'Equilibrium'`

- [ ] **Step 1: Write failing display/query/copyright tests**

`frontend/package.json`:

```json
{
  "name": "equilibrium-engine-frontend",
  "private": true,
  "version": "0.1.0",
  "license": "UNLICENSED",
  "author": "jmenichole",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "stake-engine": "^0.1.0"
  },
  "devDependencies": {
    "happy-dom": "^20.11.6",
    "typescript": "^5.9.0",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

If `npm install` fails on `stake-engine` version, install whatever latest `stake-engine` npm publishes and pin that version in package.json. The code must still go through `createRgs` in Task 5 so tests do not require a live Engine.

Display tests (write first, then install):

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { displayPayoutX, formatRgsAmount } from '../src/rgs/display';

test('displayPayoutX truncates 104 → 1.04', () => {
  expect(displayPayoutX(104)).toBe('1.04');
});

test('formatRgsAmount floors like the pitch demo', () => {
  expect(formatRgsAmount(1_000_000)).toBe('1.00');
  expect(formatRgsAmount(1_040_000)).toBe('1.04');
});
```

Query test: `readRgsQuery('?sessionID=abc&rgs_url=https://rgs.example/v1')` equals `{ sessionID: 'abc', rgsUrl: 'https://rgs.example/v1' }`. Missing params: `sessionID` `''`, `rgsUrl` `''`.

Copyright test: walk `frontend` for `.ts/.css/.html/.yml` and `LICENSE` is still the **repo root** LICENSE (already has the notice). Frontend files must contain the notice string.

- [ ] **Step 2: `cd frontend && npm install && npm test`**

Expected: FAIL missing modules

- [ ] **Step 3: Implement constants, display, query, tsconfig, vite, index.html**

`displayPayoutX`:

```ts
export function displayPayoutX(payoutMultiplier: number): string {
  const hundredths = Math.floor(payoutMultiplier);
  const whole = Math.floor(hundredths / 100);
  const frac = hundredths % 100;
  return `${whole}.${frac.toString().padStart(2, '0')}`;
}
```

`formatRgsAmount`: copy the pitch `formatAmount` logic with `AMOUNT_SCALE = 1_000_000`.

`DISCLAIMER` in `frontend/src/constants.ts`:

```
Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. Copyright (c) 2026 jmenichole. All rights reserved.
```

`vite.config.ts`: `base: './'`, vitest `environment: 'happy-dom'`.

- [ ] **Step 4: Tests pass**

Run: `cd frontend && npm test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "feat(frontend): scaffold Engine UI display helpers"
```

---

### Task 5: RGS client + dev mock

**Files:**
- Create: `frontend/src/rgs/client.ts`
- Create: `frontend/vite/devRgs.ts`
- Modify: `frontend/vite.config.ts` — plugin `devRgs({ mathDir })` where `mathDir` is `path.resolve(__dirname, '../math/library')`
- Create: `frontend/tests/client.test.ts`
- Create: `frontend/tests/devRgs.test.ts` (optional: test amount scaling in a pure function extracted from the plugin)

**Interfaces:**
- Consumes: `BookEvent`, `readRgsQuery`
- Produces:
  - `createRgs(rgsUrl: string, sessionID: string): RgsApi`
  - `RgsApi.authenticate(): Promise<{ balance: { amount: number, currency: string }, config: { betLevels: number[], minBet: number, maxBet: number, stepBet: number }, round: { active: boolean, state: BookEvent[] } | null }>`
  - `RgsApi.play(amount: number, mode: 'base'): Promise<{ balance: { amount: number }, round: { active: boolean, state: BookEvent[], payoutMultiplier: number } }>`
  - `RgsApi.endRound(): Promise<{ balance: { amount: number } }>`
  - `scaleBookForBet(book, betAmount: number): BookEvent[]` — multiply `setTotalWin`/`finalWin` `amount` by `betAmount / 1_000_000` using `Math.floor`

Dev plugin behavior:
- `POST /wallet/authenticate` → balance `1_000_000_000`, betLevels the pitch list `[100000,200000,500000,1000000,2000000,5000000,10000000]`, minBet `100000`, maxBet `10000000`, stepBet `100000`, empty round unless `activePlay` in memory
- `POST /wallet/play` body JSON `{ amount, mode }` — debit amount, weighted-pick a book from `books/books_base.json` + lookup CSV (weight column), scale events, store as `activePlay`, return round.active true
- `POST /wallet/end-round` — if payoutMultiplier > 0 credit `floor(bet * px / 100)`, clear active, return balance
- `GET /wallet/balance` → current amount
- If `math/library` is missing, plugin generates **on the fly** 200 books via spawning `python3 math/generate.py --count 200 --out math/library` once, **or** ship `frontend/tests/fixtures/books_base.json` with ≥2 books (one win, one bust) and point tests at the fixture. **Prefer a committed fixture** `math/fixtures/books_base.min.json` with two books from Task 1 examples so CI does not need 100k generate. Dev plugin reads `math/library/books/books_base.json` if present, else the fixture.

Extract `pickBook(books, weights, rng)` and `scaleBookForBet` into `frontend/src/rgs/books.ts` so tests do not boot Vite.

- [ ] **Step 1: Failing tests for `scaleBookForBet` and `createRgs` with fetch mock**

```ts
/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */
import { expect, test } from 'vitest';
import { scaleBookForBet } from '../src/rgs/books';

test('scales unit-bet win amounts', () => {
  const events = scaleBookForBet(
    [
      { index: 0, type: 'stack', weight: 1, totalWeight: 1, payoutMultiplier: 104 },
      { index: 1, type: 'setTotalWin', amount: 1_040_000 },
      { index: 2, type: 'finalWin', amount: 1_040_000 },
    ],
    2_000_000,
  );
  expect(events[1]).toMatchObject({ type: 'setTotalWin', amount: 2_080_000 });
});
```

`createRgs` test: mock `globalThis.fetch` to capture URL `https://rgs.example/wallet/play` when `rgsUrl` is `https://rgs.example`.

- [ ] **Step 2: Run fail**

Run: `cd frontend && npm test -- tests/books.test.ts`

Expected: FAIL missing `books.ts`

- [ ] **Step 3: Implement `books.ts`, `client.ts`, `devRgs.ts`**

`createRgs` posts JSON to `${rgsUrl.replace(/\/$/, '')}/wallet/authenticate` etc. Include `sessionID` query or body as Stake docs require: **body `{ sessionID }` plus header if the installed `stake-engine` types show it**. If using raw fetch (allowed if wrapping the same paths), send `{ sessionID, amount, mode }` JSON.

Also export `createRgsFromWindow()` using `readRgsQuery(window.location.search)` and default `rgsUrl` to `window.location.origin` when empty so `npm run dev` hits the Vite plugin.

- [ ] **Step 4: Tests pass**

Run: `cd frontend && npm test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend math/fixtures
git commit -m "feat(frontend): add RGS client and bet-scaled books"
```

---

### Task 6: Shelf view + event replay

**Files:**
- Create: `frontend/src/game/shelfView.ts`
- Create: `frontend/src/game/replay.ts`
- Create: `frontend/tests/shelfView.test.ts`
- Create: `frontend/tests/replay.test.ts`

**Interfaces:**
- Consumes: `BookEvent`
- Produces:
  - `class ShelfView { constructor(host: HTMLElement); render(input: { pieces: { weight: number }[]; phase: 'idle'|'playing'|'bust'|'win'; totalWeight: number }): void }`
  - Sag: rotate shelf by `totalWeight / 15 * 6` degrees plus 0.3deg idle sin; **do not take C or S**
  - Book rect height `Math.max(14, weight * 10)`
  - Bust: add class `is-bust`; win: add class `is-win`
  - `playBookEvents(events, handlers): Promise<void>` awaits each handler in order
  - `handlers: { stack, bust, setTotalWin, finalWin }`

- [ ] **Step 1: Failing tests**

Shelf: mount a div, `render` one weight-7 piece, expect an SVG and a rect; `innerHTML` must not contain `C` or ` / 15` as a HUD string. Replay: record handler call order for `[stack, setTotalWin, finalWin]`.

- [ ] **Step 2: Run fail**

Expected: FAIL missing modules

- [ ] **Step 3: Implement SVG shelf (unique colors, not copied from web-sdk) and replay**

Replay:

```ts
export async function playBookEvents(
  events: BookEvent[],
  handlers: {
    stack: (e: Extract<BookEvent, { type: 'stack' }>) => void | Promise<void>;
    bust: () => void | Promise<void>;
    setTotalWin: (e: Extract<BookEvent, { type: 'setTotalWin' }>) => void | Promise<void>;
    finalWin: (e: Extract<BookEvent, { type: 'finalWin' }>) => void | Promise<void>;
  },
): Promise<void> {
  for (const event of events) {
    if (event.type === 'stack') await handlers.stack(event);
    else if (event.type === 'bust') await handlers.bust();
    else if (event.type === 'setTotalWin') await handlers.setTotalWin(event);
    else if (event.type === 'finalWin') await handlers.finalWin(event);
  }
}
```

Keep stack animation delay to `40ms` in the app, **0ms in tests** by passing optional `delayMs` default 0 in replay, app uses 40.

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "feat(frontend): replay books onto an SVG shelf"
```

---

### Task 7: App chrome (Play, bets, info, mute, spacebar)

**Files:**
- Create: `frontend/src/game/app.ts`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/main.ts`
- Modify: `frontend/index.html` — `<div id="app">`, title Equilibrium
- Create: `frontend/tests/app.test.ts`

**Interfaces:**
- Consumes: `RgsApi`, `ShelfView`, `playBookEvents`, `displayPayoutX`, `formatRgsAmount`, `DISCLAIMER`
- Produces: `class EquilibriumEngineApp { constructor(root, rgs: RgsApi); mount(): Promise<void> }`
- DOM ids: `balance`, `bet`, `btn-play`, `hint` (hero `×` only, e.g. `×1.00`), `win`, `btn-info`, `info-panel`, `disclaimer`, `btn-sound`, `shelf-slot`
- No `btn-cashout`, no `btn-safe`, no survive `%`, no ` / 15` visible text
- Play disabled while `busy` (request or replay)
- Spacebar: if Play enabled, `click` it; `preventDefault`
- Sound: toggle `muted` class / `aria-pressed`; no actual samples required (mute still flips state)
- Info panel lists rules (Play watches the shelf; bust loses; win pays shown `×`), RTP `96%` (or measured string from a constant `RTP_DISPLAY = '96%'`), max win from constant `MAX_WIN_DISPLAY` filled after Task 3 as `×` of the fixture/max — use `MAX_WIN_DISPLAY = '100.00x+'` only if unknown; **after generate, set to the max px from a committed `math/fixtures/meta.json` `{ "rtp": "96%", "maxWinX": "12.45" }` written in Task 3 generate path**. Add to Task 3 `generate.py` writing `meta.json` with rtp and max. Task 7 reads `RTP_DISPLAY` / `MAX_WIN_X` from `frontend/src/constants.ts` copied from fixture meta (manual numbers in constants are OK: `RTP_DISPLAY = '96%'`, `MAX_WIN_X = '50.00'` placeholder replaced once 100k run exists — **write `math/fixtures/meta.json` in Task 3** from the 100k test by having the test write it, or hardcode after first local generate). For determinism, Task 3 test asserts max > 1.00× and Task 7 constants use `RTP_DISPLAY = '96%'` and `MAX_WIN_X` from `simulate_round` longest reasonable cap: set `MAX_WIN_X = '200.00'` in rules as an upper bound listed in copy, and keep math honest. Spec: max win must match rules. **Task 3 test writes `math/fixtures/meta.json`** with actual max from the 100k sample. Task 7 imports JSON. Vite supports `resolveJsonModule`.

- [ ] **Step 1: Failing app tests with a fake `RgsApi`**

Fake `play` returns the pebble-win book scaled. After `mount` + click `#btn-play`, wait for replay, expect `#hint` to contain `1.04` and `#win` to contain `1.04` (from `setTotalWin.amount` via `formatRgsAmount`), not from `1_000_000 * 1.04` computed in the assertion source as the app's method. Also expect `#disclaimer` to contain `Remote Game Server`. Expect no `Cash out` button. Spacebar: dispatch `keydown` Space and expect `play` to have been called.

- [ ] **Step 2: Run fail**

- [ ] **Step 3: Implement `EquilibriumEngineApp`**

Layout top-to-bottom: balance, bet `<select>` of `betLevels`, `#btn-play` Play, `#hint` hero `×`, `#shelf-slot`, `#win`, sound, info. Footer copyright. Hero `×` updates **only** in `stack` handler from `event.payoutMultiplier` via `displayPayoutX`. Win text **only** from `setTotalWin.amount` via `formatRgsAmount`. On `bust`, set hero to `0.00`. After replay, call `endRound()`, then `busy = false`.

Bet select: options from authenticate `config.betLevels`. Preserve selected amount in `localStorage` key `equilibrium.bet` so refresh does not snap to default (Task 8 uses this).

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git add frontend
git commit -m "feat(frontend): Play-and-watch Equilibrium shelf app"
```

---

### Task 8: Resume, replay URL, rgs_url host

**Files:**
- Modify: `frontend/src/game/app.ts`
- Modify: `frontend/vite/devRgs.ts` — authenticate returns `round.active` + `state` if play not ended
- Create: `frontend/tests/resume.test.ts`
- Create: `frontend/tests/rgsUrl.test.ts`

**Interfaces:**
- Consumes: `RgsApi.authenticate().round`
- Produces: if `round.active` and `state.length`, `mount` replays then `endRound` (outcome unchanged)
- Replay URL: `?replay=1` (or Stake’s `/bet/replay/...` when `rgs_url` points at real RGS). For the mock: `GET /bet/replay/:id` returns a stored last book; query `replayBook=1` replays fixture win without debit. Info panel button **Replay last** visible after a round, calls the same `playBookEvents` on the last `state` (no second debit). Spec: “allow replay-again at the end.” Implement `#btn-replay` enabled after a finished book, re-runs handlers on cached events, does not call `play`.

- [ ] **Step 1: Tests**

`createRgs` play fetch URL includes the host from `rgsUrl`. Change host, expect different `fetch` URL.

Resume: fake authenticate returns `active: true` and a bust book; `mount` should end with bust UI and call `endRound` once.

Replay last: after a play, click `#btn-replay`, `play` call count stays 1, shelf still renders.

- [ ] **Step 2–4: TDD implement, pass, commit**

```bash
git add frontend
git commit -m "feat(frontend): resume active rounds and replay last book"
```

---

### Task 9: Docs, ACP checklist, copyright walk for python

**Files:**
- Modify: `docs/MANUAL-TASKS.md`
- Modify: `README.md` — Engine frontend + math generate commands
- Modify: `tests/copyright.test.ts` — also walk `frontend/src`, `frontend/tests`, `frontend/vite`, `math/equilibrium`, `math/tests`, `math/generate.py` (python `# Copyright` counts; extend walker to `.py`)
- Create: `math/README.md` — how to run pytest, `python generate.py --count 100000`, then later symlink into StakeEngine/math-sdk `games/` for official `publish_files` zstd; ACP upload is human

**Interfaces:** none

- [ ] **Step 1: Failing copyright test including `.py` and `frontend`**

Extend `walk` to include `.py` and directories `frontend` + `math` excluding `math/library` and `frontend/node_modules`.

- [ ] **Step 2: Run fail if any new file missed the notice**

- [ ] **Step 3: Fix notices; write README sections**

MANUAL-TASKS add:

```
### Stake Engine (human)

- [ ] Create a studio game on engine.stake.com
- [ ] Upload math `publish_files` and frontend `dist/`
- [ ] Tile in the Tile Editor (bright edges, no baked multipliers)
- [ ] Request approval; do not promise listing
```

README Engine:

```
cd math && python3 -m pytest
python3 generate.py --count 100000 --out library
cd ../frontend && npm install && npm test && npm run dev
cd frontend && npm run build   # dist/ for ACP
```

- [ ] **Step 4: `npm test` at repo root (Pages) and `cd frontend && npm test` and `cd math && python3 -m pytest` all pass**

- [ ] **Step 5: Commit**

```bash
git add docs README.md tests/copyright.test.ts math/README.md
git commit -m "docs: Engine generate, dev, and ACP upload checklist"
```

---

## Self-review

**Spec coverage**

| Spec item | Task |
| --- | --- |
| Stateless Play book | 1, 5, 7 |
| Frontend never computes payout | 4 (`display` from fields), 7 tests |
| Bookshelf theme | 6, 7 |
| RTP 90–98%, target 96% | 3 |
| `C`/`S` never in events/DOM | 1, 2, 6, 7 |
| `rgs_url` + `sessionID` | 4, 5, 8 |
| Rules + disclaimer | 7 |
| `math/` + `frontend/` | file map |
| Dev mock from library | 5 |
| `ts-client` / fetch to same paths | 5 |
| Leave Pages `src/` alone | global constraint |
| EndRound after animation | 7 |
| Resume if active | 8 |
| Replay again | 8 |
| Spacebar, mute, bet levels | 7 |
| Static `base: './'` | 4 |
| No cash-out / no item tray | 7 tests |
| ACP human | 9 |
| English disclaimer | 4, 7 |
| Mini-player: CSS in 7 must not use a fixed huge board; `max-width: 100%` on `#shelf-slot` SVG | 7 styles |

**Placeholders:** none remaining. `stake-engine` npm version: pin whatever installs; wrap with `createRgs` so tests stay offline.

**Types:** `BookEvent` defined in Task 4 and used in 5–8. `simulate_round` dict matches those event shapes. `payoutMultiplier` is ×100 everywhere after `bps_to_x100`.
