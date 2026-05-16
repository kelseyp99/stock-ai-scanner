"""Algorithmic OHLC candlestick pattern detection.

These helpers intentionally use only open/high/low/close data. They return
plain booleans so the scanner can compose them into rule-based scores.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


def _row(df: pd.DataFrame, offset: int = -1) -> dict[str, float] | None:
    if df is None or df.empty or len(df) < abs(offset):
        return None
    r = df.iloc[offset]
    try:
        return {
            "open": float(r["Open"]),
            "high": float(r["High"]),
            "low": float(r["Low"]),
            "close": float(r["Close"]),
            "volume": float(r["Volume"]) if "Volume" in r else 0.0,
        }
    except Exception:
        return None


def _body(c: dict[str, float]) -> float:
    return abs(c["close"] - c["open"])


def _range(c: dict[str, float]) -> float:
    return max(0.000001, c["high"] - c["low"])


def _upper_wick(c: dict[str, float]) -> float:
    return c["high"] - max(c["open"], c["close"])


def _lower_wick(c: dict[str, float]) -> float:
    return min(c["open"], c["close"]) - c["low"]


def is_green(c: dict[str, float]) -> bool:
    return c["close"] > c["open"]


def is_red(c: dict[str, float]) -> bool:
    return c["close"] < c["open"]


def detect_hammer(df: pd.DataFrame) -> bool:
    c = _row(df)
    if not c:
        return False
    body = _body(c)
    return (
        body > 0
        and _lower_wick(c) >= body * 2
        and _upper_wick(c) <= body * 0.75
        and body / _range(c) <= 0.45
    )


def detect_shooting_star(df: pd.DataFrame) -> bool:
    c = _row(df)
    if not c:
        return False
    body = _body(c)
    return (
        body > 0
        and _upper_wick(c) >= body * 2
        and _lower_wick(c) <= body * 0.75
        and body / _range(c) <= 0.45
    )


def detect_bullish_engulfing(df: pd.DataFrame) -> bool:
    if df is None or len(df) < 2:
        return False
    prev, cur = _row(df, -2), _row(df, -1)
    if not prev or not cur:
        return False
    return (
        is_red(prev)
        and is_green(cur)
        and cur["open"] <= prev["close"]
        and cur["close"] >= prev["open"]
    )


def detect_bearish_engulfing(df: pd.DataFrame) -> bool:
    if df is None or len(df) < 2:
        return False
    prev, cur = _row(df, -2), _row(df, -1)
    if not prev or not cur:
        return False
    return (
        is_green(prev)
        and is_red(cur)
        and cur["open"] >= prev["close"]
        and cur["close"] <= prev["open"]
    )


def detect_morning_star(df: pd.DataFrame) -> bool:
    if df is None or len(df) < 3:
        return False
    a, b, c = _row(df, -3), _row(df, -2), _row(df, -1)
    if not a or not b or not c:
        return False
    midpoint = (a["open"] + a["close"]) / 2
    return is_red(a) and _body(b) <= _body(a) * 0.45 and is_green(c) and c["close"] > midpoint


def detect_evening_star(df: pd.DataFrame) -> bool:
    if df is None or len(df) < 3:
        return False
    a, b, c = _row(df, -3), _row(df, -2), _row(df, -1)
    if not a or not b or not c:
        return False
    midpoint = (a["open"] + a["close"]) / 2
    return is_green(a) and _body(b) <= _body(a) * 0.45 and is_red(c) and c["close"] < midpoint


def detect_piercing_line(df: pd.DataFrame) -> bool:
    if df is None or len(df) < 2:
        return False
    prev, cur = _row(df, -2), _row(df, -1)
    if not prev or not cur:
        return False
    midpoint = (prev["open"] + prev["close"]) / 2
    return is_red(prev) and is_green(cur) and cur["open"] < prev["close"] and cur["close"] > midpoint and cur["close"] < prev["open"]


def detect_three_white_soldiers(df: pd.DataFrame) -> bool:
    if df is None or len(df) < 3:
        return False
    candles = [_row(df, -3), _row(df, -2), _row(df, -1)]
    if any(c is None for c in candles):
        return False
    a, b, c = candles  # type: ignore[misc]
    return all(is_green(x) for x in candles if x) and b["close"] > a["close"] and c["close"] > b["close"]


def detect_multiple_red_candles(df: pd.DataFrame, count: int = 3) -> bool:
    if df is None or len(df) < count:
        return False
    candles = [_row(df, -i) for i in range(count, 0, -1)]
    return all(c and is_red(c) for c in candles)


def detect_multiple_green_candles(df: pd.DataFrame, count: int = 3) -> bool:
    if df is None or len(df) < count:
        return False
    candles = [_row(df, -i) for i in range(count, 0, -1)]
    return all(c and is_green(c) for c in candles)


def detect_bullish_patterns(df: pd.DataFrame) -> dict[str, bool]:
    return {
        "hammer": detect_hammer(df),
        "bullish_engulfing": detect_bullish_engulfing(df),
        "morning_star": detect_morning_star(df),
        "piercing_line": detect_piercing_line(df),
        "three_white_soldiers": detect_three_white_soldiers(df),
        "multiple_green_candles": detect_multiple_green_candles(df),
    }


def detect_bearish_patterns(df: pd.DataFrame) -> dict[str, bool]:
    return {
        "shooting_star": detect_shooting_star(df),
        "bearish_engulfing": detect_bearish_engulfing(df),
        "evening_star": detect_evening_star(df),
        "multiple_red_candles": detect_multiple_red_candles(df),
    }


def true_pattern_names(patterns: dict[str, Any]) -> list[str]:
    return [name for name, detected in patterns.items() if detected]
