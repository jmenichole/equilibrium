# Manual tasks

Copyright (c) 2026 jmenichole. All rights reserved.

Live demo: https://jmenichole.github.io/equilibrium/

## Done

- [x] Make the repo public
- [x] GitHub Pages → Source: **GitHub Actions**
- [x] Deploy the built game (not the blank source `index.html`)
- [x] Confirm https://jmenichole.github.io/equilibrium/ serves `./assets/*.js`

## Still yours

### Play the pitch (not done in a real browser yet)

- [ ] Open https://jmenichole.github.io/equilibrium/ (hard-refresh if you still see a blank page)
- [ ] Start at `1,000.00` play money
- [ ] Place a `1.00` bet, tap **Safe**, confirm multiplier/weight HUD updates, **Cash Out**, confirm balance goes up
- [ ] Place another bet and stack **Heavy** until bust; confirm HUD goes to `0.00x` and the scale drops
- [ ] Mix Safe / Medium / Heavy, then cash out; confirm buttons show weight, next multiplier, and survive %
- [ ] Hit **Reset**; confirm balance is `1,000.00` again
- [ ] Same flow on a phone

### Pitch hygiene

- [ ] Say out loud: refresh resets the demo (no resume); math is in-process JS, not a live RGS
- [ ] Do not promise Stake.us or Bink listing from this build

### Later — operators

- [ ] **Bink:** text the owner; ask for Cluster RGS docs / a sandbox session
- [ ] Written license if anyone ships it (`Copyright (c) 2026 jmenichole. All rights reserved.`)

### Stake Engine (human)

Uploads are **not in git**. After you clone and build, they live under the repo on your machine:

| Upload | Local path (from repo root) | Create with |
| --- | --- | --- |
| Math | `math/library/publish_files/` | `cd math && python3 generate.py --count 100000 --out library` (96.5% weights) |
| Frontend | `frontend/dist/` | `cd frontend && npm run build` |
| Tile | `docs/assets/overdue-tile.png` | bright edges, no baked × |

- [ ] Re-import math `publish_files` after generate; confirm Engine math page ~96.5% RTP
- [ ] Re-import entire `frontend/dist` (new hashed JS/CSS)
- [ ] Replace game tile with `docs/assets/overdue-tile.png`
- [ ] Play: pile grows, gold hold on win, books collapse on bust, mute silences tones (tap Play or Sound first so the browser allows audio)
- [ ] Then Start Approval (math + frontend). Do not promise listing.

### Optional

- [ ] Bump GitHub Actions that still warn about Node 20 (`checkout@v4` / `setup-node@v4`)
- [ ] Delete leftover remote branches `cursor/equilibrium-pitch-demo-design-1aad` and `cursor/manual-tasks-checklist-1aad` if they are still listed
