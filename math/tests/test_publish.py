# Copyright (c) 2026 jmenichole. All rights reserved.
import csv
import json
from pathlib import Path

import pytest

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
    raw = (tmp_path / "publish_files" / "lookUpTable_base_0.csv").read_bytes()
    assert raw == b"1,1,104\n"
    assert not raw.startswith(b"id,")
    assert b"probabilityWeight" not in raw
    rows = list(csv.reader(raw.decode("utf-8").splitlines()))
    assert rows[0] == ["1", "1", "104"]
    index = json.loads((tmp_path / "publish_files" / "index.json").read_text())
    assert index["modes"][0]["name"] == "base"


def test_write_library_uses_provided_weights(tmp_path: Path):
    bust = simulate_round(c=0, s=1, draws=[1])
    win = simulate_round(c=15, s=1, draws=[1])
    write_library(tmp_path, [bust, win], weights=[3, 7])
    raw = (tmp_path / "publish_files" / "lookUpTable_base_0.csv").read_text(
        encoding="utf-8"
    )
    assert raw == "1,3,0\n2,7,104\n"


def test_write_library_writes_zstd_books_when_available(tmp_path: Path):
    zstandard = pytest.importorskip("zstandard")
    book = simulate_round(c=15, s=1, draws=[1])
    write_library(tmp_path, [book])
    zst = tmp_path / "publish_files" / "books_base.jsonl.zst"
    assert zst.is_file()
    index = json.loads((tmp_path / "publish_files" / "index.json").read_text())
    assert index["modes"][0]["events"] == "books_base.jsonl.zst"
    text = zstandard.ZstdDecompressor().decompress(zst.read_bytes()).decode("utf-8")
    row = json.loads(text.splitlines()[0])
    assert row["id"] == 1
    assert row["payoutMultiplier"] == 104
