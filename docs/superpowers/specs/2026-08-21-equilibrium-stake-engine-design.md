# Equilibrium — Stake Engine submission design

**Date:** 2026-08-21  
**Status:** Draft for review  
**Repo:** `jmenichole/equilibrium`  
**Supersedes:** player-timed cash-out and item-tray UX in `2026-08-21-equilibrium-item-stack-ux-design.md` for the Engine product. The GitHub Pages pitch demo may remain as a separate toy; it is not what we upload to Stake.

A **stateless** Stake Engine original: the player sets a bet, hits Play, and watches books stack on a shelf. Win or bust is already in the RGS book. No Stack button, no Cash out button.

## Goal

Ship a game that can be uploaded to [Stake Engine](https://engine.stake.com/) and pass the provider [approval guidelines](https://stake-engine.com/docs/approval-guidelines): math books, animation-only frontend, required UI chrome.

**Success**

- One Play returns a complete round (`round.state` events + `payoutMultiplier`)
- Frontend never computes payouts; it only replays events and displays RGS amounts
- Theme is a **shelf of books** (thin / thick / tome), not a risk HUD
- RTP for the single BASE mode is in **90.0%–98.0%**
- Hidden capacity `C` and stop `S` never appear in events, DOM, logs, or rules copy
- Static frontend build (`base: './'`), `rgs_url` + `sessionID` from the query string
- Rules panel includes RTP, max win, and the Engine disclaimer points

**Out of scope**

- Player-chosen cash-out or mid-round Stack (rejected as early cash-out / stateful)
- Stake Engine ACP account, tile editor, and clicking submit (human)
- Stake.US jurisdiction scrub for this version (English-only, not `us_` bet template)
- Bink, real-money wallet outside Engine
- Forking the full Svelte/Pixi `web-sdk` monorepo
- Unique painted illustration pack (SVG books are enough; no sample-game assets from `web-sdk`)

## Player fantasy

A shelf. Books of three sizes land one after another. The multiplier climbs. Sometimes the shelf holds and you are paid. Sometimes it collapses and the bet is gone. You do not choose when it stops.

Title: **Equilibrium**. No Megaways / Xways / Stake™ / Kick™ branding.

## Round (player)

1. Authenticate. Show balance and RGS `betLevels` (also honor `minBet`, `maxBet`, `stepBet`).
2. Player picks a bet and hits **Play** (spacebar = Play).
3. Frontend calls `Play`, then plays `round.state` in order.
4. Each `stack` event adds one book (size from `weight` 1 / 3 / 7) and sets the hero `×` from that event’s `payoutMultiplier`.
5. `bust` collapses the shelf. `setTotalWin` / `finalWin` show the RGS amount (`0` on bust).
6. After animations, `EndRound`. Play has already returned the full book; `active` stays true until EndRound so a refresh can replay the same events.
7. Info (`i`) always available: rules, RTP, max win, how Play works, disclaimer.

No item tray. No numbered coach. No load meter. No survive %. No visible weight numerals on the books.

## Math (simulation only)

Implemented in Python with **StakeEngine/math-sdk**, not in the browser.

**Capacity.** `C` uniform on `{0, 1, …, 15}`.

**Stop.** `S` uniform on `{1, 2, …, 15}`. This is the cash-out the player is not allowed to choose. If `S > C`, the round cannot win (a piece will bust before stacked weight can reach `S`).

**Pieces.** Each step draws uniformly from weights `{1, 3, 7}` (ids `safe` / `medium` / `heavy` internally only).

**Step.** Let `x` be current stacked weight, `m` current multiplier (start `1.00`, stored in math-sdk’s payout units).

- If `x + w > C` → bust, `payoutMultiplier = 0`.
- Else accept: `x ← x + w`, `m ← floor4(m × 0.98 / pSurvive(x_before, w))` with the same Bayesian `pSurvive` as the pitch demo (`remainCount` / `fitCount` on `{0…15}`).
- If `x >= S` → win, pay current `m`.

`pSurvive` is only for the multiplier formula inside the simulator. It is not written to the book.

**Published outcome.** math-sdk writes lookup tables + books. The live RGS picks a book by `probabilityWeight`. Round payout is the book’s `payoutMultiplier`. Stake Engine stores that as an integer **multiplier × 100** (example: `123` = `1.23×`). The simulator may use 4-decimal bps internally; it converts when writing the book. The frontend never converts a local `m`; it displays RGS fields only.

**RTP.** Single BASE mode, cost 1×. Target **96.0%** (must land in 90–98%; optimizer may adjust lookup weights). Max win = highest simulated `m` on a win book; must be listed in rules and realistically obtainable (not rarer than about 1 in 10 million).

**Modes.** One mode only: `base`. No bonus buy, no gamble, no jackpot.

## Book events

Every event has `index` and `type`. No fields for `C` or `S`. Do not emit quotes, survive %, or offers.

| type | Fields | Frontend |
| --- | --- | --- |
| `stack` | `weight` (`1` \| `3` \| `7`), `totalWeight`, `payoutMultiplier` (current × 100) | Slide on a book of that size; set hero `×` from `payoutMultiplier` |
| `bust` | none extra | Collapse; hero `×0.00` |
| `setTotalWin` | `amount` (RGS win units, `0` on bust) | Show running win text from this field |
| `finalWin` | `amount` | End-of-round win display from this field |

Paying round: `stack`+ then `setTotalWin` then `finalWin`. Bust round: `stack`* (zero or more) then `bust` then `setTotalWin` (`0`) then `finalWin` (`0`).

`weight` on `stack` is for **sprite size only**. Do not label it on screen.

## Screen

Stake-originals sparse layout, desktop and mobile, plus Engine mini-player (board must not distort in the popout).

- Header: balance, bet control (all auth bet levels), sound toggle, info
- Center: hero multiplier, SVG **shelf**, stacked book rects (height from `weight`)
- Primary: **Play**
- Footer / info: rules + disclaimer
- Wobble/sag uses `totalWeight / 15` plus idle noise from **event totalWeight only**, never `C`

Win amounts for non-zero payouts must be clearly shown. Spacebar → Play. Sound can be muted.

## Architecture

```
math/          Python math-sdk game (simulate → library/publish_files + uncompressed books)
frontend/      Vite + TypeScript UI; RGS client; shelf view; event replay
```

Dev: Vite plugin (or local mock) implements `/wallet/authenticate`, `/wallet/play`, `/wallet/end-round`, `/wallet/balance` by weighted-picking a published book from `math/library`. Same frontend code path as production.

Prod: `RGSClient` from `stake-engine` (`ts-client`). Server URL **only** from `rgs_url`. Session from `sessionID`. No hardcoded RGS host. No client ledger.

Existing `src/` Pages demo is **not** the upload artifact. Do not teach the Engine frontend to call `LocalGameServer` for settlement.

| Unit | Does | Depends on |
| --- | --- | --- |
| `math/` GameState | Roll `C`/`S`, stack loop, emit events, payout | math-sdk |
| Dev RGS mock | Auth, pick book, return `round.state` | `math/library` |
| `frontend` RGS module | HTTP to `rgs_url` | query params |
| Event replay | Await handlers in order | `round.state` |
| Shelf view | Draw books + sag + bust/win | stack events only |

## Approval chrome (in the build)

- Detailed rules: Play watches the shelf; three book sizes; bust loses the bet; win pays the shown `×`
- RTP and max win for `base`
- Disclaimer covering: malfunction voids; connection required; reload to finish; RTP over many plays; display is illustrative; **winnings from RGS not the browser**; copyright (jmenichole + required Engine notice as specified in their template)
- Unique SVG/CSS assets (not web-sdk sample backgrounds/symbols)
- Static files only; fonts and images from the game CDN path, no Google Fonts
- Replay URL: play the given round’s events; allow replay-again at the end
- English only; other `lang` values must not corrupt glyphs

## Errors

Frontend disables Play while a request or book animation is in flight. Server still rejects bad bets.

Show a short message for invalid session (`ERR_IS` equivalent), bet not in range, and generic “action not allowed.” Network drop: instruct reload (disclaimer). Do not invent a payout if Play fails.

Refresh: restore the selected bet (must not snap back to default). If authenticate still has this round `active` (EndRound not yet called), replay the same book events, then EndRound. The outcome does not change.

## Testing

**Math**

- Events never contain `C` or `S`
- Bust when `x + w > C`; win when `x >= S` after accept
- Multiplier step matches `floor4(m × 0.98 / pSurvive)`
- ≥ 100k simulations; RTP in 90–98%; target 96% within optimizer tolerance
- Max-win book exists; hit-rate not almost-all-zero

**Frontend**

- Hero `×` and win text come from event/RGS fields, not `bet * localMultiplier`
- Play locked during replay of a book
- Info + disclaimer visible
- Muting sound works; spacebar triggers Play when enabled
- Changing `rgs_url` changes the host called

No visual regression suite. No live Engine account in CI.

## Deployment

- **Dev:** `frontend` + mock RGS + `math/library`
- **Submit:** upload `math/.../publish_files` and `frontend` `dist/` in ACP (human)
- **Pages:** optional; not the approval target

## Decisions log

- Submit via Stake Engine, not Bink, for this product
- Stateless Play-and-watch (no player cash-out) so approval’s “no early cash-out” rule is met
- Theme: physical books on a shelf; title remains Equilibrium
- Hidden `C` + hidden `S` + random 1/3/7 inside the simulator
- Architecture: `math/` + `frontend/` with `ts-client`; do not fork web-sdk
- Single BASE mode, RTP target 96%
- ACP tile, studio login, and review request are human
