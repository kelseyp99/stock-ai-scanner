"""Rule-based bullish reversal scoring for historical scanner candidates."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

import pandas as pd

from .candlestick_patterns import detect_bullish_patterns, true_pattern_names


@dataclass
class ReversalResult:
    score: int
    labels: list[str]
    patterns: dict[str, bool]
    reasons: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _short_consolidation(close: pd.Series, lookback: int = 5, max_range_pct: float = 4.0) -> bool:
    if close is None or len(close) < lookback:
        return False
    window = close.tail(lookback)
    low = float(window.min())
    high = float(window.max())
    latest = float(window.iloc[-1])
    return latest > 0 and ((high - low) / latest * 100) <= max_range_pct


def score_bullish_reversal(
    ohlcv: pd.DataFrame,
    rsi: float | None,
    volume_ratio: float | None,
    fib_hit: bool,
) -> ReversalResult:
    score = 0
    labels: list[str] = []
    reasons: list[str] = []

    if fib_hit:
        score += 3
        labels.append("Fib Level Hit")
        reasons.append("Price is touching or inside a Fibonacci retracement level.")
    if rsi is not None and rsi < 30:
        score += 3
        labels.append("RSI Oversold")
        reasons.append("RSI is below 30.")
    elif rsi is not None and rsi < 35:
        score += 2
        labels.append("RSI Near Oversold")
        reasons.append("RSI is below 35.")
    if volume_ratio is not None and volume_ratio >= 1.5:
        score += 2
        labels.append("Volume Spike")
        reasons.append("Volume is at least 1.5x the recent average.")

    patterns = detect_bullish_patterns(ohlcv)
    if patterns.get("bullish_engulfing"):
        score += 2
        labels.append("Bullish Engulfing")
    if patterns.get("hammer"):
        score += 2
        labels.append("Hammer Detected")
    if patterns.get("morning_star"):
        score += 2
        labels.append("Morning Star")
    if patterns.get("piercing_line"):
        score += 1
        labels.append("Piercing Line")
    if patterns.get("three_white_soldiers"):
        score += 2
        labels.append("Three White Soldiers")
    if patterns.get("multiple_green_candles"):
        score += 1
        labels.append("Multiple Green Candles")

    close = ohlcv["Close"] if ohlcv is not None and "Close" in ohlcv else pd.Series(dtype=float)
    if _short_consolidation(close):
        score += 1
        labels.append("Short Consolidation")
        reasons.append("Recent closes are consolidating in a tight range.")

    detected = true_pattern_names(patterns)
    if detected:
        reasons.append("Bullish candle patterns: " + ", ".join(detected))

    return ReversalResult(score=score, labels=list(dict.fromkeys(labels)), patterns=patterns, reasons=reasons)
