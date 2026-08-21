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

- [ ] Keep the footer in screenshots: `Pitch demo — not on Stake/Bink. © 2026 jmenichole.`
- [ ] Say out loud: refresh resets the demo (no resume); math is in-process JS, not a live RGS
- [ ] Do not promise Stake.us or Bink listing from this build

### Later — operators

- [ ] **Bink:** text the owner; ask for Cluster RGS docs / a sandbox session
- [ ] Written license if anyone ships it (`Copyright (c) 2026 jmenichole. All rights reserved.`)

### Stake Engine (human)

- [ ] Create a studio game on engine.stake.com
- [ ] Upload math `publish_files` and frontend `dist/`
- [ ] Tile in the Tile Editor (bright edges, no baked multipliers)
- [ ] Request approval; do not promise listing

### Optional

- [ ] Bump GitHub Actions that still warn about Node 20 (`checkout@v4` / `setup-node@v4`)
- [ ] Delete leftover remote branches `cursor/equilibrium-pitch-demo-design-1aad` and `cursor/manual-tasks-checklist-1aad` if they are still listed
