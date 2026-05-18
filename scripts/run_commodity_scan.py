#!/usr/bin/env python3
"""
Run a dedicated commodity proxy scan and write commodity_results_latest.json.

The dashboard uses liquid commodity ETFs and commodity-sensitive funds as
tradable proxies for gold, oil, natural gas, agriculture, and metals.
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.scanner import assign_percentile_rank, scan_ticker  # noqa: E402

DEFAULT_UNIVERSE = ROOT / "data" / "commodity_universe.json"
DEFAULT_OUTPUT = ROOT / "commodity_results_latest.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_universe(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text())
    if not isinstance(data, list):
        raise SystemExit(f"Commodity universe must be a list: {path}")
    rows = []
    for item in data:
        if isinstance(item, str):
            rows.append({
                "ticker": item.upper(),
                "name": item.upper(),
                "theme": "Commodity",
                "commodity_group": "Commodity",
                "option_style": "broad_commodity",
            })
        elif isinstance(item, dict) and item.get("ticker"):
            row = dict(item)
            row["ticker"] = str(row["ticker"]).upper()
            rows.append(row)
    return rows


def commodity_strategy(row: dict[str, Any]) -> dict[str, str]:
    style = row.get("commodity_option_style") or "broad_commodity"
    atr = row.get("atr_pct") or 0
    rsi = row.get("rsi")
    momentum = "Momentum" in (row.get("categories") or [])
    oversold = "Oversold" in (row.get("categories") or []) or (rsi is not None and rsi < 35)

    if style == "energy" and atr >= 4:
        return {
            "strategy": "Defined-risk vertical spread",
            "rationale": "Energy proxies can gap around inventory, OPEC, weather, and geopolitical headlines. Keep directional risk defined.",
        }
    if style == "agriculture":
        return {
            "strategy": "Small debit spread / staged entry",
            "rationale": "Agriculture funds can move on weather and crop reports with uneven liquidity. Favor smaller defined-risk structures.",
        }
    if oversold:
        return {
            "strategy": "Mean-reversion starter or bull put spread",
            "rationale": "The commodity proxy is washed out. Wait for stabilization or sell defined-risk downside premium only if spreads are liquid.",
        }
    if momentum and atr >= 3:
        return {
            "strategy": "Call spread / put spread with defined exit",
            "rationale": "Commodity momentum is active and volatility is elevated. Use spreads to reduce premium and cap headline risk.",
        }
    if style == "precious_metals":
        return {
            "strategy": "Call spread or collar around core exposure",
            "rationale": "Precious metals often react to real rates, dollar strength, and risk-off flows. Scale entries around support zones.",
        }
    return {
        "strategy": "Watchlist / defined-risk spread",
        "rationale": "Commodity setup is mixed. Wait for a clearer trend, pullback zone, or volume confirmation.",
    }


def scan_one(meta: dict[str, Any], fetch_news: bool) -> dict[str, Any] | None:
    row = scan_ticker(meta["ticker"], fetch_news=fetch_news)
    if not row:
        return None
    row["asset_type"] = "commodity"
    row["commodity_name"] = meta.get("name") or row.get("company_name") or meta["ticker"]
    row["company_name"] = row["commodity_name"]
    row["commodity_theme"] = meta.get("theme") or "Commodity"
    row["commodity_group"] = meta.get("commodity_group") or "Commodity"
    row["commodity_option_style"] = meta.get("option_style") or "broad_commodity"
    row["commodity_strategy"] = commodity_strategy(row)
    row["universe"] = "commodities"
    row["categories"] = list(dict.fromkeys((row.get("categories") or []) + ["Commodities"]))
    return row


def build_summary(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "No commodity proxy setups found."
    leaders = ", ".join(row["ticker"] for row in rows[:5])
    groups = []
    for row in rows:
        group = row.get("commodity_group")
        if group and group not in groups:
            groups.append(group)
    return f"Top commodity setups: {leaders}. Leading groups: {', '.join(groups[:5])}."


def main() -> int:
    parser = argparse.ArgumentParser(description="Run commodity proxy scanner.")
    parser.add_argument("--universe", default=str(DEFAULT_UNIVERSE), help="Commodity universe JSON")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output JSON")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument("--fetch-news", action="store_true", help="Fetch news during commodity scan")
    args = parser.parse_args()

    started_at = utc_now()
    universe = load_universe(Path(args.universe).expanduser().resolve())
    results: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(scan_one, meta, args.fetch_news): meta["ticker"] for meta in universe}
        for future in as_completed(futures):
            row = future.result()
            if row:
                results.append(row)

    results.sort(key=lambda r: (-(r.get("score") or 0), -(r.get("relative_strength_20d") or 0), -(r.get("volume_ratio") or 0)))
    scores = [r.get("score") or 0 for r in results]
    for idx, row in enumerate(results, start=1):
        row["featured_rank"] = idx
        row["percentile_rank"], row["percentile_label"] = assign_percentile_rank(row.get("score") or 0, scores)

    payload = {
        "scan_started_at": started_at,
        "scan_finished_at": utc_now(),
        "total_hits": len(results),
        "top_ranked": results[: args.top],
        "all_commodities": results,
        "summary": build_summary(results[: args.top]),
    }
    out = Path(args.output).expanduser().resolve()
    out.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    print(f"[commodity-scan] wrote {len(results)} commodity rows -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
