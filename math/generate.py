# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import argparse
import random
from pathlib import Path

from equilibrium.publish import write_library
from equilibrium.simulate import run_round


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=20)
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "library")
    args = parser.parse_args()
    rng = random.Random(args.seed)
    books = [run_round(rng) for _ in range(args.count)]
    write_library(args.out, books)


if __name__ == "__main__":
    main()
