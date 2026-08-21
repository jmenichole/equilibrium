# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import csv
import json
import random
from pathlib import Path

from equilibrium.simulate import simulate_round


def mix_to_band(books: list[dict], target: float = 0.96) -> list[dict]:
    r = sum(b["payoutMultiplier"] / 100 for b in books) / len(books)
    if 0.90 <= r <= 0.98:
        return books
    # Duplicate random busts or wins until mean in band (cap 20 passes)
    rng = random.Random(0)
    busts = [b for b in books if b["payoutMultiplier"] == 0]
    wins = [b for b in books if b["payoutMultiplier"] > 0]
    if not busts:
        busts = [simulate_round(c=0, s=1, draws=[1])]
    if not wins:
        wins = [simulate_round(c=15, s=1, draws=[1])]
    out = list(books)
    max_extra = len(books) * 20
    for _ in range(max_extra):
        r = sum(b["payoutMultiplier"] / 100 for b in out) / len(out)
        if 0.90 <= r <= 0.98:
            return out
        if r > 0.98 and busts:
            out.append(rng.choice(busts))
        elif r < 0.90 and wins:
            out.append(rng.choice(wins))
        else:
            break
    return out


def write_library(
    out_dir: Path, books: list[dict], weights: list[int] | None = None
) -> None:
    numbered = []
    for i, raw in enumerate(books, start=1):
        numbered.append(
            {
                "id": i,
                "payoutMultiplier": raw["payoutMultiplier"],
                "events": raw["events"],
            }
        )
    books_dir = out_dir / "books"
    pub = out_dir / "publish_files"
    books_dir.mkdir(parents=True, exist_ok=True)
    pub.mkdir(parents=True, exist_ok=True)
    (books_dir / "books_base.json").write_text(json.dumps(numbered))
    with (pub / "books_base.jsonl").open("w") as fh:
        for row in numbered:
            fh.write(json.dumps(row) + "\n")
    with (pub / "lookUpTable_base_0.csv").open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["id", "probabilityWeight", "payoutMultiplier"])
        w.writeheader()
        for i, row in enumerate(numbered):
            weight = weights[i] if weights is not None else 1
            w.writerow(
                {
                    "id": row["id"],
                    "probabilityWeight": weight,
                    "payoutMultiplier": row["payoutMultiplier"],
                }
            )
    (pub / "index.json").write_text(
        json.dumps(
            {
                "modes": [
                    {
                        "name": "base",
                        "cost": 1,
                        "events": "books_base.jsonl",
                        "weights": "lookUpTable_base_0.csv",
                    }
                ]
            }
        )
    )
