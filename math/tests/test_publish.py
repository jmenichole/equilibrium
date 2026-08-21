# Copyright (c) 2026 jmenichole. All rights reserved.
import csv
import json
from pathlib import Path

from equilibrium.publish import write_library
from equilibrium.simulate import simulate_round


def test_write_library_roundtrip(tmp_path: Path):
    book = simulate_round(c=15, s=1, draws=[1])
    write_library(tmp_path, [book])
    books = json.loads((tmp_path / "books" / "books_base.json").read_text())
    assert books[0]["id"] == 1
    assert books[0]["payoutMultiplier"] == 104
    assert books[0]["events"][0]["type"] == "stack"
    for event in books[0]["events"]:
        assert "c" not in event and "s" not in event and "C" not in event and "S" not in event
    rows = list(csv.DictReader((tmp_path / "publish_files" / "lookUpTable_base_0.csv").open()))
    assert rows[0]["id"] == "1"
    assert rows[0]["probabilityWeight"] == "1"
    assert rows[0]["payoutMultiplier"] == "104"
    index = json.loads((tmp_path / "publish_files" / "index.json").read_text())
    assert index["modes"][0]["name"] == "base"
