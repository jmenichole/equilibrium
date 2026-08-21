# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.constants import HOUSE_EDGE_DEN, HOUSE_EDGE_NUM


def next_multiplier_bps(current_bps: int, remain: int, fit: int) -> int:
    if fit <= 0 or remain <= 0:
        raise ValueError("ERR_ZERO_SURVIVE")
    return (current_bps * HOUSE_EDGE_NUM * remain) // (HOUSE_EDGE_DEN * fit)


def bps_to_x100(bps: int) -> int:
    return bps // 100
