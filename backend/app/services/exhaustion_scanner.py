"""Rule-based bearish exhaustion scoring for hot/overbought candidates."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

import pandas as pd

from .candlestick_patterns import detect_bearish_patterns, true_pattern_names


@dataclass
class ExhaustionResult:
    score: int
    labels: list[str]
    patterns: dict[str, bool]
    reasons: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _weakening_volume(volume: pd.Series, lookback: int = 5) -> bool:
    if volume is None or len(volume) < lookback + 5:
        return False
    recent = float(volume.tail(lookback).mean())
    prior = float(volume.iloc[-lookback * 2:-lookback].mean())
    return prior > 0 and recent < prior * 0.85


def _failed_breakout(ohlcv: pd.DataFrame, lookback: int = 20) -> bool:
    if ohlcv is None or len(ohlcv) < lookback + 1:
        return False
    prior_high = float(ohlcv["High"].iloc[-lookback - 1:-1].max())
    cur = ohlcv.iloc[-1]
    return float(cur["High"]) > prior_high and float(cur["Close"]) < prior_high


def score_bearish_exhaustion(
    ohlcv: pd.DataFrame,
    rsi: float | None,
    volume_ratio: float | None,
) -> ExhaustionResult:
    score = 0
    labels: list[str] = []
    reasons: list[str] = []

    if rsi is not None and rsi > 75:
        score += 3
        labels.append("RSI Very Overbought")
        reasons.append("RSI is above 75.")
    elif rsi is not None and rsi > 70:
        score += 2
        labels.append("RSI Overbought")
        reasons.append("RSI is above 70.")

    patterns = detect_bearish_patterns(ohlcv)
    if patterns.get("shooting_star"):
        score += 2
        labels.append("Shooting Star")
    if patterns.get("bearish_engulfing"):
        score += 2
        labels.append("Bearish Engulfing")
    if patterns.get("evening_star"):
        score += 2
        labels.append("Evening Star")
    if patterns.get("multiple_red_candles"):
        score += 1
        labels.append("Multiple Red Candles")

    volume = ohlcv["Volume"] if ohlcv is not None and "Volume" in ohlcv else pd.Series(dtype=float)
    if _weakening_volume(volume):
        score += 1
        labels.append("Weakening Volume")
        reasons.append("Recent volume is fading versus the prior window.")
    if _failed_breakout(ohlcv):
        score += 2
        labels.append("Failed Breakout")
        reasons.append("Price traded above recent highs but closed back below them.")
    if volume_ratio is not None and volume_ratio < 0.8 and rsi is not None and rsi > 70:
        score += 1
        labels.append("Thin Overbought Move")

    detected = true_pattern_names(patterns)
    if detected:
        reasons.append("Bearish candle patterns: " + ", ".join(detected))

    return ExhaustionResult(score=score, labels=list(dict.fromkeys(labels)), patterns=patterns, reasons=reasons)
