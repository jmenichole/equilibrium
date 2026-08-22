# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import csv
import json
import random
from pathlib import Path

from equilibrium.simulate import simulate_round


def weighted_rtp(books: list[dict], weights: list[int]) -> float:
    total = sum(weights)
    if total == 0:
        return 0.0
    return sum(
        weights[i] * books[i]["payoutMultiplier"] / 100 for i in range(len(books))
    ) / total


def compute_lookup_weights(
    books: list[dict],
    target: float = 0.96,
    rng: random.Random | None = None,
) -> list[int]:
    if rng is None:
        rng = random.Random(0)
    weights = [1] * len(books)
    bust_indices = [i for i, b in enumerate(books) if b["payoutMultiplier"] == 0]
    win_indices = [i for i, b in enumerate(books) if b["payoutMultiplier"] > 0]
    low, high = target - 0.005, target + 0.005
    max_iters = max(len(books) * 1000, 1)
    total_w = float(len(books))
    total_p = sum(b["payoutMultiplier"] / 100 for b in books)

    for _ in range(max_iters):
        r = 0.0 if total_w == 0 else total_p / total_w
        if low <= r <= high:
            return weights
        if r < low and win_indices:
            i = rng.choice(win_indices)
            weights[i] += 1
            total_w += 1
            total_p += books[i]["payoutMultiplier"] / 100
        elif r > high and bust_indices:
            i = rng.choice(bust_indices)
            weights[i] += 1
            total_w += 1
        else:
            break

    r = 0.0 if total_w == 0 else total_p / total_w
    if not (low <= r <= high):
        raise ValueError(
            f"compute_lookup_weights could not reach RTP band [{low}, {high}]; final RTP={r:.6f}"
        )
    return weights


def mix_to_band(books: list[dict], target: float = 0.96) -> list[dict]:
    r = sum(b["payoutMultiplier"] / 100 for b in books) / len(books)
    if 0.90 <= r <= 0.98:
        return books
    # Duplicate random busts or wins until mean in band (cap len(books) * 20 extra appends)
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
    r = sum(b["payoutMultiplier"] / 100 for b in out) / len(out)
    if not (0.90 <= r <= 0.98):
        raise ValueError(f"mix_to_band could not reach RTP band [0.90, 0.98]; final RTP={r:.6f}")
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
