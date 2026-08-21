# Equilibrium math

Python simulation and book generation for the Stake Engine build.

## Tests

```bash
cd math && python3 -m pytest
```

## Generate library

From repo root, after `cd math && python3 -m pytest` leaves you in `math/`:

```bash
python3 generate.py --count 100000 --out library
```

This writes compressed books under `library/` for local dev and publish prep.

## Stake Engine / ACP (human)

Official `publish_files` (zstd) come from the [Stake Engine math-sdk](https://github.com/StakeEngine/math-sdk): symlink or copy this game into `games/` in that repo, then run the SDK publish flow.

Upload to [engine.stake.com](https://engine.stake.com) is manual: math `publish_files` plus frontend `dist/` from:

```bash
cd frontend && npm run build
```

(from repo root). See [docs/MANUAL-TASKS.md](../docs/MANUAL-TASKS.md).
