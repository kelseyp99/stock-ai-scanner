#!/usr/bin/env python3
"""
Build data/government_trades.json from public disclosure extracts.

This script is intentionally provider-neutral. Official House/Senate sources are
public, but the actual transaction rows may arrive as PDFs or Senate HTML tables.
Use this script as the normalizer/aggregator after rows have been extracted into
CSV or JSON.

Supported inputs:
- CSV/JSON transaction rows with columns like:
  ticker, member, transaction_type, amount or amount_range, trade_date,
  disclosure_date, chamber, source_url
- Optional House yearly ZIP metadata download to discover PTR PDFs:
  --download-house-metadata 2026

Output:
  data/government_trades.json
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import urllib.request
import zipfile
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DEFAULT_OUTPUT = DATA_DIR / "government_trades.json"
DEFAULT_REVIEW_DIR = DATA_DIR / "government_disclosure_sources"

HOUSE_BULK_URL = "https://disclosures-clerk.house.gov/public_disc/financial-pdfs/{year}FD.ZIP"
TICKER_RE = re.compile(r"\(([A-Z][A-Z0-9.\-]{0,7})\)|\bTicker:\s*([A-Z][A-Z0-9.\-]{0,7})\b")

AMOUNT_BANDS = [
    (1_000, 15_000),
    (15_001, 50_000),
    (50_001, 100_000),
    (100_001, 250_000),
    (250_001, 500_000),
    (500_001, 1_000_000),
    (1_000_001, 5_000_000),
    (5_000_001, 25_000_000),
    (25_000_001, 50_000_000),
]


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


def parse_amount_midpoint(value: Any) -> float:
    if value is None:
        return 0.0
    text = str(value).replace("$", "").replace(",", "").strip()
    if not text:
        return 0.0
    if text.lower() in {"over 50000000", "over 50,000,000", ">50000000"}:
        return 50_000_000.0
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", text)]
    if len(nums) >= 2:
        return (nums[0] + nums[1]) / 2
    if len(nums) == 1:
        n = nums[0]
        for low, high in AMOUNT_BANDS:
            if low <= n <= high:
                return (low + high) / 2
        return n
    return 0.0


def normalize_transaction_type(value: Any) -> str:
    text = str(value or "").strip().lower()
    if not text:
        return ""
    if text in {"p", "purchase", "buy"} or "purchase" in text or "buy" in text:
        return "Purchase"
    if text in {"s", "sale", "sell"} or "sale" in text or "sell" in text:
        return "Sale"
    if "exchange" in text:
        return "Exchange"
    return str(value).strip()


def normalize_ticker(row: dict[str, Any]) -> str:
    for key in ("ticker", "symbol", "asset_ticker"):
        value = str(row.get(key) or "").strip().upper()
        if value:
            return value.replace("/", ".")
    asset = " ".join(str(row.get(k) or "") for k in ("asset", "asset_description", "description"))
    match = TICKER_RE.search(asset)
    if match:
        return (match.group(1) or match.group(2)).upper().replace("/", ".")
    return ""


def read_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        if isinstance(data, dict):
            rows: list[dict[str, Any]] = []
            for ticker, value in data.items():
                if isinstance(value, list):
                    for row in value:
                        if isinstance(row, dict):
                            rows.append({"ticker": ticker, **row})
                elif isinstance(value, dict):
                    for row in value.get("trades", []):
                        if isinstance(row, dict):
                            rows.append({"ticker": ticker, **row})
            return rows
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
        return []

    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def normalize_row(row: dict[str, Any]) -> dict[str, Any] | None:
    ticker = normalize_ticker(row)
    if not ticker:
        return None
    trade_type = normalize_transaction_type(
        row.get("transaction_type")
        or row.get("type")
        or row.get("transaction")
    )
    if trade_type not in {"Purchase", "Sale"}:
        return None

    amount = parse_amount_midpoint(
        row.get("amount_midpoint")
        or row.get("amount_range")
        or row.get("amount")
        or row.get("value")
    )
    trade_date = parse_date(row.get("trade_date") or row.get("transaction_date") or row.get("date"))
    disclosure_date = parse_date(row.get("disclosure_date") or row.get("filing_date") or row.get("filed_date"))

    return {
        "ticker": ticker,
        "member": row.get("member") or row.get("name") or row.get("filer") or "",
        "chamber": row.get("chamber") or row.get("source_chamber") or "",
        "transaction_type": trade_type,
        "amount_midpoint": amount,
        "trade_date": trade_date,
        "disclosure_date": disclosure_date,
        "asset": row.get("asset") or row.get("asset_description") or row.get("description") or "",
        "source_url": row.get("source_url") or row.get("url") or "",
        "source": row.get("source") or "public_disclosure_extract",
    }


def within_days(iso_date: str | None, days: int) -> bool:
    if not iso_date:
        return True
    try:
        return datetime.fromisoformat(iso_date).date() >= date.today() - timedelta(days=days)
    except ValueError:
        return True


def aggregate(rows: list[dict[str, Any]], lookback_days: int) -> dict[str, Any]:
    by_ticker: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        norm = normalize_row(row)
        if not norm or not within_days(norm.get("trade_date"), lookback_days):
            continue
        by_ticker[norm["ticker"]].append(norm)

    output: dict[str, Any] = {}
    for ticker, trades in sorted(by_ticker.items()):
        buys = [t for t in trades if t["transaction_type"] == "Purchase"]
        sells = [t for t in trades if t["transaction_type"] == "Sale"]
        net = sum(t["amount_midpoint"] for t in buys) - sum(t["amount_midpoint"] for t in sells)
        members: list[str] = []
        for trade in trades:
            member = trade.get("member")
            if member and member not in members:
                members.append(member)

        latest_trade = max((t.get("trade_date") or "" for t in trades), default=None) or None
        latest_disclosure = max((t.get("disclosure_date") or "" for t in trades), default=None) or None
        signal = None
        if len(buys) >= 3 and len(members) >= 2 and net >= 100_000:
            signal = "Government Cluster Buy"
        elif len(buys) > len(sells) and net >= 25_000:
            signal = "Government Buying"
        elif len(sells) > len(buys) and net <= -25_000:
            signal = "Government Selling"

        output[ticker] = {
            "gov_trade_buy_count_90d": len(buys),
            "gov_trade_sell_count_90d": len(sells),
            "gov_trade_net_amount_90d": round(net, 2),
            "gov_trade_latest_trade_date": latest_trade,
            "gov_trade_latest_disclosure_date": latest_disclosure,
            "gov_trade_members": members[:6],
            "gov_trade_signal": signal,
            "source": "official_public_disclosure_extract",
            "trades": trades[:25],
        }
    return output


def download_house_metadata(year: int, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    zip_path = out_dir / f"house_{year}_FD.ZIP"
    xml_path = out_dir / f"house_{year}_FD.xml"
    url = HOUSE_BULK_URL.format(year=year)
    print(f"[gov-trades] downloading {url}")
    urllib.request.urlretrieve(url, zip_path)
    with zipfile.ZipFile(zip_path) as zf:
        xml_names = [name for name in zf.namelist() if name.lower().endswith(".xml")]
        if not xml_names:
            raise SystemExit(f"No XML found in {zip_path}")
        xml_path.write_bytes(zf.read(xml_names[0]))
    return xml_path


def write_house_ptr_review_csv(xml_path: Path, out_path: Path) -> int:
    tree = ET.parse(xml_path)
    root = tree.getroot()
    rows: list[dict[str, str]] = []
    for member in root.iter():
        data = {child.tag: (child.text or "").strip() for child in list(member)}
        if not data:
            continue
        filing_type = " ".join(data.get(k, "") for k in ("FilingType", "DocType", "DocumentType", "ReportType")).lower()
        doc_id = data.get("DocID") or data.get("DocumentID") or data.get("FilingID") or data.get("ID")
        year = data.get("Year") or xml_path.stem.split("_")[1]
        if doc_id and ("periodic" in filing_type or "ptr" in filing_type):
            rows.append({
                "member": data.get("Name") or data.get("Member") or data.get("FilerName") or "",
                "filing_type": filing_type,
                "filing_date": data.get("FilingDate") or data.get("Date") or "",
                "doc_id": doc_id,
                "source_url": f"https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/{year}/{doc_id}.pdf",
            })

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["member", "filing_type", "filing_date", "doc_id", "source_url"])
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Normalize public government trade disclosure rows.")
    parser.add_argument("--input", action="append", default=[], help="CSV/JSON transaction row file. Can be repeated.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Ticker-keyed JSON output path.")
    parser.add_argument("--lookback-days", type=int, default=90, help="Transaction lookback window.")
    parser.add_argument("--download-house-metadata", type=int, default=None, metavar="YEAR", help="Download House FD bulk metadata ZIP for YEAR.")
    parser.add_argument("--house-review-csv", default=None, help="Write discovered House PTR PDF list to this CSV.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.download_house_metadata:
        xml_path = download_house_metadata(args.download_house_metadata, DEFAULT_REVIEW_DIR)
        review_csv = Path(args.house_review_csv) if args.house_review_csv else DEFAULT_REVIEW_DIR / f"house_{args.download_house_metadata}_ptr_review.csv"
        count = write_house_ptr_review_csv(xml_path, review_csv)
        print(f"[gov-trades] wrote {count} House PTR metadata rows -> {review_csv}")
        if not args.input:
            return

    rows: list[dict[str, Any]] = []
    for raw_path in args.input:
        path = Path(raw_path).expanduser().resolve()
        rows.extend(read_rows(path))

    output = aggregate(rows, args.lookback_days)
    out_path = Path(args.output).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"[gov-trades] wrote {len(output)} tickers -> {out_path}")


if __name__ == "__main__":
    sys.exit(main())
