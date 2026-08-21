# Manual tasks (things the agent could not finish)

Copyright (c) 2026 jmenichole. All rights reserved.

Do these in order. Everything else for the pitch demo is already on `main`.

## 1. Turn on GitHub Pages (required for a shareable link)

Deploy failed with `Failed to create deployment (status: 404). Ensure GitHub Pages has been enabled`.

- [ ] Open https://github.com/jmenichole/equilibrium/settings/pages
- [ ] Under **Build and deployment → Source**, choose **GitHub Actions**
- [ ] Save
- [ ] If GitHub asks to create a `github-pages` environment, allow it
- [ ] Re-run the failed workflow: https://github.com/jmenichole/equilibrium/actions/runs/32451578575 → **Re-run failed jobs**
  - Or Actions → **pages** → latest run on `main` → **Re-run all jobs**
- [ ] When the **deploy** job is green, copy the URL from the run (expected: `https://jmenichole.github.io/equilibrium/`)
- [ ] Open that URL on your phone and a laptop; confirm PLAY MONEY, a bet, Safe, Cash Out, and a bust

**If Pages settings are missing or deploy still 404:** this repo is **private**. GitHub Pages for private repos needs GitHub Pro/Team, or you can temporarily make the repo public under Settings → General → Danger zone.

**If the site 404s after a green deploy:** wait 1–2 minutes, hard-refresh, and confirm the URL includes the `/equilibrium/` path.

## 2. Play the pitch yourself (never done in a real browser)

Automated tests passed; nobody sat through a live round.

- [ ] `npm install && npm run dev` (or use the Pages URL from step 1)
- [ ] Start at `1,000.00` play money
- [ ] Place a `1.00` bet, tap **Safe**, confirm multiplier/weight HUD updates, **Cash Out**, confirm balance goes up
- [ ] Place another bet and stack **Heavy** until bust; confirm HUD goes to `0.00x` and the scale drops
- [ ] Mix Safe / Medium / Heavy, then cash out; confirm buttons show weight, next multiplier, and survive %
- [ ] Hit **Reset**; confirm balance is `1,000.00` again
- [ ] Try the same flow on a phone (Pages URL or phone on the same Wi-Fi as `npm run dev`)

## 3. Pitch hygiene

- [ ] Keep the footer visible in screenshots: `Pitch demo — not on Stake/Bink. © 2026 jmenichole.`
- [ ] Say out loud: refresh resets the demo (no resume); math is in-process JS, not a live RGS
- [ ] Do not promise Stake.us or Bink listing from this build

## 4. Later — operators (not in this demo)

- [ ] **Bink:** text the owner; ask for Cluster RGS docs / a sandbox session. Adapter is spec “Later”, item 3.
- [ ] **Stake Engine:** create a Stake Engine account, upload as a stateful original (`Play` → `DECISION` place → `EndRound`). May need their lookup-table/book format. Spec “Later”, item 2.
- [ ] Written license if anyone ships it. Code is proprietary: `Copyright (c) 2026 jmenichole. All rights reserved.`

## 5. Optional cleanup

- [ ] Actions still warn that Node 20 is deprecated on `actions/checkout@v4` / `setup-node@v4`; bump those actions when you next touch CI
- [ ] After Pages works, you can delete the remote branch `cursor/equilibrium-pitch-demo-design-1aad` if it is still listed
