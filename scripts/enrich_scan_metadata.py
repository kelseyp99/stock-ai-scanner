#!/usr/bin/env python3
"""
Fill missing company/exchange metadata in an existing scanner JSON file.

This is useful after a full scan when yfinance price data succeeded but the
parallel metadata call timed out for some winners. It only touches rows that are
already in the JSON file; it does not rescan prices or indicators.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

import yfinance as yf

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RESULTS = ROOT / "scan_results_latest.json"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT / "backend"))

from app.services.scanner import normalize_exchange_info  # noqa: E402


def iter_rows(obj: Any):
    if isinstance(obj, dict):
        if obj.get("ticker"):
            yield obj
        for value in obj.values():
            yield from iter_rows(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from iter_rows(item)


def fetch_metadata(ticker: str) -> dict[str, Any]:
    ticker_obj = yf.Ticker(ticker)
    info: dict[str, Any] = {}
    try:
        info = ticker_obj.info or {}
    except Exception:
        info = {}

    try:
        fast_info = dict(ticker_obj.fast_info or {})
    except Exception:
        fast_info = {}

    exchange, exchange_name = normalize_exchange_info(info)
    if not exchange and fast_info.get("exchange"):
        exchange = str(fast_info.get("exchange")).strip().upper() or None
    if not exchange_name and fast_info.get("exchange"):
        exchange_name = exchange

    return {
        "company_name": info.get("longName") or info.get("shortName") or None,
        "exchange": exchange,
        "exchange_name": exchange_name,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich scanner JSON with missing exchange/company metadata.")
    parser.add_argument("--results", default=str(DEFAULT_RESULTS), help="Path to scan_results_latest.json")
    parser.add_argument("--limit", type=int, default=250, help="Max unique tickers to query")
    parser.add_argument("--sleep", type=float, default=0.05, help="Delay between metadata calls")
    args = parser.parse_args()

    path = Path(args.results).expanduser().resolve()
    data = json.loads(path.read_text())
    rows = list(iter_rows(data))

    tickers: list[str] = []
    seen: set[str] = set()
    for row in rows:
        ticker = str(row.get("ticker") or "").upper()
        if not ticker or ticker in seen:
            continue
        if row.get("exchange") and row.get("company_name"):
            continue
        seen.add(ticker)
        tickers.append(ticker)
        if len(tickers) >= args.limit:
            break

    metadata: dict[str, dict[str, Any]] = {}
    for idx, ticker in enumerate(tickers, start=1):
        meta = fetch_metadata(ticker)
        metadata[ticker] = meta
        print(
            f"[{idx}/{len(tickers)}] {ticker}: "
            f"{meta.get('exchange_name') or meta.get('exchange') or '-'} "
            f"{meta.get('company_name') or ''}"
        )
        if args.sleep:
            time.sleep(args.sleep)

    updated = 0
    for row in rows:
        ticker = str(row.get("ticker") or "").upper()
        meta = metadata.get(ticker)
        if not meta:
            continue
        for key in ("company_name", "exchange", "exchange_name"):
            if not row.get(key) and meta.get(key):
                row[key] = meta[key]
                updated += 1

    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Updated {updated} fields across {len(rows)} rows in {path}")


if __name__ == "__main__":
    main()
