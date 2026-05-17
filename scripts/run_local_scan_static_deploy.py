#!/usr/bin/env python3
"""
Run local stock, ETF, and crypto scans, generate the static Firebase snapshot,
and deploy it.

This is the local/manual equivalent of the Hetzner nightly flow:
1. Run scripts/run_scan_now.py.
2. Write scan_results_latest.json.
3. Run scripts/run_etf_scan.py.
4. Run scripts/run_crypto_scan.py.
5. Run scripts/run_reflag_scan.py.
6. Run scripts/deploy_static_firebase.py.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULTS_JSON = ROOT / "scan_results_latest.json"
GOVERNMENT_TRADES_JSON = ROOT / "data" / "government_trades.json"
DEFAULT_GOVERNMENT_TRADES_INPUT = ROOT / "data" / "government_trades_input.csv"


def run(cmd: list[str], cwd: Path) -> None:
    print(f"[local-scan-deploy] {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, cwd=str(cwd), check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run stock, ETF, and crypto scans, build static snapshot, and deploy to Firebase.")
    parser.add_argument("--universes", nargs="+", default=["sp500", "nasdaq100", "russell2000"])
    parser.add_argument("--workers", type=int, default=20)
    parser.add_argument("--top", type=int, default=25)
    parser.add_argument("--news-finalists", type=int, default=100)
    parser.add_argument("--news-workers", type=int, default=6)
    parser.add_argument("--max", type=int, default=None, help="Limit tickers per universe. Omit with --full for all tickers.")
    parser.add_argument("--full", action="store_true", default=True, help="Scan all tickers in each universe. Default: true.")
    parser.add_argument("--quick", action="store_true", help="Use run_scan_now.py default quick mode instead of --full.")
    parser.add_argument("--skip-deploy", action="store_true", help="Run scan and static build but do not deploy to Firebase.")
    parser.add_argument("--skip-build", action="store_true", help="Only regenerate static data and deploy existing frontend/dist.")
    parser.add_argument("--skip-etfs", action="store_true", help="Skip the ETF scanner.")
    parser.add_argument("--with-etfs", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--etf-workers", type=int, default=8)
    parser.add_argument("--etf-top", type=int, default=20)
    parser.add_argument("--skip-crypto", action="store_true", help="Skip the large-cap crypto scanner.")
    parser.add_argument("--with-crypto", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--crypto-limit", type=int, default=30)
    parser.add_argument("--crypto-top", type=int, default=20)
    parser.add_argument("--skip-reflags", action="store_true", help="Skip the re-flagged opportunities scanner.")
    parser.add_argument("--reflag-limit", type=int, default=250)
    parser.add_argument("--persist-reflags", action="store_true", help="Persist re-flag Fib/alert rows to MySQL.")
    parser.add_argument("--government-trades-input", action="append", default=[], help="CSV/JSON STOCK Act disclosure rows to normalize before scanning. Can be repeated.")
    parser.add_argument("--skip-government-trades-ingest", action="store_true", help="Skip normalizing configured government trade input files.")
    parser.add_argument("--project", default="thetaforge-35430", help="Firebase project id.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    government_inputs = [Path(p).expanduser() for p in args.government_trades_input]
    if not government_inputs and DEFAULT_GOVERNMENT_TRADES_INPUT.exists():
        government_inputs = [DEFAULT_GOVERNMENT_TRADES_INPUT]
    if government_inputs and not args.skip_government_trades_ingest:
        gov_cmd = [
            sys.executable,
            "scripts/ingest_government_trades.py",
            "--output",
            str(GOVERNMENT_TRADES_JSON),
        ]
        for path in government_inputs:
            gov_cmd.extend(["--input", str(path)])
        run(gov_cmd, cwd=ROOT)

    scan_cmd = [
        sys.executable,
        "scripts/run_scan_now.py",
        "--universes",
        *args.universes,
        "--workers",
        str(args.workers),
        "--top",
        str(args.top),
        "--news-finalists",
        str(args.news_finalists),
        "--news-workers",
        str(args.news_workers),
    ]
    if args.quick:
        if args.max is not None:
            scan_cmd.extend(["--max", str(args.max)])
    elif args.max is not None:
        scan_cmd.extend(["--max", str(args.max)])
    else:
        scan_cmd.append("--full")

    run(scan_cmd, cwd=ROOT)

    if not RESULTS_JSON.exists():
        raise SystemExit(f"Expected scan output missing: {RESULTS_JSON}")

    run_etfs = not args.skip_etfs or args.with_etfs
    run_crypto = not args.skip_crypto or args.with_crypto

    if run_etfs:
        run([
            sys.executable,
            "scripts/run_etf_scan.py",
            "--workers",
            str(args.etf_workers),
            "--top",
            str(args.etf_top),
        ], cwd=ROOT)

    if run_crypto:
        run([
            sys.executable,
            "scripts/run_crypto_scan.py",
            "--limit",
            str(args.crypto_limit),
            "--top",
            str(args.crypto_top),
        ], cwd=ROOT)

    if not args.skip_reflags:
        reflag_cmd = [
            sys.executable,
            "scripts/run_reflag_scan.py",
            "--limit",
            str(args.reflag_limit),
            "--seed-history",
        ]
        if args.persist_reflags:
            reflag_cmd.append("--persist")
        run(reflag_cmd, cwd=ROOT)

    deploy_cmd = [
        sys.executable,
        "scripts/deploy_static_firebase.py",
        "--project",
        args.project,
    ]
    if args.skip_build:
        deploy_cmd.append("--skip-build")
    if args.skip_deploy:
        deploy_cmd.append("--skip-deploy")

    run(deploy_cmd, cwd=ROOT)


if __name__ == "__main__":
    main()
