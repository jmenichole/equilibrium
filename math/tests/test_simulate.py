# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.simulate import simulate_round


def test_c_zero_busts_on_first_piece():
    book = simulate_round(c=0, s=1, draws=[1])
    assert book["payoutMultiplier"] == 0
    types = [e["type"] for e in book["events"]]
    assert types == ["bust", "setTotalWin", "finalWin"]
    assert all("C" not in e and "S" not in e and "c" not in e and "s" not in e for e in book["events"])


def test_win_after_first_pebble_when_s_is_1():
    book = simulate_round(c=15, s=1, draws=[1])
    assert book["payoutMultiplier"] == 104
    types = [e["type"] for e in book["events"]]
    assert types[0] == "stack"
    assert book["events"][0]["weight"] == 1
    assert book["events"][0]["totalWeight"] == 1
    assert book["events"][0]["payoutMultiplier"] == 104
    assert types[-2:] == ["setTotalWin", "finalWin"]
    assert book["events"][-1]["amount"] == 1_000_000 * 104 // 100


def test_bust_when_piece_exceeds_c():
    book = simulate_round(c=2, s=15, draws=[7])
    assert book["payoutMultiplier"] == 0
    assert book["events"][0]["type"] == "bust"


def test_secrets_never_in_events():
    book = simulate_round(c=10, s=3, draws=[1, 3, 7, 1, 1, 1, 1, 1, 1, 1])
    for event in book["events"]:
        assert "c" not in event
        assert "s" not in event
        assert "C" not in event
        assert "S" not in event
