# Equilibrium — Pitch Demo Design

**Date:** 2026-08-21  
**Status:** Draft for review  
**Repo:** `jmenichole/equilibrium`

A playable, shareable browser original: stack three block sizes on a digital scale, cash out before a hidden capacity is exceeded. Built to demo in a pitch to social casinos (Stake.us / Bink.bet). This spec is the pitch demo only. It does not integrate Stake Engine or Bink Cluster.

## Goal

A stranger can open a link, bet play money, mix Safe / Medium / Heavy blocks, and cash out or bust, without a walkthrough. The loop should read as an original category (not a Crash skin): the player chooses *how much weight* to add, not when to jump off a rising multiplier.

**Success**

- Playable on desktop and phone from a static URL
- Fake credits only, clearly labeled PLAY MONEY
- Math is honest: no strategy has RTP > 1.00; cash-after-first-Medium lands about 96–98% RTP
- Hidden `C` never appears in events, DOM, or logs; the UI cannot infer it from wobble
- `GameServer` matches Stake Engine’s round shape so a later RGS adapter is a swap, not a rewrite
- All source is copyrighted to **jmenichole** (see Copyright)

**Out of scope**

- Stake Engine RGS, math-SDK lookup tables, certification, jurisdiction flags
- Bink Cluster / PAM
- Accounts, KYC, real money
- Mid-round resume after refresh
- Physics-engine stacking
- Sound pack, tutorial overlay, lobby, history beyond the current round
- Autoplay / turbo

## Player fantasy

One platform. Weight only goes up. The scale wobbles harder as it gets heavier (theater, not a tell). Small blocks: tiny multiplier, usually survive. Heavy blocks: large multiplier, often die. Mix on the fly. Cash out is the only way to keep the bet. Bust loses the whole bet.

## Architecture

Static web app (Vite + TypeScript). Hard line between two modules:

| Module | Owns | Must not |
| --- | --- | --- |
| `server/` (`LocalGameServer` behind `GameServer`) | Play-money ledger, secret `C`, RNG, accept/bust, payout, quotes | Talk to a real operator |
| `client/` | Bet buttons, scale, wobble, HUD; displays `balance` from responses | Store, infer, or encode `C`; keep its own ledger |

Today `LocalGameServer` is in-process. Every client call is still `async` so the same UI can sit on HTTP later. Balance only changes from `play` / `endRound` / demo `resetBalance` responses, same as RGS returning `balance` on each call.

### Stake-shaped `GameServer` (not Stake)

No `stake-engine` package in this demo. Method names and money match RGS so a later port maps cleanly:

| Demo | Stake Engine analogue |
| --- | --- |
| Integer amounts, `1_000_000` = `1.00` | RGS amount scale |
| `play(amount, mode: 'BASE')` | `POST /wallet/play` |
| `action('DECISION', { type: 'place', block })` | `POST /bet/action` `DECISION` |
| `endRound()` | `POST /wallet/end-round` |
| `round.active`, `round.state[]` events | Active round + bookEvents |
| Config `betLevels` | Authenticate `config.betLevels` |

`play` debit-locks the bet, rolls secret `C`, returns `round.active = true` and events (including quotes). Each block is a `DECISION` with no extra debit.

Cash-out is `endRound()` after at least one surviving block: server pays `floor(betAmount * multiplierBps / 10000)` and closes the round. Bust: `place` sets `payoutMultiplier = 0` and `round.active = false`; client calls `endRound()`, which credits `0`. There is no separate `cashout` action.

`endRound` before the first surviving block is rejected (Cash Out is disabled). Players who want their money back use Reset, which voids the round and restores `1,000.00`.

Client plays `round.state` in order. Event types: `quotes`, `blockAccepted`, `bust`, `cashedOut`.

Quotes **never** use the real `C`. Survive percent is the public Bayesian probability (see Math). Using the real cap would print 0% or 100% and leak it.

Refresh reloads the app: ledger and round are gone, balance is `1,000.00` again. This build does not persist sessions. Operator builds would resume an active round.

## Round flow

1. Player picks a bet from `betLevels`. Client checks balance, then `play(amount, 'BASE')`.
2. Server draws secret capacity `C` from the published distribution, sets `weight = 0`, `payoutMultiplier = 1`, round active.
3. Client renders Safe / Medium / Heavy from `quotes`.
4. Player taps a block → `action(place)`.
   - `current + weight <= C`: accept, add weight, multiply multiplier, new quotes.
   - else: bust, collapse animation, `endRound`, bet gone.
5. Cash Out is enabled after the first surviving block. It calls `endRound()` and credits the current multiplier.
6. Header Reset voids any active round and restores `1,000.00` play money.

## Math

**Capacity.** `C` is uniform on the integers `{0, 1, …, 15}` (16 values). `C = 0` means the first block can bust.

**Blocks.**

| Id | Label | Weight |
| --- | --- | --- |
| `safe` | Safe | 1 |
| `medium` | Medium | 3 |
| `heavy` | Heavy | 7 |

**Public state after surviving to weight `x`:** the player knows `C >= x`. Remaining support is `{x, x+1, …, 15}` if `x <= 15`, else empty.

**Survive probability** for a block of weight `w` at current weight `x`:

```
remainCount = max(0, 16 - x)          // values in x..15; if x=0, remainCount=16 (0..15)
fitCount    = max(0, 16 - (x + w))    // values in (x+w)..15
pSurvive    = fitCount / remainCount   // 0 if remainCount = 0
```

At `x = 0`, remaining support is `{0…15}` (`remainCount = 16`). A Safe (`w = 1`) needs `C >= 1` → `fitCount = 15` → `15/16`.

If `pSurvive = 0`, the button is disabled and `place` is rejected.

**House edge.** Each *accepted* block:

```
nextMultiplier = floor4( currentMultiplier × 0.98 / pSurvive )
```

`floor4` means floor to 4 decimal places (represented as an integer in 1/10000 x). `0.98` is a 2% edge per placement. Cash-out after one placement has about 98% EV; after `k` placements about `0.98^k`. No strategy has RTP above 1.00. Tuning target: cash-after-first-Medium in 96–98% RTP in Monte Carlo.

**Payout.** Multiplier is stored as `multiplierBps` (integer, 1 = 0.0001x). Display as 2 decimal places (truncate, don’t round up).

```
payout = floor( betAmount * multiplierBps / 10000 )
```

`betAmount` is already in 1e6 units.

**Wobble (not math).** Visual intensity uses `currentWeight / 15` plus light idle noise. It does not receive `C` or `pSurvive`.

## UI

Stake-originals layout, one screen, no lobby, desktop and phone.

- **Top:** fake balance, PLAY MONEY tag, Reset
- **Bet:** `betLevels` `[0.10, 0.20, 0.50, 1, 2, 5, 10]` display units, disabled while `round.active`
- **Center:** 2D SVG scale. Blocks lerp onto a single stack. No physics engine. Bust: platform drops, blocks scatter on a timeline, HUD `0.00x`. Cash-out: stack holds, multiplier pulses, balance ticks up
- **Bottom:** three block buttons `SAFE  +1  → 1.12x  92%` (weight, next multiplier, survive %). Cash Out disabled until first survivor. `0%` blocks stay visible and disabled
- **Footer:** “Pitch demo — not on Stake/Bink. © 2026 jmenichole.”
- **One-line hint:** “Stack weight. Cash out before it breaks.”
- **Theme:** charcoal, gold, one accent. Readable at arm’s length

Starting balance: `1,000.00` play money (`1_000_000_000` integer units).

## Errors

Client prevents, server still rejects:

- Bet not in `betLevels`, bet > balance
- `play` while `round.active` (`ERR_BE` equivalent)
- Place while a call is in flight
- `endRound` before first survivor (active round, zero blocks)
- Place a `0%` block
- `endRound` with no active round: no-op

Trust the latest server event list if HUD and quotes drift. Engine speaks integers; UI formats 2 decimals.

No RGS network in this demo. Loading/disabled states still wrap every `await` as if the server were remote.

## Testing

**Math**

- Quote table: for each `x` in `0…15`, Safe/Medium/Heavy `pSurvive` equals `fitCount/remainCount`
- Injected `C`: `current + w > C` busts; `<= C` accepts
- Multiplier uses `floor4(current × 0.98 / pSurvive)`
- Monte Carlo ≥ 100k rounds, policies always-safe, always-medium, always-heavy, mixed-uniform: none with RTP > 1.00; cash-after-first-medium in ~96–98%

**Engine**

- `play` → events; accept; bust; cash-out vs bust balances
- Second `play` while active fails
- `0%` place fails
- `endRound` twice is a no-op; `endRound` before first survivor is rejected

**UI (thin)**

- Bet locked during round
- Cash Out disabled until first survivor
- `0%` buttons disabled
- PLAY MONEY and demo footer visible

No visual regression suite. No RGS mock. No provably-fair panel.

## Deployment

Static host (GitHub Pages) from this repo. Single URL, no login. `LocalGameServer` ships in the JS bundle. This is **not tamper-proof**; it is shaped so a real host can be. Do not log `C` to the console. Do not put `C` in events or the DOM.

## Copyright

Holder: **jmenichole**. Year: 2026. All rights reserved (not an OSI license). Operators who want to ship the game need a written deal; this demo does not grant that.

- Root `LICENSE` file with the notice
- `package.json` `"license": "UNLICENSED"`, `"author": "jmenichole"`
- Every source file (`.ts`, `.css`, `.html`, GitHub Actions YAML, tests) starts with `Copyright (c) 2026 jmenichole. All rights reserved.`
- A test fails the build if any of those files lack that string
- Do not copy third-party code in a way that would relicense the game

## Later (not this spec)

1. HTTP `GameServer` with the same interface
2. Stake Engine adapter: `Play` / `DECISION` / `EndRound`, resume, bet levels from authenticate. Math may need a book/lookup form for their upload format
3. Bink Cluster adapter via their owner/tech team

## Decisions log

- Pitch demo only, not operator-hosted
- One stack, weight only up (not two-pan)
- Bust loses the whole bet
- Multiplicative multipliers
- Hidden `C` rolled at `play`
- Wobble is cosmetic
- Full HUD: weight, next multiplier, survive %
- Three blocks: Safe / Medium / Heavy
- Client now, `GameServer` boundary for later
- Choreographed 2D original (not physics, not Crash-with-a-skin)
- Stake-shaped API and integer money, no Stake SDK in the demo
- Copyright (c) 2026 jmenichole. All rights reserved.
