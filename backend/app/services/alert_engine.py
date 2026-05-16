"""Rule-based alert generation for re-flagged scanner opportunities."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Any


@dataclass
class TechnicalAlert:
    ticker: str
    alert_type: str
    severity: str
    message: str
    created_at: str
    payload: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def build_alerts(row: dict[str, Any]) -> list[TechnicalAlert]:
    ticker = row.get("ticker") or row.get("symbol") or ""
    now = datetime.now(timezone.utc).isoformat()
    alerts: list[TechnicalAlert] = []

    def add(alert_type: str, severity: str, message: str) -> None:
        alerts.append(TechnicalAlert(
            ticker=ticker,
            alert_type=alert_type,
            severity=severity,
            message=message,
            created_at=now,
            payload={
                "price": row.get("price"),
                "rsi": row.get("rsi"),
                "fib_hit_level": row.get("fib_hit_level"),
                "reversal_score": row.get("reversal_score"),
                "exhaustion_score": row.get("exhaustion_score"),
            },
        ))

    if row.get("fib_hit_level"):
        add("fib_level_hit", "medium", f"{ticker} touched Fib {row['fib_hit_level']}%.")
    if row.get("rsi") is not None and row["rsi"] < 30:
        add("rsi_below_30", "high", f"{ticker} RSI crossed below 30.")
    if row.get("rsi") is not None and row["rsi"] > 70:
        add("rsi_above_70", "medium", f"{ticker} RSI is above 70.")
    if row.get("reversal_score", 0) >= 6:
        add("bullish_reversal", "high", f"{ticker} bullish reversal score is {row['reversal_score']}.")
    if row.get("exhaustion_score", 0) >= 5:
        add("bearish_exhaustion", "high", f"{ticker} bearish exhaustion score is {row['exhaustion_score']}.")

    return alerts
