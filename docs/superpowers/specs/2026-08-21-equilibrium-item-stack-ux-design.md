# Equilibrium — Item-stack UX design

**Date:** 2026-08-21  
**Status:** Draft for review  
**Repo:** `jmenichole/equilibrium`  
**Supersedes (UI only):** the UI, player-facing labels, and HUD decisions in `2026-08-21-equilibrium-pitch-demo-design.md`

A presentation pass on the live pitch demo. The player picks named items, stacks them on a scale, and each stacked item multiplies. Round math, `GameServer`, hidden `C`, and RTP do not change.

## Goal

A stranger opening https://jmenichole.github.io/equilibrium/ understands the loop without a walkthrough: **choose a bet → stack an item → cash out or stack more**. The page must not read as a risk-tier picker (Safe / Medium / Heavy) or as a load puzzle (`3 / 15`, survive %).

**Success**

- Item cards are named objects: Pebble, Brick, Anvil
- Hero number is the current round multiplier
- Each card shows that item’s weight and the multiplier after stacking it
- No visible load meter, no survive %
- Cash out is the only win, visually the main gold action, enabled after the first stacked item
- Engine ids, quotes, and payout math stay as they are today

**Out of scope**

- Changing `C` distribution, weights `1 / 3 / 7`, house edge, or payout formula
- Stake Engine, Bink, accounts, real money
- Unique illustrated item art, extra motion packs, sound, tutorial overlay
- New error types or a new server API

## Player-facing model

Three items sit on a tray. Each has a **weight**. Stacking an item that fits **multiplies** the round. The scale can break; if it does, the bet is gone. **Cash out** is the only way to keep the multiplied payout.

Internal block ids remain `safe | medium | heavy` so `LocalGameServer` and math tests stay valid.

| Id | Player label | Weight |
| --- | --- | --- |
| `safe` | Pebble | 1 |
| `medium` | Brick | 3 |
| `heavy` | Anvil | 7 |

Copy talks about stacking items, not “safe bets” or “heavy risk.”

## Screen (Crash-like, one page)

Top to bottom:

1. **Header** — play-money balance, PLAY MONEY tag, Reset
2. **Coach line** (`#hint`) — one sentence for the current step
3. **Hero multiplier** — current `multiplierBps`, shown as `×1.00` until the first item stacks. Truncate to two decimals (do not round up)
4. **Bet chips** — same `betLevels` as today; choosing a bet starts the round; chips disabled while `round.active`
5. **Scale** (`#scale-slot`) — stacked items
6. **Item cards** — Pebble, Brick, Anvil (`#btn-safe`, `#btn-medium`, `#btn-heavy`)
7. **Gold Cash out** (`#btn-cashout`) — outside the item row, not grouped as a fourth item
8. **Footer** — `Pitch demo — not on Stake/Bink. © 2026 jmenichole.`

Coach copy:

- Idle: `1. Choose a bet to start.`
- Active, nothing stacked: `2. Stack an item. Heavier items multiply more.`
- Active, at least one item: `3. Cash out, or stack another item.`
- Bust: `The scale broke. You lost this bet — pick a new bet to try again.`
- Cashed out: `Nice. You cashed out. Pick a new bet to play again.`

## Item cards

During an active round each enabled card shows:

- Name (Pebble / Brick / Anvil)
- Weight (`Weight 1` / `Weight 3` / `Weight 7`)
- Next multiplier (`× 1.23`) from `quotes[].nextMultiplierBps`

If the quote says the item cannot fit (`pSurvive = 0` / `fitCount = 0`): card stays visible, is disabled, and says it will not fit. Do **not** show `0%` or a capacity fraction.

Before a round, and after bust or cash-out until a new bet: cards are disabled and show name, weight, and `Place a bet first` — no `×` multiplier.

Survive probability is still computed on the server for the multiplier formula. The client **does not render it**.

## Scale

The beam holds **one rectangle per stacked item**, height from that item’s weight (Pebble short, Anvil tall). Pieces stack in placement order. Wobble intensity is `currentWeight / 15` plus light idle noise. Wobble must not receive `C` or `pSurvive`.

- Bust: platform drops / stack fails; hero multiplier reads `0.00x`
- Cash-out: stack stays; multiplier pulses; balance updates from `endRound`

No physics engine. No two-pan scale.

## Numbers that must not appear

Visible UI must not show:

- Labels Safe, Medium, Heavy
- A load meter such as `3 / 15` or `weight / MAX_C`
- Survive percent on cards or HUD

`#weight` may remain in the DOM as screen-reader-only text if existing tests query it. It is not a visible HUD.

Hidden `C` never appears in events, DOM, copy, or logs.

## Architecture

No new modules. Client presentation only.

| File | Role in this pass |
| --- | --- |
| `src/constants.ts` | Public `label` for each block: Pebble / Brick / Anvil. Weights unchanged |
| `src/client/app.ts` | Crash-like shell, coach copy, card HTML, ignore survive % when rendering |
| `src/client/scaleView.ts` | Draw one piece per accepted item, sized by weight |
| `src/styles.css` | Hero multiplier, item cards, gold cash-out, hide `#weight` visually |
| `tests/client/app.test.ts` | Labels, next multiplier on cards, no visible load/survive HUD |

Unchanged: `src/math/*`, `src/server/*`, RTP Monte Carlo, `GameServer` methods (`play` / `action('DECISION', place)` / `endRound`).

Data flow stays: quotes in `round.state` still include `pSurvive` for math consumers; the view model for cards is `{ label, weight, nextMultiplierBps, canFit }`.

## Errors

Same as the pitch-demo spec. Player-visible strings:

- Insufficient balance for that bet
- That action is not allowed right now
- Coach lines for bust and cash-out

No new `StatusCode` values.

## Testing

Keep these DOM ids: `balance`, `play-money`, `btn-safe`, `btn-medium`, `btn-heavy`, `btn-cashout`, `btn-reset`, `hint`, `footer`, `#scale-slot`. `#weight` may exist as `sr-only`.

Update or add client tests that:

- Cards show Pebble / Brick / Anvil (not Safe / Medium / Heavy)
- During a round, an enabled card includes a `×` next-multiplier
- Document body / visible card text does not include a survive `%` or a ` / 15` load meter
- Cash out stays disabled until the first `blockAccepted`
- PLAY MONEY and footer copyright remain visible

Math and engine tests keep using ids `safe | medium | heavy`. Do not rename those ids in this pass.

## Deployment

Same GitHub Pages pipeline (GitHub Actions, not “deploy from branch”). Copy-only/CSS changes still require a `main` deploy to update the live demo.

## Decisions log

- Presentation pass, not an art pass and not a math change
- Named items: Pebble / Brick / Anvil
- Crash-like layout: coach, hero multiplier, bets, scale, cards, gold cash out
- Hero number is current multiplier; cards show weight + next multiplier
- No visible load meter; no survive %
- Internal ids stay `safe | medium | heavy`
- This spec supersedes the original demo’s Safe/Medium/Heavy labels and full HUD (weight meter + survive %)
