"""
fundamental_service.py

Best-effort fundamental/event enrichment for scanner rows.

Primary live sources:
- Alpha Vantage earnings calendar when ALPHAVANTAGE_API_KEY is set.
- yfinance calendar/info as a fallback.

Institutional ownership changes are intentionally provider-neutral. The cleanest
source is parsed SEC 13F data, but it should be refreshed as a separate daily or
quarterly job and written to a small JSON map for scanner-time lookup.
"""

from __future__ import annotations

import csv
import json
import logging
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from ..core.config import settings

logger = logging.getLogger(__name__)

_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _parse_date(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, pd.Timestamp):
        if pd.isna(value):
            return None
        return value.date().isoformat()
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, (list, tuple)) and value:
        return _parse_date(value[0])
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "nat"}:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except Exception:
        pass
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except Exception:
            continue
    return None


def _days_until(iso_date: str | None) -> int | None:
    if not iso_date:
        return None
    try:
        target = datetime.fromisoformat(iso_date).date()
        return (target - datetime.now(timezone.utc).date()).days
    except Exception:
        return None


def _earnings_from_alpha_vantage(ticker: str) -> dict[str, Any]:
    if not settings.alphavantage_api_key:
        return {}
    query = urllib.parse.urlencode({
        "function": "EARNINGS_CALENDAR",
        "symbol": ticker,
        "horizon": "3month",
        "apikey": settings.alphavantage_api_key,
    })
    url = f"https://www.alphavantage.co/query?{query}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            text = resp.read().decode("utf-8", errors="replace")
        rows = list(csv.DictReader(text.splitlines()))
        if not rows:
            return {}
        rows.sort(key=lambda r: r.get("reportDate") or "9999-99-99")
        row = rows[0]
        earnings_date = _parse_date(row.get("reportDate"))
        return {
            "next_earnings_date": earnings_date,
            "earnings_estimate_eps": _safe_float(row.get("estimate")),
            "earnings_source": "alpha_vantage",
        }
    except Exception as e:
        logger.debug("Alpha Vantage earnings lookup failed for %s: %s", ticker, e)
        return {}


def _earnings_from_yfinance(ticker_obj: Any) -> dict[str, Any]:
    try:
        cal = getattr(ticker_obj, "calendar", None)
        if callable(cal):
            cal = cal()
        if cal is None:
            return {}
        if isinstance(cal, dict):
            raw = cal.get("Earnings Date") or cal.get("EarningsDate")
        else:
            raw = None
            if hasattr(cal, "loc"):
                for key in ("Earnings Date", "EarningsDate"):
                    try:
                        raw = cal.loc[key].values
                        break
                    except Exception:
                        continue
        earnings_date = _parse_date(raw)
        return {
            "next_earnings_date": earnings_date,
            "earnings_source": "yfinance" if earnings_date else None,
        }
    except Exception as e:
        logger.debug("yfinance earnings lookup failed: %s", e)
        return {}


def _safe_float(value: Any) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except Exception:
        return None


def _load_institutional_change(ticker: str) -> dict[str, Any]:
    path = settings.institutional_ownership_changes_file
    if not path:
        return {}
    try:
        p = Path(path).expanduser()
        if not p.exists():
            return {}
        data = json.loads(p.read_text())
        row = data.get(ticker.upper()) or {}
        delta_pct = _safe_float(row.get("institutional_ownership_delta_pct"))
        if delta_pct is None:
            return {}
        return {
            "institutional_ownership_delta_pct": delta_pct,
            "institutional_ownership_trend": (
                "Accumulation" if delta_pct >= 2 else
                "Distribution" if delta_pct <= -2 else
                "Stable"
            ),
            "institutional_ownership_source": row.get("source") or "13f_snapshot",
            "institutional_13f_latest_period": row.get("institutional_13f_latest_period"),
            "institutional_13f_previous_period": row.get("institutional_13f_previous_period"),
            "institutional_13f_value": _safe_float(row.get("institutional_13f_value")),
            "institutional_13f_previous_value": _safe_float(row.get("institutional_13f_previous_value")),
            "institutional_13f_value_delta": _safe_float(row.get("institutional_13f_value_delta")),
            "institutional_13f_shares": _safe_float(row.get("institutional_13f_shares")),
            "institutional_13f_shares_delta": _safe_float(row.get("institutional_13f_shares_delta")),
            "institutional_13f_manager_count": int(row.get("institutional_13f_manager_count") or 0),
            "institutional_13f_new_managers": row.get("institutional_13f_new_managers") or [],
            "institutional_13f_top_managers": row.get("institutional_13f_top_managers") or [],
            "institutional_13f_notable": row.get("institutional_13f_notable") or [],
        }
    except Exception as e:
        logger.debug("Institutional ownership lookup failed for %s: %s", ticker, e)
        return {}


def get_fundamentals_for_ticker(ticker: str, ticker_obj: Any | None = None) -> dict[str, Any]:
    ticker = ticker.upper()
    now = time.time()
    cached = _cache.get(ticker)
    ttl = max(1, settings.fundamentals_cache_ttl_hours) * 3600
    if cached and now - cached[0] < ttl:
        return cached[1]

    fundamentals: dict[str, Any] = {}
    fundamentals.update(_earnings_from_alpha_vantage(ticker))
    if not fundamentals.get("next_earnings_date") and ticker_obj is not None:
        fundamentals.update(_earnings_from_yfinance(ticker_obj))

    earnings_date = fundamentals.get("next_earnings_date")
    days = _days_until(earnings_date)
    fundamentals["days_to_earnings"] = days
    if days is not None:
        fundamentals["earnings_window"] = (
            "Earnings this week" if 0 <= days <= 7 else
            "Earnings soon" if 8 <= days <= 21 else
            "Post earnings" if -3 <= days < 0 else
            None
        )

    fundamentals.update(_load_institutional_change(ticker))

    _cache[ticker] = (now, fundamentals)
    return fundamentals
