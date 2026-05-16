#!/usr/bin/env python3
"""Run the re-flagged opportunities scanner."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.database.session import SessionLocal  # noqa: E402
from app.services.reflag_scanner import (  # noqa: E402
    LATEST_REFLAG_JSON,
    candidates_from_db,
    candidates_from_latest_json,
    run_reflag_scan,
    save_candidates_to_history,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Re-scan historical scanner candidates for Fib/reversal/exhaustion setups.")
    parser.add_argument("--output", default=str(LATEST_REFLAG_JSON))
    parser.add_argument("--limit", type=int, default=250)
    parser.add_argument("--persist", action="store_true", help="Persist alerts/Fib rows to MySQL.")
    parser.add_argument("--seed-history", action="store_true", help="Save latest JSON candidates into scanner_candidate_history before scanning.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db = SessionLocal()
    try:
      latest_paths = [
          ROOT / "scan_results_latest.json",
          ROOT / "etf_results_latest.json",
          ROOT / "crypto_results_latest.json",
      ]
      latest_candidates = candidates_from_latest_json(latest_paths)
      if args.seed_history and latest_candidates:
          saved = save_candidates_to_history(db, latest_candidates, source="latest-json")
          print(f"[reflag-scan] saved {saved} latest candidates to history")

      db_candidates = candidates_from_db(db, limit=args.limit)
      candidates = db_candidates or latest_candidates
      payload = run_reflag_scan(
          candidates,
          db=db if args.persist else None,
          output_path=Path(args.output).expanduser().resolve(),
          limit=args.limit,
      )
      print(f"[reflag-scan] wrote {payload['total_hits']} rows -> {args.output}")
      return 0
    finally:
      db.close()


if __name__ == "__main__":
    raise SystemExit(main())
