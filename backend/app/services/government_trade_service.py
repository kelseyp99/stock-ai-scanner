"""
government_trade_service.py

Normalizes congressional / senior-government stock trading disclosures into a
small scanner-time signal. The preferred live workflow is:

1. A separate job pulls and normalizes STOCK Act disclosures from Quiver,
   Capitol Trades, Signal Congress, or official House/Senate sources.
2. That job writes a ticker-keyed JSON file.
3. The scanner reads the JSON quickly while scoring each ticker.

This avoids slow per-ticker scraping during the nightly scan and keeps the
scanner provider-neutral.
"""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any

from ..core.config import settings

logger = logging.getLogger(__name__)

_file_cache: tuple[float, dict[str, Any]] | None = None


def _safe_float(value: Any) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except Exception:
        return None


def _safe_int(value: Any) -> int:
    try:
        if value in (None, ""):
            return 0
        return int(value)
    except Exception:
        return 0


def _load_trade_map() -> dict[str, Any]:
    global _file_cache
    path = settings.government_trades_file
    if not path:
        return {}

    ttl = max(1, settings.government_trades_cache_ttl_hours) * 3600
    now = time.time()
    if _file_cache and now - _file_cache[0] < ttl:
        return _file_cache[1]

    try:
        p = Path(path).expanduser()
        if not p.exists():
            return {}
        data = json.loads(p.read_text())
        if isinstance(data, list):
            by_ticker: dict[str, list[dict[str, Any]]] = {}
            for row in data:
                ticker = str(row.get("ticker") or "").upper()
                if ticker:
                    by_ticker.setdefault(ticker, []).append(row)
            data = by_ticker
        _file_cache = (now, data if isinstance(data, dict) else {})
        return _file_cache[1]
    except Exception as e:
        logger.debug("Government trades file load failed: %s", e)
        return {}


def _normalize_rows(ticker: str, rows: Any) -> dict[str, Any]:
    if isinstance(rows, dict) and "trades" in rows:
        summary = dict(rows)
        trade_rows = rows.get("trades") or []
    elif isinstance(rows, list):
        summary = {}
        trade_rows = rows
    elif isinstance(rows, dict):
        summary = dict(rows)
        trade_rows = []
    else:
        return {}

    buy_count = _safe_int(summary.get("gov_trade_buy_count_90d"))
    sell_count = _safe_int(summary.get("gov_trade_sell_count_90d"))
    net_amount = _safe_float(summary.get("gov_trade_net_amount_90d"))

    members = summary.get("gov_trade_members") or []
    latest_trade_date = summary.get("gov_trade_latest_trade_date")
    latest_disclosure_date = summary.get("gov_trade_latest_disclosure_date")
    source = summary.get("gov_trade_source") or summary.get("source") or "government_trades_file"

    if trade_rows:
        members_seen: list[str] = []
        net = 0.0
        buys = sells = 0
        for trade in trade_rows:
            trade_type = str(trade.get("transaction_type") or trade.get("type") or "").lower()
            amount = _safe_float(
                trade.get("amount_midpoint")
                or trade.get("amount")
                or trade.get("estimated_amount")
                or 0
            ) or 0.0
            member = trade.get("member") or trade.get("representative") or trade.get("senator")
            if member and member not in members_seen:
                members_seen.append(str(member))
            if not latest_trade_date:
                latest_trade_date = trade.get("trade_date") or trade.get("transaction_date")
            if not latest_disclosure_date:
                latest_disclosure_date = trade.get("disclosure_date")
            if "purchase" in trade_type or "buy" in trade_type:
                buys += 1
                net += amount
            elif "sale" in trade_type or "sell" in trade_type:
                sells += 1
                net -= amount
        buy_count = buy_count or buys
        sell_count = sell_count or sells
        net_amount = net_amount if net_amount is not None else net
        members = members or members_seen

    net_amount = net_amount or 0.0
    signal = None
    if buy_count > sell_count and net_amount >= 25_000:
        signal = "Government Buying"
    elif sell_count > buy_count and net_amount <= -25_000:
        signal = "Government Selling"
    if buy_count >= 3 and len(members) >= 2 and net_amount >= 100_000:
        signal = "Government Cluster Buy"

    return {
        "gov_trade_buy_count_90d": buy_count,
        "gov_trade_sell_count_90d": sell_count,
        "gov_trade_net_amount_90d": round(net_amount, 2),
        "gov_trade_latest_trade_date": latest_trade_date,
        "gov_trade_latest_disclosure_date": latest_disclosure_date,
        "gov_trade_members": members[:6] if isinstance(members, list) else [],
        "gov_trade_signal": signal,
        "gov_trade_source": source,
    }


def get_government_trades_for_ticker(ticker: str) -> dict[str, Any]:
    """Return normalized government trade signal fields for one ticker."""
    ticker = ticker.upper()
    data = _load_trade_map()
    rows = data.get(ticker) or data.get(ticker.replace(".", "-")) or data.get(ticker.replace("-", "."))
    if not rows:
        return {
            "gov_trade_buy_count_90d": 0,
            "gov_trade_sell_count_90d": 0,
            "gov_trade_net_amount_90d": 0.0,
            "gov_trade_latest_trade_date": None,
            "gov_trade_latest_disclosure_date": None,
            "gov_trade_members": [],
            "gov_trade_signal": None,
            "gov_trade_source": None,
        }
    return _normalize_rows(ticker, rows)
