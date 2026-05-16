#!/usr/bin/env python3
"""
Run a dedicated large-cap crypto scan and write crypto_results_latest.json.

The scanner uses CoinGecko's coins/markets endpoint by default. It keeps this
as a nightly/static snapshot, matching the stock and ETF deploy flow.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import statistics
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "crypto_results_latest.json"
DEFAULT_BASE_URL = "https://api.coingecko.com/api/v3"

STABLECOIN_IDS = {
    "tether",
    "usd-coin",
    "dai",
    "first-digital-usd",
    "usds",
    "paypal-usd",
    "ethena-usde",
    "binance-usd",
    "true-usd",
    "frax",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def pct(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n):
        return None
    return n


def fetch_markets(args: argparse.Namespace) -> list[dict[str, Any]]:
    base_url = os.environ.get("COINGECKO_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    url = f"{base_url}/coins/markets"
    params = {
        "vs_currency": args.vs_currency,
        "order": "market_cap_desc",
        "per_page": min(max(args.limit + 20, args.limit), 250),
        "page": 1,
        "sparkline": "true",
        "price_change_percentage": "1h,24h,7d,14d,30d,200d,1y",
        "locale": "en",
    }
    headers = {
        "accept": "application/json",
        "user-agent": "ThetaBrew crypto scanner/1.0",
    }
    api_key = os.environ.get("COINGECKO_API_KEY") or os.environ.get("CG_API_KEY")
    if api_key:
        headers["x-cg-demo-api-key"] = api_key
        headers["x-cg-pro-api-key"] = api_key

    resp = requests.get(url, params=params, headers=headers, timeout=args.timeout)
    resp.raise_for_status()
    data = resp.json()
    if not isinstance(data, list):
        raise RuntimeError(f"CoinGecko returned unexpected payload: {type(data).__name__}")
    return data


def sparkline_stats(prices: list[Any]) -> dict[str, float | None]:
    clean = [float(p) for p in prices if isinstance(p, (int, float)) and math.isfinite(float(p))]
    if len(clean) < 3:
        return {"sparkline_return_7d": None, "sparkline_volatility_7d": None, "sparkline_drawdown_7d": None}
    start = clean[0]
    end = clean[-1]
    high = max(clean)
    returns = []
    for prev, cur in zip(clean, clean[1:]):
        if prev > 0:
            returns.append((cur - prev) / prev)
    vol = statistics.pstdev(returns) * math.sqrt(len(returns)) * 100 if len(returns) > 1 else None
    return {
        "sparkline_return_7d": ((end - start) / start * 100) if start else None,
        "sparkline_volatility_7d": vol,
        "sparkline_drawdown_7d": ((end - high) / high * 100) if high else None,
    }


def categorize(row: dict[str, Any]) -> list[str]:
    cats: list[str] = []
    change_7d = row.get("price_change_percentage_7d")
    change_30d = row.get("price_change_percentage_30d")
    change_24h = row.get("price_change_percentage_24h")
    volume_ratio = row.get("volume_to_market_cap")
    drawdown = row.get("ath_change_percentage")

    if change_7d is not None and change_7d >= 8:
        cats.append("Crypto Momentum")
    if change_30d is not None and change_30d >= 20:
        cats.append("Large-Cap Trend")
    if change_24h is not None and abs(change_24h) >= 6:
        cats.append("High Volatility")
    if volume_ratio is not None and volume_ratio >= 0.08:
        cats.append("Heavy Volume")
    if drawdown is not None and drawdown <= -50:
        cats.append("Deep ATH Discount")
    if not cats:
        cats.append("Core Crypto")
    return cats


def score_crypto(row: dict[str, Any]) -> float:
    rank = row.get("market_cap_rank") or 999
    change_1h = row.get("price_change_percentage_1h") or 0
    change_24h = row.get("price_change_percentage_24h") or 0
    change_7d = row.get("price_change_percentage_7d") or row.get("sparkline_return_7d") or 0
    change_30d = row.get("price_change_percentage_30d") or 0
    volume_ratio = row.get("volume_to_market_cap") or 0
    ath_drawdown = row.get("ath_change_percentage") or -100
    volatility = row.get("sparkline_volatility_7d") or 0

    rank_score = max(0, 35 - (rank * 0.7))
    momentum_score = max(-15, min(25, change_7d * 0.8)) + max(-10, min(15, change_30d * 0.25))
    flow_score = min(15, volume_ratio * 120)
    recovery_score = max(0, min(10, (ath_drawdown + 80) / 8))
    short_term_penalty = min(12, abs(change_1h) * 1.5) if abs(change_1h) > 5 else 0
    volatility_penalty = min(12, volatility / 4) if volatility > 35 else 0
    crash_penalty = 10 if change_24h < -8 else 0
    return round(max(0, min(100, 45 + rank_score + momentum_score + flow_score + recovery_score - short_term_penalty - volatility_penalty - crash_penalty)), 1)


def strategy_for(row: dict[str, Any]) -> dict[str, str]:
    symbol = row.get("symbol", "").upper()
    change_7d = row.get("price_change_percentage_7d") or 0
    change_30d = row.get("price_change_percentage_30d") or 0
    volume_ratio = row.get("volume_to_market_cap") or 0
    volatility = row.get("sparkline_volatility_7d") or 0
    drawdown = row.get("ath_change_percentage") or 0

    if volatility >= 45 or abs(row.get("price_change_percentage_24h") or 0) >= 8:
        return {
            "strategy": "Small position / wait for confirmation",
            "rationale": f"{symbol} is moving sharply. Keep sizing conservative and avoid chasing an extended intraday candle.",
        }
    if change_7d >= 8 and change_30d >= 15 and volume_ratio >= 0.04:
        return {
            "strategy": "Trend-following core position",
            "rationale": f"{symbol} has multi-window momentum with healthy volume. Scale entries and define an invalidation level.",
        }
    if drawdown <= -50 and change_7d > 0:
        return {
            "strategy": "Mean-reversion starter",
            "rationale": f"{symbol} remains far below its ATH but is showing a positive short-term turn. Treat it as speculative.",
        }
    if row.get("market_cap_rank", 999) <= 5:
        return {
            "strategy": "Core allocation / covered-call proxy via related ETFs if available",
            "rationale": f"{symbol} is a top large-cap crypto asset. Favor staged entries over short-term prediction.",
        }
    return {
        "strategy": "Watchlist candidate",
        "rationale": f"{symbol} has enough liquidity for monitoring, but the current edge is not strong enough for aggressive sizing.",
    }


def normalize_coin(raw: dict[str, Any]) -> dict[str, Any]:
    sparkline = ((raw.get("sparkline_in_7d") or {}).get("price") or [])
    stats = sparkline_stats(sparkline)
    market_cap = pct(raw.get("market_cap")) or 0
    volume = pct(raw.get("total_volume")) or 0
    row = {
        "id": raw.get("id"),
        "symbol": str(raw.get("symbol") or "").upper(),
        "name": raw.get("name"),
        "image": raw.get("image"),
        "price": pct(raw.get("current_price")),
        "market_cap": market_cap,
        "market_cap_rank": raw.get("market_cap_rank"),
        "total_volume": volume,
        "volume_to_market_cap": round(volume / market_cap, 4) if market_cap else None,
        "high_24h": pct(raw.get("high_24h")),
        "low_24h": pct(raw.get("low_24h")),
        "ath": pct(raw.get("ath")),
        "ath_change_percentage": pct(raw.get("ath_change_percentage")),
        "ath_date": raw.get("ath_date"),
        "atl": pct(raw.get("atl")),
        "atl_change_percentage": pct(raw.get("atl_change_percentage")),
        "price_change_percentage_1h": pct(raw.get("price_change_percentage_1h_in_currency")),
        "price_change_percentage_24h": pct(raw.get("price_change_percentage_24h_in_currency") or raw.get("price_change_percentage_24h")),
        "price_change_percentage_7d": pct(raw.get("price_change_percentage_7d_in_currency")),
        "price_change_percentage_14d": pct(raw.get("price_change_percentage_14d_in_currency")),
        "price_change_percentage_30d": pct(raw.get("price_change_percentage_30d_in_currency")),
        "price_change_percentage_200d": pct(raw.get("price_change_percentage_200d_in_currency")),
        "price_change_percentage_1y": pct(raw.get("price_change_percentage_1y_in_currency")),
        "circulating_supply": pct(raw.get("circulating_supply")),
        "total_supply": pct(raw.get("total_supply")),
        "max_supply": pct(raw.get("max_supply")),
        "last_updated": raw.get("last_updated"),
        **stats,
    }
    row["categories"] = categorize(row)
    row["score"] = score_crypto(row)
    row["crypto_strategy"] = strategy_for(row)
    row["explanation"] = build_explanation(row)
    return row


def build_explanation(row: dict[str, Any]) -> str:
    parts = [
        f"Rank #{row.get('market_cap_rank') or '?'} by market cap",
        f"7d {fmt_pct(row.get('price_change_percentage_7d'))}",
        f"30d {fmt_pct(row.get('price_change_percentage_30d'))}",
        f"volume/market cap {fmt_pct((row.get('volume_to_market_cap') or 0) * 100)}",
    ]
    if row.get("ath_change_percentage") is not None:
        parts.append(f"{fmt_pct(row.get('ath_change_percentage'))} from ATH")
    return "; ".join(parts) + "."


def fmt_pct(value: Any) -> str:
    n = pct(value)
    if n is None:
        return "n/a"
    return f"{n:+.1f}%"


def build_summary(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "No large-cap crypto rows were returned."
    leaders = ", ".join(row["symbol"] for row in rows[:5])
    categories: list[str] = []
    for row in rows:
        for cat in row.get("categories") or []:
            if cat not in categories:
                categories.append(cat)
    return f"Top large-cap crypto setups: {leaders}. Current themes: {', '.join(categories[:5])}."


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run large-cap crypto analysis using CoinGecko market data.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output JSON path.")
    parser.add_argument("--limit", type=int, default=30, help="Number of non-stablecoin large-cap assets to keep.")
    parser.add_argument("--top", type=int, default=20, help="Number of ranked rows to show on the dashboard.")
    parser.add_argument("--vs-currency", default="usd")
    parser.add_argument("--include-stablecoins", action="store_true")
    parser.add_argument("--timeout", type=int, default=30)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    started_at = utc_now()
    raw_rows = fetch_markets(args)
    rows = []
    for raw in raw_rows:
        if not args.include_stablecoins and raw.get("id") in STABLECOIN_IDS:
            continue
        rows.append(normalize_coin(raw))
        if len(rows) >= args.limit:
            break

    rows.sort(key=lambda row: (-(row.get("score") or 0), row.get("market_cap_rank") or 999))
    for idx, row in enumerate(rows, start=1):
        row["featured_rank"] = idx

    payload = {
        "provider": "coingecko",
        "provider_url": "https://www.coingecko.com/",
        "scan_started_at": started_at,
        "scan_finished_at": utc_now(),
        "vs_currency": args.vs_currency,
        "total_hits": len(rows),
        "top_ranked": rows[: args.top],
        "all_crypto": rows,
        "summary": build_summary(rows[: args.top]),
    }
    out = Path(args.output).expanduser().resolve()
    out.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    print(f"[crypto-scan] wrote {len(rows)} crypto rows -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
