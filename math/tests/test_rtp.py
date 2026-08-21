# Copyright (c) 2026 jmenichole. All rights reserved.
import random

import pytest

from equilibrium.publish import compute_lookup_weights, mix_to_band, weighted_rtp
from equilibrium.simulate import run_round, simulate_round


def test_compute_lookup_weights_hits_target_rtp():
    bust = simulate_round(c=0, s=1, draws=[1])
    win = simulate_round(c=15, s=1, draws=[1])
    books = [bust, win, bust, bust, win]
    weights = compute_lookup_weights(books, target=0.96)
    r = weighted_rtp(books, weights)
    assert 0.955 <= r <= 0.965


def test_mix_raises_if_still_out_of_band():
    # One extreme win needs ~100 busts to reach band; cap is len(books)*20 == 20.
    books = [{"payoutMultiplier": 9900, "events": []}]
    with pytest.raises(ValueError, match=r"final RTP="):
        mix_to_band(books, target=0.96)


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
