# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.quotes import fit_count, p_survive, remain_count
from equilibrium.multiplier import bps_to_x100, next_multiplier_bps


def test_remain_at_zero_is_16():
    assert remain_count(0) == 16


def test_safe_at_zero():
    assert fit_count(0, 1) == 15
    assert p_survive(0, 1) == 15 / 16


def test_medium_at_zero():
    assert fit_count(0, 3) == 13
    assert p_survive(0, 3) == 13 / 16


def test_heavy_at_zero():
    assert fit_count(0, 7) == 9
    assert p_survive(0, 7) == 9 / 16


def test_heavy_at_ten_cannot_fit():
    assert remain_count(10) == 6
    assert fit_count(10, 7) == 0
    assert p_survive(10, 7) == 0


def test_next_bps_safe_from_start():
    # floor(10000 * 98 * 16 / (100 * 15)) = 10453
    assert next_multiplier_bps(10000, 16, 15) == 10453


def test_bps_to_x100():
    assert bps_to_x100(10000) == 100
    assert bps_to_x100(10453) == 104
