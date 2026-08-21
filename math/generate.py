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
    books = [run_round(rng) for _ in range(args.count)]
    books = mix_to_band(books, target=0.96)
    weights = compute_lookup_weights(books, target=0.96)
    write_library(args.out, books, weights)


if __name__ == "__main__":
    main()
