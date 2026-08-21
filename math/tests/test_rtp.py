# Copyright (c) 2026 jmenichole. All rights reserved.
import random

from equilibrium.publish import mix_to_band
from equilibrium.simulate import run_round, simulate_round


def test_mix_pulls_all_wins_into_band():
    win = simulate_round(c=15, s=1, draws=[1])
    books = [win] * 10
    mixed = mix_to_band(books, target=0.96)
    r = sum(b["payoutMultiplier"] / 100 for b in mixed) / len(mixed)
    assert 0.90 <= r <= 0.98


def test_100k_rtp_in_band():
    rng = random.Random(1)
    books = [run_round(rng) for _ in range(100_000)]
    books = mix_to_band(books, target=0.96)
    r = sum(b["payoutMultiplier"] / 100 for b in books) / len(books)
    assert 0.90 <= r <= 0.98
    wins = sum(1 for b in books if b["payoutMultiplier"] > 0)
    assert wins > 1000
    assert max(b["payoutMultiplier"] for b in books) > 100
