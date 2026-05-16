#!/usr/bin/env python3
"""
Build and deploy a static Firebase snapshot from scan_results_latest.json.

This is the deploy path for nightly scans:
1. Convert the latest scanner JSON into frontend/src/data/demoScanResults.ts.
2. Build the frontend in VITE_DEMO_MODE=true.
3. Deploy frontend/dist to Firebase Hosting.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
RESULTS_JSON = ROOT / "scan_results_latest.json"
ETF_RESULTS_JSON = ROOT / "etf_results_latest.json"
CRYPTO_RESULTS_JSON = ROOT / "crypto_results_latest.json"
REFLAG_RESULTS_JSON = ROOT / "reflag_results_latest.json"
DEMO_DATA_TS = FRONTEND / "src" / "data" / "demoScanResults.ts"
DEFAULT_FIREBASE_PROJECT = "thetaforge-35430"

CATEGORY_ORDER = [
    "Momentum",
    "Breakout Volume",
    "Extreme Volatility",
    "High Volatility",
    "Dividend",
    "Institutional Accumulation",
    "Institutional Distribution",
    "Oversold",
    "Pullback Risk",
    "Speculative / High Risk",
    "🌀 Volatility Compression",
    "Bullish Crossover Setup",
    "Bearish Crossover Risk",
    "MA Converging",
]


def run(cmd: list[str], cwd: Path) -> None:
    print(f"[static-deploy] {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(cwd), check=True)


def unique_by_ticker(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for row in rows:
        ticker = str(row.get("ticker") or "").upper()
        if not ticker or ticker in seen:
            continue
        seen.add(ticker)
        out.append(row)
    return out


def collect_category_source(scan: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    rows.extend(scan.get("global_top") or [])
    for universe in (scan.get("by_universe") or {}).values():
        if isinstance(universe, dict):
            rows.extend(universe.get("top") or [])
    return unique_by_ticker(rows)


def build_by_category(scan: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    source = collect_category_source(scan)
    by_category: dict[str, list[dict[str, Any]]] = {}
    for category in CATEGORY_ORDER:
        matches = [
            row for row in source
            if category in (row.get("categories") or [])
        ]
        matches.sort(
            key=lambda row: (
                -(row.get("score") or 0),
                -(row.get("volume_ratio") or 0),
                -(row.get("atr_pct") or row.get("volatility") or 0),
            )
        )
        if matches:
            by_category[category] = matches[:8]
    return by_category


def build_institutional_activity(scan: dict[str, Any]) -> list[dict[str, Any]]:
    rows = [
        row for row in collect_category_source(scan)
        if row.get("institutional_ownership_delta_pct") is not None
    ]
    rows.sort(
        key=lambda row: (
            -abs(row.get("institutional_ownership_delta_pct") or 0),
            -(row.get("institutional_13f_value_delta") or 0),
            -(row.get("score") or 0),
        )
    )
    return rows[:40]


def build_government_activity(scan: dict[str, Any]) -> list[dict[str, Any]]:
    rows = [
        row for row in collect_category_source(scan)
        if (row.get("gov_trade_buy_count_90d") or row.get("gov_trade_sell_count_90d") or row.get("gov_trade_recent_trades"))
    ]
    rows.sort(
        key=lambda row: (
            -abs(row.get("gov_trade_net_amount_90d") or 0),
            -((row.get("gov_trade_buy_count_90d") or 0) + (row.get("gov_trade_sell_count_90d") or 0)),
            -(row.get("score") or 0),
        )
    )
    return rows[:40]


def build_static_payload(scan: dict[str, Any]) -> dict[str, Any]:
    top_ranked = scan.get("global_top") or scan.get("top_ranked") or []
    etf_scan = {}
    if ETF_RESULTS_JSON.exists():
        try:
            etf_scan = json.loads(ETF_RESULTS_JSON.read_text())
        except Exception:
            etf_scan = {}
    crypto_scan = {}
    if CRYPTO_RESULTS_JSON.exists():
        try:
            crypto_scan = json.loads(CRYPTO_RESULTS_JSON.read_text())
        except Exception:
            crypto_scan = {}
    reflag_scan = {}
    if REFLAG_RESULTS_JSON.exists():
        try:
            reflag_scan = json.loads(REFLAG_RESULTS_JSON.read_text())
        except Exception:
            reflag_scan = {}
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scan_started_at": scan.get("scan_started_at"),
        "scan_finished_at": scan.get("scan_finished_at"),
        "universes_scanned": scan.get("universes_scanned") or [],
        "total_scanned": scan.get("total_hits") or scan.get("total_scanned") or 0,
        "summary": scan.get("ai_summary") or scan.get("summary") or "",
        "top_ranked": top_ranked,
        "by_category": scan.get("by_category") or build_by_category(scan),
        "institutional_activity": scan.get("institutional_activity") or build_institutional_activity(scan),
        "government_activity": scan.get("government_activity") or build_government_activity(scan),
        "etf_recommendations": etf_scan,
        "crypto_analysis": crypto_scan,
        "reflag_analysis": reflag_scan,
    }
    return payload


def write_demo_data(results_path: Path) -> dict[str, Any]:
    scan = json.loads(results_path.read_text())
    payload = build_static_payload(scan)
    serialized = json.dumps(payload, indent=2, ensure_ascii=False)
    DEMO_DATA_TS.write_text(
        "// Auto-generated by scripts/deploy_static_firebase.py. Do not edit by hand.\n"
        f"const demo = {serialized}\n\n"
        "export default demo\n",
        encoding="utf-8",
    )
    print(
        "[static-deploy] wrote "
        f"{DEMO_DATA_TS.relative_to(ROOT)} "
        f"({len(payload['top_ranked'])} top, "
        f"{len(payload['by_category'])} categories)"
    )
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy a static scan snapshot to Firebase Hosting.")
    parser.add_argument("--results", default=str(RESULTS_JSON), help="Path to scan_results_latest.json")
    parser.add_argument("--project", default=DEFAULT_FIREBASE_PROJECT, help="Firebase project id")
    parser.add_argument("--message", default=None, help="Firebase release message")
    parser.add_argument("--skip-build", action="store_true", help="Only regenerate static data and deploy existing dist")
    parser.add_argument("--skip-deploy", action="store_true", help="Regenerate static data and build, but do not deploy")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    results_path = Path(args.results).expanduser().resolve()
    if not results_path.exists():
        raise SystemExit(f"Results file not found: {results_path}")

    payload = write_demo_data(results_path)

    if not args.skip_build:
        run(["npm", "run", "build:demo"], cwd=FRONTEND)

    if args.skip_deploy:
        print("[static-deploy] skip deploy requested")
        return

    finished = payload.get("scan_finished_at") or payload.get("generated_at")
    message = args.message or f"static scan snapshot {finished}"
    run(
        [
            "npx",
            "firebase",
            "deploy",
            "--only",
            "hosting",
            "--project",
            args.project,
            "--message",
            message,
        ],
        cwd=ROOT,
    )


if __name__ == "__main__":
    main()
