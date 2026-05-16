#!/usr/bin/env python3
"""
Run a dedicated ETF scan and write etf_results_latest.json.

This intentionally reuses the stock scanner's technical engine, then adds ETF
specific labels and options strategy guidance. It is safe to run as a separate
nightly job before scripts/deploy_static_firebase.py.
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.scanner import assign_percentile_rank, scan_ticker  # noqa: E402

DEFAULT_UNIVERSE = ROOT / "data" / "etf_universe.json"
DEFAULT_OUTPUT = ROOT / "etf_results_latest.json"


def load_universe(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text())
    if not isinstance(data, list):
        raise SystemExit(f"ETF universe must be a list: {path}")
    rows = []
    for item in data:
        if isinstance(item, str):
            rows.append({"ticker": item.upper(), "name": item.upper(), "theme": "ETF", "option_style": "core_index"})
        elif isinstance(item, dict) and item.get("ticker"):
            row = dict(item)
            row["ticker"] = str(row["ticker"]).upper()
            rows.append(row)
    return rows


def etf_strategy(row: dict[str, Any]) -> dict[str, str]:
    style = row.get("etf_option_style") or "core_index"
    atr = row.get("atr_pct") or 0
    rsi = row.get("rsi")
    squeeze = bool(row.get("squeeze"))
    momentum = "Momentum" in (row.get("categories") or [])
    oversold = "Oversold" in (row.get("categories") or []) or (rsi is not None and rsi < 35)

    if squeeze:
        return {
            "strategy": "Long straddle / strangle",
            "rationale": "ETF volatility is compressed. Use defined debit volatility if you expect a sector or macro breakout.",
        }
    if style in {"rates", "credit"}:
        return {
            "strategy": "Debit spread or calendar spread",
            "rationale": "Rate and credit ETFs often move around macro data. Use defined-risk spreads and avoid oversized short gamma.",
        }
    if style in {"commodity", "commodity_sensitive"} and atr >= 3:
        return {
            "strategy": "Defined-risk vertical spread",
            "rationale": "Commodity-linked ETFs can gap on macro headlines. Spreads control risk while preserving directional exposure.",
        }
    if oversold:
        return {
            "strategy": "Bull put spread / cash-secured put",
            "rationale": "Oversold ETF conditions favor mean reversion, but broad baskets can stay weak. Sell defined-risk downside premium.",
        }
    if momentum and atr >= 2:
        return {
            "strategy": "Bull call spread",
            "rationale": "Momentum with elevated volatility favors call spreads over outright calls to reduce premium cost.",
        }
    if momentum:
        return {
            "strategy": "Call spread / LEAPS call spread",
            "rationale": "Trend is constructive and ETF diversification lowers single-name gap risk. Use longer-dated defined-risk upside.",
        }
    return {
        "strategy": "Iron condor / covered call overlay",
        "rationale": "No strong directional edge. Favor neutral income structures if liquidity and spreads are acceptable.",
    }


def scan_one(meta: dict[str, Any], fetch_news: bool) -> dict[str, Any] | None:
    row = scan_ticker(meta["ticker"], fetch_news=fetch_news)
    if not row:
        return None
    row["asset_type"] = "ETF"
    row["etf_name"] = meta.get("name") or row.get("company_name") or meta["ticker"]
    row["company_name"] = row["etf_name"]
    row["etf_theme"] = meta.get("theme") or "ETF"
    row["etf_option_style"] = meta.get("option_style") or "core_index"
    row["etf_strategy"] = etf_strategy(row)
    row["universe"] = "etf"
    row["categories"] = list(dict.fromkeys((row.get("categories") or []) + ["ETF"]))
    return row


def main() -> int:
    parser = argparse.ArgumentParser(description="Run ETF scanner.")
    parser.add_argument("--universe", default=str(DEFAULT_UNIVERSE), help="ETF universe JSON")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output JSON")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument("--fetch-news", action="store_true", help="Fetch news during ETF scan")
    args = parser.parse_args()

    started_at = datetime.utcnow().isoformat() + "Z"
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

    finished_at = datetime.utcnow().isoformat() + "Z"
    payload = {
        "scan_started_at": started_at,
        "scan_finished_at": finished_at,
        "total_hits": len(results),
        "top_ranked": results[: args.top],
        "all_etfs": results,
        "summary": build_summary(results[: args.top]),
    }
    out = Path(args.output).expanduser().resolve()
    out.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    print(f"[etf-scan] wrote {len(results)} ETF rows -> {out}")
    return 0


def build_summary(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "No ETF setups found."
    leaders = ", ".join(r["ticker"] for r in rows[:5])
    themes = []
    for row in rows:
        theme = row.get("etf_theme")
        if theme and theme not in themes:
            themes.append(theme)
    return f"Top ETF setups: {leaders}. Leading themes: {', '.join(themes[:5])}."


if __name__ == "__main__":
    raise SystemExit(main())
