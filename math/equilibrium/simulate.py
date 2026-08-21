# Copyright (c) 2026 jmenichole. All rights reserved.
from __future__ import annotations

import random

from equilibrium.constants import STARTING_MULTIPLIER_BPS, UNIT_BET, WEIGHTS
from equilibrium.multiplier import bps_to_x100, next_multiplier_bps
from equilibrium.quotes import fit_count, remain_count


def simulate_round(*, c: int, s: int, draws: list[int]) -> dict:
    events: list[dict] = []
    x = 0
    m = STARTING_MULTIPLIER_BPS
    index = 0
    for w in draws:
        if x + w > c:
            events.append({"index": index, "type": "bust"})
            index += 1
            events.append({"index": index, "type": "setTotalWin", "amount": 0})
            index += 1
            events.append({"index": index, "type": "finalWin", "amount": 0})
            return {"payoutMultiplier": 0, "events": events}
        remain = remain_count(x)
        fit = fit_count(x, w)
        m = next_multiplier_bps(m, remain, fit)
        x = x + w
        px = bps_to_x100(m)
        events.append(
            {
                "index": index,
                "type": "stack",
                "weight": w,
                "totalWeight": x,
                "payoutMultiplier": px,
            }
        )
        index += 1
        if x >= s:
            amount = UNIT_BET * px // 100
            events.append({"index": index, "type": "setTotalWin", "amount": amount})
            index += 1
            events.append({"index": index, "type": "finalWin", "amount": amount})
            return {"payoutMultiplier": px, "events": events}
    raise ValueError("ran out of draws before bust or win")


def run_round(rng: random.Random) -> dict:
    c = rng.randrange(0, 16)
    s = rng.randrange(1, 16)
    draws: list[int] = []
    # Cap draws well above max stacks (weight 1 up to 16 times)
    for _ in range(32):
        draws.append(rng.choice(WEIGHTS))
    return simulate_round(c=c, s=s, draws=draws)
