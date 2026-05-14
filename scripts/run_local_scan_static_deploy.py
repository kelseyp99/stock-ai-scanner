#!/usr/bin/env python3
"""
Run a local stock scan, generate the static Firebase snapshot, and deploy it.

This is the local/manual equivalent of the Hetzner nightly flow:
1. Run scripts/run_scan_now.py.
2. Write scan_results_latest.json.
3. Run scripts/deploy_static_firebase.py.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULTS_JSON = ROOT / "scan_results_latest.json"


def run(cmd: list[str], cwd: Path) -> None:
    print(f"[local-scan-deploy] {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, cwd=str(cwd), check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local scan, build static snapshot, and deploy to Firebase.")
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
    parser.add_argument("--project", default="thetaforge-35430", help="Firebase project id.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

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
