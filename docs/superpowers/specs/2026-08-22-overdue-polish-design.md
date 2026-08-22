# Overdue — shelf polish and submission design

**Date:** 2026-08-22  
**Status:** Draft for review  
**Repo:** `jmenichole/equilibrium`  
**ACP title:** Overdue (Majik Gaming). Code/repo may still say Equilibrium.  
**Builds on:** `2026-08-21-equilibrium-stake-engine-design.md`  
**Checklist:** [Stake Engine submission checklist](https://stake-engine.com/docs/approval-guidelines/submission-checklist)

This spec is the visual and RTP polish for the already-published Engine game. Math events, Play-and-watch, and no cash-out do not change.

## Goal

Make Overdue read as a finished original: a **pile of books on a shelf** that either steadies (win) or **topples** (bust), with **96.5%** advertised RTP, then re-upload frontend + math for approval.

**Success**

- Pile grows on a still shelf; last book is thin, regular, or tome (visual size only)
- Bust: books collapse; shelf does not tip; hero `×0.00`; win amount `0`
- Win: pile steadies, gold glow, hero `×` holds; RGS win amount shown
- Medium pace (readable land, then outcome)
- Single `base` mode; no difficulty; no extra multiplier tables
- Lookup weights retuned so Engine math summary RTP is **96.5%** (±0.5% band)
- Keep current hit profile (~40%+ >0 wins) and ~**15.05×** max — do not chase a 3–8% hit-rate
- Rules, RTP, max win, sizes-are-visual copy, and Engine disclaimer (including Stake Engine TM/© plus `Copyright (c) 2026 jmenichole. All rights reserved.`)
- Brighter game tile (no dark-on-dark edges)
- `rgs_url` + session; EndRound only when `round.active`; recover leftover rounds
- Static `frontend/dist`; no payout math in the UI
- Hidden `C` / `S` still never appear

**Out of scope**

- Scale / Safe / Medium / Heavy / cash-out (Pages pitch only)
- Second bet mode or “difficulty”
- Raising max win or lowering hit-rate
- Stake.US `us_` template this round
- Painted illustration pack; SVG pile is enough
- Human ACP click-submit (Jamie)

## Player fantasy

A wooden shelf. Books land into a **pile**. Any size can be too much. If the pile holds, it glows gold and you are paid the `×` you saw. If it falls, the books go and the bet is gone. You only press Play.

## Round

Unchanged RGS loop: Authenticate → bet from RGS levels → Play → replay `stack` / `bust` / `setTotalWin` / `finalWin` → EndRound if still active.

Visual mapping:

| Event | Look |
| --- | --- |
| `stack` | One book drops onto the pile (height/width from `weight` 1 / 3 / 7, no numerals). Hero `×` from that event’s `payoutMultiplier`. |
| `bust` | Pile topples. Shelf stays. `×0.00`. |
| `setTotalWin` / `finalWin` | Show RGS `amount`. Win: gold hold. Bust: stay collapsed. |

Pace: medium. Spacebar = Play. Mute in UI.

## Math

Same simulator and event schema. Change **lookup `probabilityWeight` target** from 0.96 to **0.965** (accept 0.960–0.970). Regenerate `publish_files` (headerless LUT, `books_base.jsonl.zst` in `index.json`). Re-publish math. Do not add modes.

Advertised rules: **RTP 96.5%**, **max win ×15.05** (or the new library’s true max if it differs — list the real cap). Hit-rate stays high on purpose: 15× cap cannot fund a 3–8% hit game at 96.5% RTP.

## Screen

- Header: balance, bet, Play, sound, info
- Center: hero `×`, shelf + **vertical pile**
- Win line under the shelf
- Info: how Play works; three sizes are cosmetic; RTP; max win; no survive % / capacity meter
- Desktop, mobile, Engine popout: pile must not clip or distort
- Tile: bright board, gold rim, readable at thumbnail; no multipliers in the art

## Approval notes (from the checklist)

Keep: unique title **Overdue**, no Megaways/Xways, auth + Play + `rgs_url`, bet levels, spacebar, mute, info RTP/max.

Add in this pass: per-size “visual only” rules; Stake Engine TM/© in the disclaimer; bright tile; mid-round refresh keeps selected bet; replay URL still replays the book.

Do not submit for approval until this polish is on Engine (math 96.5% + new `dist`). After approval, math/mechanics cannot change.

## Architecture

No new packages. `math/equilibrium/publish.py` target RTP 0.965. `frontend` shelf view = pile + collapse + gold win; replay timing medium. Tests: pile grows with stacks; bust class without shelf-tip as the lose; win glow class; weights still hit 96.0–97.0% RTP; `C`/`S` absent from DOM.

## Human upload

1. `python generate.py --count 100000 --out library` with the new target  
2. Import `math/library/publish_files` (3 Engine files)  
3. `frontend` `npm run build` → import entire `dist`  
4. Replace tile  
5. Confirm Engine math page ~96.5% RTP, then Start Approval (math + frontend)
