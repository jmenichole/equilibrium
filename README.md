# Equilibrium

Pitch demo for a weight-balance casino game. Uses **play money** only — not connected to Stake or Bink.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Pick a bet, stack blocks, and cash out before the scale breaks.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

Static output goes to `dist/` for GitHub Pages.

## Engine (Stake)

Math and frontend for the stateless Play-and-watch build:

```bash
cd math && python3 -m pytest
python3 generate.py --count 100000 --out library
cd ../frontend && npm install && npm test && npm run dev
cd frontend && npm run build   # dist/ for ACP
```

Human follow-ups the agent could not finish (enable Pages, live play-through, operator intros) are in [docs/MANUAL-TASKS.md](docs/MANUAL-TASKS.md).

© 2026 jmenichole. See [LICENSE](LICENSE).
