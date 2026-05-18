#!/usr/bin/env python3
"""
Fetch recent SEC Form 13F-HR information tables and build scanner signals.

SEC 13F data is delayed and filed by managers. Information tables usually
contain CUSIPs, not tickers, so a CUSIP-to-ticker map is required for useful
scanner output.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ingest_13f_filings import aggregate, load_cusip_map, read_info_table_xml


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DEFAULT_MANAGER_FILE = DATA_DIR / "sec_13f_managers.csv"
DEFAULT_CUSIP_MAP = DATA_DIR / "cusip_ticker_map.csv"
DEFAULT_DOWNLOAD_DIR = DATA_DIR / "sec_13f_filings"
DEFAULT_OUTPUT = DATA_DIR / "institutional_ownership_changes.json"

SEC_BASE = "https://www.sec.gov"
SUBMISSIONS_URL = "https://data.sec.gov/submissions/CIK{cik}.json"


@dataclass
class Manager:
    cik: str
    name: str


def normalize_cik(value: Any) -> str:
    text = "".join(ch for ch in str(value or "") if ch.isdigit())
    if not text:
        return ""
    return text.zfill(10)


def load_managers(path: Path) -> list[Manager]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as f:
        rows = csv.DictReader(f)
        managers: list[Manager] = []
        for row in rows:
            cik = normalize_cik(row.get("cik") or row.get("CIK"))
            name = str(row.get("manager") or row.get("name") or row.get("filer") or cik).strip()
            if cik:
                managers.append(Manager(cik=cik, name=name))
        return managers


def sec_user_agent() -> str:
    configured = os.environ.get("SEC_USER_AGENT", "").strip()
    if configured:
        return configured
    return "ThetaBrew stock scanner contact=werkhardor@gmail.com"


def fetch_json(url: str, user_agent: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": user_agent, "Accept-Encoding": "identity"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_file(url: str, dest: Path, user_agent: str, retries: int = 2) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return True
    req = urllib.request.Request(url, headers={"User-Agent": user_agent, "Accept-Encoding": "identity"})
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                dest.write_bytes(resp.read())
            return True
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return False
            if attempt >= retries:
                raise
        except Exception:
            if attempt >= retries:
                raise
        time.sleep(1.0 + attempt)
    return False


def recent_13f_filings(manager: Manager, user_agent: str, max_filings: int) -> list[dict[str, Any]]:
    data = fetch_json(SUBMISSIONS_URL.format(cik=manager.cik), user_agent)
    recent = data.get("filings", {}).get("recent", {})
    forms = recent.get("form", [])
    accessions = recent.get("accessionNumber", [])
    filing_dates = recent.get("filingDate", [])
    report_dates = recent.get("reportDate", [])
    primary_docs = recent.get("primaryDocument", [])

    out: list[dict[str, Any]] = []
    for idx, form in enumerate(forms):
        if str(form).upper() not in {"13F-HR", "13F-HR/A"}:
            continue
        accession = accessions[idx]
        accession_dir = str(accession).replace("-", "")
        out.append({
            "manager": manager.name,
            "cik": manager.cik,
            "accession": accession,
            "accession_dir": accession_dir,
            "filing_date": filing_dates[idx] if idx < len(filing_dates) else "",
            "report_date": report_dates[idx] if idx < len(report_dates) else "",
            "primary_document": primary_docs[idx] if idx < len(primary_docs) else "",
        })
        if len(out) >= max_filings:
            break
    return out


def filing_index_items(cik: str, accession_dir: str, user_agent: str) -> list[dict[str, Any]]:
    cik_int = str(int(cik))
    url = f"{SEC_BASE}/Archives/edgar/data/{cik_int}/{accession_dir}/index.json"
    data = fetch_json(url, user_agent)
    return data.get("directory", {}).get("item", [])


def choose_info_table(items: list[dict[str, Any]]) -> str | None:
    xml_names = [
        str(item.get("name") or "")
        for item in items
        if str(item.get("name") or "").lower().endswith(".xml")
    ]
    preferred = [
        name for name in xml_names
        if "infotable" in name.lower() or "form13f" in name.lower() or "primary_doc" not in name.lower()
    ]
    if preferred:
        return preferred[0]
    return xml_names[0] if xml_names else None


def patch_rows_metadata(rows: list[dict[str, Any]], filing: dict[str, Any]) -> list[dict[str, Any]]:
    for row in rows:
        row["manager"] = filing["manager"]
        row["report_date"] = filing.get("report_date") or row.get("report_date") or ""
        row["filing_date"] = filing.get("filing_date") or row.get("filing_date") or ""
        row["source"] = row.get("source") or filing.get("accession")
    return rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch SEC 13F information tables and build institutional scanner JSON.")
    parser.add_argument("--manager-file", default=str(DEFAULT_MANAGER_FILE), help="CSV with cik,manager columns.")
    parser.add_argument("--cusip-map", default=str(DEFAULT_CUSIP_MAP), help="CSV/JSON CUSIP-to-ticker map.")
    parser.add_argument("--download-dir", default=str(DEFAULT_DOWNLOAD_DIR), help="Where SEC XML files are cached.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Ticker-keyed scanner JSON output.")
    parser.add_argument("--max-filings-per-manager", type=int, default=2, help="Recent 13F filings per manager to fetch. Use 2 for QoQ deltas.")
    parser.add_argument("--sleep", type=float, default=0.15, help="Pause between SEC requests.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manager_file = Path(args.manager_file).expanduser()
    cusip_map_path = Path(args.cusip_map).expanduser()
    download_dir = Path(args.download_dir).expanduser()
    output_path = Path(args.output).expanduser()

    managers = load_managers(manager_file)
    if not managers:
        print(f"[13f-fetch] no manager file found or no CIKs configured: {manager_file}")
        print("[13f-fetch] create data/sec_13f_managers.csv with columns: cik,manager")
        return 0

    cusip_map = load_cusip_map(str(cusip_map_path))
    if not cusip_map:
        print(f"[13f-fetch] no CUSIP map found: {cusip_map_path}")
        print("[13f-fetch] SEC 13F tables generally do not include ticker symbols; skipping output.")
        return 0

    user_agent = sec_user_agent()
    rows: list[dict[str, Any]] = []
    fetched = 0
    parsed = 0

    for manager in managers:
        try:
            filings = recent_13f_filings(manager, user_agent, args.max_filings_per_manager)
        except Exception as exc:
            print(f"[13f-fetch] failed submissions for {manager.name} ({manager.cik}): {exc}")
            continue
        time.sleep(args.sleep)

        for filing in filings:
            try:
                items = filing_index_items(filing["cik"], filing["accession_dir"], user_agent)
                xml_name = choose_info_table(items)
                if not xml_name:
                    print(f"[13f-fetch] no XML info table for {manager.name} {filing['accession']}")
                    continue
                cik_int = str(int(filing["cik"]))
                url = f"{SEC_BASE}/Archives/edgar/data/{cik_int}/{filing['accession_dir']}/{xml_name}"
                dest = download_dir / filing["cik"] / filing["accession_dir"] / xml_name
                if download_file(url, dest, user_agent):
                    fetched += 1
                    parsed_rows = read_info_table_xml(dest, cusip_map, manager.name)
                    rows.extend(patch_rows_metadata(parsed_rows, filing))
                    parsed += len(parsed_rows)
                    print(f"[13f-fetch] {manager.name}: parsed {len(parsed_rows)} rows from {filing['accession']}")
                time.sleep(args.sleep)
            except Exception as exc:
                print(f"[13f-fetch] failed {manager.name} {filing.get('accession')}: {exc}")

    if not rows:
        print("[13f-fetch] no mapped 13F rows parsed; existing institutional file was not modified")
        return 0

    output = aggregate(rows)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"[13f-fetch] fetched {fetched} XML files, parsed {parsed} rows, wrote {len(output)} tickers -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
