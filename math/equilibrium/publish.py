# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import csv
import json
from pathlib import Path


def write_library(out_dir: Path, books: list[dict]) -> None:
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
        for row in numbered:
            w.writerow(
                {
                    "id": row["id"],
                    "probabilityWeight": 1,
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
