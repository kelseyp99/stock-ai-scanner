"""Fibonacci retracement helpers for re-flagged opportunities."""

from __future__ import annotations

from dataclasses import dataclass, asdict

import pandas as pd


FIB_RATIOS = {
    "38.2": 0.382,
    "50.0": 0.5,
    "61.8": 0.618,
}


@dataclass
class FibAnalysis:
    swing_low: float | None
    swing_high: float | None
    levels: dict[str, float]
    hit_level: str | None
    hit_price: float | None
    in_retracement_zone: bool

    def to_dict(self) -> dict:
        return asdict(self)


def detect_swing_points(
    ohlcv: pd.DataFrame,
    lookback: int = 120,
    manual_low: float | None = None,
    manual_high: float | None = None,
) -> tuple[float | None, float | None]:
    """Return recent major swing low and subsequent/current swing high.

    The automatic version uses the lowest low in the lookback window, then the
    highest high after that low. UI/manual overrides can provide either anchor.
    """
    if ohlcv is None or ohlcv.empty or "Low" not in ohlcv or "High" not in ohlcv:
        return manual_low, manual_high

    window = ohlcv.tail(lookback).copy()
    if window.empty:
        return manual_low, manual_high

    swing_low = float(manual_low) if manual_low is not None else float(window["Low"].min())
    if manual_low is not None:
        after_low = window
    else:
        low_idx = window["Low"].idxmin()
        after_low = window.loc[low_idx:]

    swing_high = float(manual_high) if manual_high is not None else float(after_low["High"].max())
    if swing_high < swing_low:
        swing_low, swing_high = swing_high, swing_low
    return swing_low, swing_high


def calculate_levels(swing_low: float | None, swing_high: float | None) -> dict[str, float]:
    if swing_low is None or swing_high is None or swing_high <= swing_low:
        return {}
    move = swing_high - swing_low
    return {
        label: round(swing_high - move * ratio, 2)
        for label, ratio in FIB_RATIOS.items()
    }


def detect_level_hit(
    price: float | None,
    levels: dict[str, float],
    tolerance_pct: float = 1.0,
) -> tuple[str | None, float | None]:
    if price is None or not levels:
        return None, None
    best: tuple[str, float, float] | None = None
    for label, level in levels.items():
        if level <= 0:
            continue
        dist_pct = abs(price - level) / level * 100
        if dist_pct <= tolerance_pct and (best is None or dist_pct < best[2]):
            best = (label, level, dist_pct)
    if not best:
        return None, None
    return best[0], best[1]


def analyze_fibonacci(
    ohlcv: pd.DataFrame,
    price: float | None,
    lookback: int = 120,
    tolerance_pct: float = 1.0,
    manual_low: float | None = None,
    manual_high: float | None = None,
) -> FibAnalysis:
    swing_low, swing_high = detect_swing_points(ohlcv, lookback, manual_low, manual_high)
    levels = calculate_levels(swing_low, swing_high)
    hit_level, hit_price = detect_level_hit(price, levels, tolerance_pct)
    in_zone = False
    if price is not None and levels:
        zone_low = min(levels.values())
        zone_high = max(levels.values())
        in_zone = zone_low <= price <= zone_high
    return FibAnalysis(
        swing_low=round(swing_low, 2) if swing_low is not None else None,
        swing_high=round(swing_high, 2) if swing_high is not None else None,
        levels=levels,
        hit_level=hit_level,
        hit_price=hit_price,
        in_retracement_zone=in_zone,
    )
