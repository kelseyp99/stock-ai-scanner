#!/usr/bin/env python3
"""
Build institutional ownership change signals from Form 13F data.

13F data is delayed up to 45 days and should be treated as context, not a hard
buy/sell requirement. This script normalizes 13F holdings into the same
INSTITUTIONAL_OWNERSHIP_CHANGES_FILE JSON that the scanner already reads.

Supported inputs:
- Normalized CSV/JSON holdings rows with columns like:
  manager, ticker, issuer, cusip, report_date, filing_date, shares, value
- SEC 13F information-table XML files via --info-table-xml. SEC XML usually
  contains CUSIP but not ticker, so provide --cusip-map when possible.

Example:
  .venv/bin/python scripts/ingest_13f_filings.py \
    --input data/13f_holdings_input.example.csv \
    --output data/institutional_ownership_changes.json
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DEFAULT_OUTPUT = DATA_DIR / "institutional_ownership_changes.json"


def parse_date(value: Any) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        return None


def safe_float(value: Any) -> float:
    try:
        if value in (None, ""):
            return 0.0
        return float(str(value).replace("$", "").replace(",", "").strip())
    except Exception:
        return 0.0


def normalize_ticker(value: Any) -> str:
    return str(value or "").strip().upper().replace("/", ".")


def load_cusip_map(path: str | None) -> dict[str, str]:
    if not path:
        return {}
    p = Path(path).expanduser().resolve()
    if not p.exists():
        return {}
    if p.suffix.lower() == ".json":
        data = json.loads(p.read_text())
        return {str(k).upper(): normalize_ticker(v) for k, v in data.items() if v}
    with p.open(newline="", encoding="utf-8-sig") as f:
        rows = csv.DictReader(f)
        out: dict[str, str] = {}
        for row in rows:
            cusip = str(row.get("cusip") or row.get("CUSIP") or "").strip().upper()
            ticker = normalize_ticker(row.get("ticker") or row.get("symbol"))
            if cusip and ticker:
                out[cusip] = ticker
        return out


def read_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
        if isinstance(data, dict):
            rows: list[dict[str, Any]] = []
            for ticker, value in data.items():
                if isinstance(value, list):
                    rows.extend({"ticker": ticker, **r} for r in value if isinstance(r, dict))
            return rows
        return []
    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def _strip_ns(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _child_text(node: ET.Element, names: set[str]) -> str:
    for child in list(node):
        if _strip_ns(child.tag) in names:
            return (child.text or "").strip()
    return ""


def read_info_table_xml(path: Path, cusip_map: dict[str, str], manager: str = "") -> list[dict[str, Any]]:
    tree = ET.parse(path)
    root = tree.getroot()
    rows: list[dict[str, Any]] = []
    for info in root.iter():
        if _strip_ns(info.tag) != "infotable":
            continue
        cusip = _child_text(info, {"cusip"}).upper()
        ticker = cusip_map.get(cusip, "")
        rows.append({
            "manager": manager or path.stem,
            "ticker": ticker,
            "issuer": _child_text(info, {"nameofissuer"}),
            "cusip": cusip,
            "value": safe_float(_child_text(info, {"value"})) * 1000,
            "shares": safe_float(_child_text(info, {"sshprnamt"})),
            "report_date": "",
            "filing_date": "",
            "source": str(path),
        })
    return rows


def normalize_row(row: dict[str, Any]) -> dict[str, Any] | None:
    ticker = normalize_ticker(row.get("ticker") or row.get("symbol"))
    if not ticker:
        return None
    value = safe_float(row.get("value") or row.get("market_value") or row.get("value_usd"))
    shares = safe_float(row.get("shares") or row.get("share_count") or row.get("sshPrnamt"))
    report_date = parse_date(row.get("report_date") or row.get("period_of_report") or row.get("quarter"))
    filing_date = parse_date(row.get("filing_date") or row.get("filed_at") or row.get("accepted_at"))
    return {
        "manager": row.get("manager") or row.get("institution") or row.get("filer") or "",
        "ticker": ticker,
        "issuer": row.get("issuer") or row.get("nameOfIssuer") or row.get("company") or "",
        "cusip": str(row.get("cusip") or "").strip().upper(),
        "value": value,
        "shares": shares,
        "report_date": report_date,
        "filing_date": filing_date,
        "source": row.get("source") or "13f_extract",
    }


def aggregate(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_ticker_period: dict[str, dict[str, list[dict[str, Any]]]] = defaultdict(lambda: defaultdict(list))
    for raw in rows:
        row = normalize_row(raw)
        if not row:
            continue
        period = row.get("report_date") or "unknown"
        by_ticker_period[row["ticker"]][period].append(row)

    output: dict[str, Any] = {}
    for ticker, by_period in sorted(by_ticker_period.items()):
        periods = sorted([p for p in by_period if p != "unknown"])
        if not periods and "unknown" in by_period:
            periods = ["unknown"]
        if not periods:
            continue
        latest_period = periods[-1]
        previous_period = periods[-2] if len(periods) >= 2 else None
        latest_rows = by_period[latest_period]
        previous_rows = by_period.get(previous_period, []) if previous_period else []

        latest_value = sum(r["value"] for r in latest_rows)
        previous_value = sum(r["value"] for r in previous_rows)
        latest_shares = sum(r["shares"] for r in latest_rows)
        previous_shares = sum(r["shares"] for r in previous_rows)
        managers = sorted({r["manager"] for r in latest_rows if r.get("manager")})
        previous_managers = {r["manager"] for r in previous_rows if r.get("manager")}
        new_managers = [m for m in managers if m not in previous_managers]

        value_delta = latest_value - previous_value
        shares_delta = latest_shares - previous_shares
        delta_pct = None
        if previous_value > 0:
            delta_pct = round(value_delta / previous_value * 100, 2)
        elif latest_value > 0 and not previous_rows:
            delta_pct = 100.0

        trend = (
            "Accumulation" if (delta_pct or 0) >= 2 else
            "Distribution" if (delta_pct or 0) <= -2 else
            "Stable"
        )
        notable = []
        if delta_pct is not None and abs(delta_pct) >= 10:
            direction = "buying" if delta_pct > 0 else "selling"
            notable.append(f"13F {direction}: {delta_pct:+.1f}% QoQ value change")
        if new_managers:
            notable.append(f"New holders: {', '.join(new_managers[:4])}")

        output[ticker] = {
            "institutional_ownership_delta_pct": delta_pct,
            "institutional_ownership_trend": trend,
            "institutional_ownership_source": "sec_13f_qoq",
            "institutional_13f_latest_period": latest_period,
            "institutional_13f_previous_period": previous_period,
            "institutional_13f_value": round(latest_value, 2),
            "institutional_13f_previous_value": round(previous_value, 2),
            "institutional_13f_value_delta": round(value_delta, 2),
            "institutional_13f_shares": round(latest_shares, 4),
            "institutional_13f_shares_delta": round(shares_delta, 4),
            "institutional_13f_manager_count": len(managers),
            "institutional_13f_new_managers": new_managers[:10],
            "institutional_13f_top_managers": managers[:10],
            "institutional_13f_notable": notable,
            "source": "sec_13f_qoq",
        }
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize 13F holdings into scanner institutional signals.")
    parser.add_argument("--input", action="append", default=[], help="CSV/JSON normalized 13F holdings file. Can be repeated.")
    parser.add_argument("--info-table-xml", action="append", default=[], help="SEC 13F information table XML file. Can be repeated.")
    parser.add_argument("--cusip-map", default=None, help="CSV/JSON CUSIP to ticker map for SEC XML rows.")
    parser.add_argument("--manager", default="", help="Manager name to apply to --info-table-xml rows.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Ticker-keyed JSON output path.")
    args = parser.parse_args()

    rows: list[dict[str, Any]] = []
    for raw_path in args.input:
        rows.extend(read_rows(Path(raw_path).expanduser().resolve()))

    cusip_map = load_cusip_map(args.cusip_map)
    for raw_path in args.info_table_xml:
        rows.extend(read_info_table_xml(Path(raw_path).expanduser().resolve(), cusip_map, args.manager))

    output = aggregate(rows)
    out_path = Path(args.output).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"[13f] wrote {len(output)} tickers -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
