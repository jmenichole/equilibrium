# Copyright (c) 2026 jmenichole. All rights reserved.
from equilibrium.constants import C_SPAN


def remain_count(current_weight: int) -> int:
    return max(0, C_SPAN - current_weight)


def fit_count(current_weight: int, block_weight: int) -> int:
    return max(0, C_SPAN - (current_weight + block_weight))


def p_survive(current_weight: int, block_weight: int) -> float:
    remain = remain_count(current_weight)
    if remain == 0:
        return 0.0
    return fit_count(current_weight, block_weight) / remain
