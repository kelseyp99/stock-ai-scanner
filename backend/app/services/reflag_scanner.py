"""Daily re-scan of previously notable scanner candidates."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
import yfinance as yf
from sqlalchemy.orm import Session

from ..indicators.indicators import compute_rsi, calculate_atr
from ..models import models
from .alert_engine import build_alerts
from .exhaustion_scanner import score_bearish_exhaustion
from .fib_engine import analyze_fibonacci
from .reversal_scanner import score_bullish_reversal
from .scanner import calculate_volume_ratio, normalize_ticker


ROOT = Path(__file__).resolve().parents[3]
LATEST_REFLAG_JSON = ROOT / "reflag_results_latest.json"


def _clean_ohlcv(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or df.empty:
        return pd.DataFrame()
    out = df.copy()
    if isinstance(out.columns, pd.MultiIndex):
        out.columns = [c[0] for c in out.columns]
    return out.dropna(subset=["Open", "High", "Low", "Close"], how="any")


def _last_float(series: pd.Series | None) -> float | None:
    try:
        if series is None or series.empty:
            return None
        value = series.dropna().iloc[-1]
        return float(value)
    except Exception:
        return None


def _download_ohlcv(ticker: str, period: str = "1y") -> pd.DataFrame:
    return _clean_ohlcv(yf.download(ticker, period=period, progress=False, auto_adjust=True))


def _asset_symbol(ticker: str, asset_type: str | None) -> str:
    symbol = normalize_ticker(ticker)
    if (asset_type or "").lower() == "crypto" and not symbol.endswith("-USD"):
        return f"{symbol}-USD"
    return symbol


def _candidate_key(row: dict[str, Any]) -> str:
    return str(row.get("ticker") or row.get("symbol") or "").upper()


def candidates_from_latest_json(paths: list[Path]) -> list[dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for path in paths:
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text())
        except Exception:
            continue
        rows = payload.get("global_top") or payload.get("top_ranked") or payload.get("all_etfs") or []
        asset_type = "ETF" if "etf" in path.name else ("crypto" if "crypto" in path.name else "stock")
        for row in rows:
            ticker = _candidate_key(row)
            if not ticker:
                continue
            item = dict(row)
            item["ticker"] = ticker
            item.setdefault("asset_type", asset_type)
            out.setdefault(ticker, item)
    return list(out.values())


def candidates_from_db(db: Session, limit: int = 500) -> list[dict[str, Any]]:
    rows = (
        db.query(models.ScannerCandidateHistory)
        .order_by(models.ScannerCandidateHistory.date_flagged.desc())
        .limit(limit)
        .all()
    )
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for row in rows:
        ticker = row.ticker.upper()
        if ticker in seen:
            continue
        seen.add(ticker)
        out.append({
            "ticker": ticker,
            "asset_type": row.asset_type or "stock",
            "price_when_flagged": row.price_when_flagged,
            "scanner_category": row.scanner_category,
            "sector": row.sector,
            "date_flagged": row.date_flagged.isoformat() if row.date_flagged else None,
        })
    return out


def save_candidates_to_history(db: Session, rows: list[dict[str, Any]], source: str = "scanner") -> int:
    count = 0
    for row in rows:
        ticker = _candidate_key(row)
        if not ticker:
            continue
        categories = row.get("categories") or []
        item = models.ScannerCandidateHistory(
            ticker=ticker,
            price_when_flagged=row.get("price"),
            rsi=row.get("rsi"),
            volume_ratio=row.get("volume_ratio"),
            atr=row.get("atr_pct") or row.get("atr"),
            trend_score=row.get("score"),
            scanner_category=", ".join(categories[:4]) if isinstance(categories, list) else str(categories),
            sector=row.get("sector") or row.get("etf_theme"),
            asset_type=row.get("asset_type") or ("ETF" if row.get("etf_name") else "stock"),
            source=source,
        )
        db.add(item)
        count += 1
    db.commit()
    return count


def evaluate_candidate(candidate: dict[str, Any]) -> dict[str, Any] | None:
    ticker = _candidate_key(candidate)
    if not ticker:
        return None
    asset_type = candidate.get("asset_type") or "stock"
    symbol = _asset_symbol(ticker, asset_type)
    ohlcv = _download_ohlcv(symbol)
    if ohlcv.empty or len(ohlcv) < 40:
        return None

    close = ohlcv["Close"]
    high = ohlcv["High"]
    low = ohlcv["Low"]
    volume = ohlcv["Volume"] if "Volume" in ohlcv else pd.Series(dtype=float)
    price = _last_float(close)
    rsi = _last_float(compute_rsi(close))
    volume_ratio = calculate_volume_ratio(volume)
    atr = _last_float(calculate_atr(high, low, close))
    atr_pct = round((atr / price) * 100, 2) if atr and price else None
    ma20 = _last_float(close.rolling(20).mean())
    ma50 = _last_float(close.rolling(50).mean())
    trend_direction = "up" if ma20 and ma50 and ma20 > ma50 else ("down" if ma20 and ma50 and ma20 < ma50 else "flat")

    fib = analyze_fibonacci(ohlcv, price)
    reversal = score_bullish_reversal(ohlcv, rsi, volume_ratio, bool(fib.hit_level or fib.in_retracement_zone))
    exhaustion = score_bearish_exhaustion(ohlcv, rsi, volume_ratio)

    categories: list[str] = []
    if reversal.score >= 6 and (fib.hit_level or fib.in_retracement_zone):
        categories.append("Re-Flagged Opportunities")
    if fib.hit_level or fib.in_retracement_zone:
        categories.append("Fibonacci Pullback Watch")
    if rsi is not None and rsi < 35 and reversal.score >= 4:
        categories.append("Oversold Reversal Candidates")
    if rsi is not None and rsi > 70:
        categories.append("Overbought / Exhaustion Watch")
    if candidate.get("score", 0) >= 8 or "Momentum" in (candidate.get("categories") or []):
        categories.append("Current Momentum Leaders")

    row = {
        "ticker": ticker,
        "asset_type": asset_type,
        "price": round(price, 4) if price is not None else None,
        "price_when_flagged": candidate.get("price_when_flagged") or candidate.get("price"),
        "date_flagged": candidate.get("date_flagged"),
        "rsi": round(rsi, 2) if rsi is not None else None,
        "volume_ratio": volume_ratio,
        "atr": round(atr, 4) if atr is not None else None,
        "atr_pct": atr_pct,
        "ma20": round(ma20, 4) if ma20 is not None else None,
        "ma50": round(ma50, 4) if ma50 is not None else None,
        "trend_direction": trend_direction,
        "scanner_category": candidate.get("scanner_category") or ", ".join(candidate.get("categories") or []),
        "sector": candidate.get("sector") or candidate.get("etf_theme"),
        "fib": fib.to_dict(),
        "fib_levels": fib.levels,
        "fib_hit_level": fib.hit_level,
        "fib_hit_price": fib.hit_price,
        "in_retracement_zone": fib.in_retracement_zone,
        "reversal_score": reversal.score,
        "reversal_labels": reversal.labels,
        "reversal_patterns": reversal.patterns,
        "reversal_reasons": reversal.reasons,
        "exhaustion_score": exhaustion.score,
        "exhaustion_labels": exhaustion.labels,
        "exhaustion_patterns": exhaustion.patterns,
        "exhaustion_reasons": exhaustion.reasons,
        "categories": categories,
    }
    row["alerts"] = [alert.to_dict() for alert in build_alerts(row)]
    return row


def build_sections(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    sections = {
        "Current Momentum Leaders": [],
        "Overbought / Exhaustion Watch": [],
        "Fibonacci Pullback Watch": [],
        "Re-Flagged Opportunities": [],
        "Oversold Reversal Candidates": [],
    }
    for row in rows:
        for category in row.get("categories") or []:
            if category in sections:
                sections[category].append(row)
    sections["Re-Flagged Opportunities"].sort(key=lambda r: (-(r.get("reversal_score") or 0), -(r.get("volume_ratio") or 0)))
    sections["Overbought / Exhaustion Watch"].sort(key=lambda r: -(r.get("exhaustion_score") or 0))
    sections["Fibonacci Pullback Watch"].sort(key=lambda r: -(r.get("reversal_score") or 0))
    sections["Oversold Reversal Candidates"].sort(key=lambda r: -(r.get("reversal_score") or 0))
    return {k: v[:30] for k, v in sections.items()}


def persist_reflag_results(db: Session, rows: list[dict[str, Any]]) -> None:
    for row in rows:
        fib = row.get("fib") or {}
        levels = row.get("fib_levels") or {}
        db.add(models.FibRetracementLevel(
            ticker=row["ticker"],
            swing_low=fib.get("swing_low"),
            swing_high=fib.get("swing_high"),
            fib_382=levels.get("38.2"),
            fib_500=levels.get("50.0"),
            fib_618=levels.get("61.8"),
            hit_level=row.get("fib_hit_level"),
            asset_type=row.get("asset_type"),
        ))
        for alert in row.get("alerts") or []:
            db.add(models.TechnicalAlert(
                ticker=alert["ticker"],
                alert_type=alert["alert_type"],
                severity=alert["severity"],
                message=alert["message"],
                payload=json.dumps(alert.get("payload") or {}),
            ))
    db.commit()


def run_reflag_scan(
    candidates: list[dict[str, Any]],
    db: Session | None = None,
    output_path: Path = LATEST_REFLAG_JSON,
    limit: int = 250,
) -> dict[str, Any]:
    started = datetime.now(timezone.utc).isoformat()
    rows: list[dict[str, Any]] = []
    for candidate in candidates[:limit]:
        try:
            result = evaluate_candidate(candidate)
        except Exception:
            result = None
        if result:
            rows.append(result)

    rows.sort(key=lambda r: (-(r.get("reversal_score") or 0), -(r.get("exhaustion_score") or 0), r.get("ticker") or ""))
    payload = {
        "scan_started_at": started,
        "scan_finished_at": datetime.now(timezone.utc).isoformat(),
        "total_scanned": len(candidates[:limit]),
        "total_hits": len(rows),
        "top_ranked": rows[:50],
        "sections": build_sections(rows),
        "alerts": [alert for row in rows for alert in (row.get("alerts") or [])][:100],
        "summary": build_summary(rows),
    }
    output_path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
    if db is not None:
        persist_reflag_results(db, rows)
    return payload


def build_summary(rows: list[dict[str, Any]]) -> str:
    if not rows:
        return "No re-flagged opportunities were detected."
    reflags = [r["ticker"] for r in rows if "Re-Flagged Opportunities" in (r.get("categories") or [])][:5]
    fibs = [r["ticker"] for r in rows if r.get("fib_hit_level")][:5]
    exhaustion = [r["ticker"] for r in rows if r.get("exhaustion_score", 0) >= 5][:5]
    parts = []
    if reflags:
        parts.append("Re-flagged pullback setups: " + ", ".join(reflags))
    if fibs:
        parts.append("Fib levels hit: " + ", ".join(fibs))
    if exhaustion:
        parts.append("Exhaustion watch: " + ", ".join(exhaustion))
    return ". ".join(parts) + "."
