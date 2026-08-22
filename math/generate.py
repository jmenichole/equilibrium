# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import argparse
import random
from pathlib import Path

from equilibrium.publish import compute_lookup_weights, mix_to_band, write_library
from equilibrium.simulate import run_round


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=100_000)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "library")
    args = parser.parse_args()
    rng = random.Random(args.seed)
    print(f"Simulating {args.count} rounds...", flush=True)
    books = [run_round(rng) for _ in range(args.count)]
    print("Mixing book list into RTP band...", flush=True)
    books = mix_to_band(books, target=0.96)
    print(f"Computing lookup weights for {len(books)} books...", flush=True)
    weights = compute_lookup_weights(books, target=0.96)
    print(f"Writing library to {args.out}...", flush=True)
    write_library(args.out, books, weights)
    pub = args.out / "publish_files"
    print(f"Done. Import this folder: {pub.resolve()}", flush=True)


if __name__ == "__main__":
    main()
