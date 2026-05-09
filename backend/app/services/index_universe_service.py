"""
index_universe_service.py

Provides get_universe_tickers(universe_id) for all supported scan universes.

Sources:
  - sp500, sp100, dow30, nasdaq100: Wikipedia tables via pandas.read_html
  - russell1000/2000/3000:          local CSV in backend/data/indexes/
  - custom:                         user watchlist from MySQL

Results are cached in memory (TTL = 6 hours) to avoid hammering Wikipedia.
Constituents are also persisted to MySQL for history / offline use.
"""

import time
import os
import logging
import pandas as pd
from pathlib import Path
from sqlalchemy.orm import Session
from datetime import datetime

logger = logging.getLogger(__name__)

# ── In-memory cache ───────────────────────────────────────────────────────────
_cache: dict[str, dict] = {}
_CACHE_TTL = 6 * 3600  # 6 hours

# Path to local CSV files
_DATA_DIR = Path(__file__).parent.parent.parent / 'data' / 'indexes'

# ── Universe registry ─────────────────────────────────────────────────────────
UNIVERSES = [
    {'id': 'sp500',       'name': 'S&P 500'},
    {'id': 'sp100',       'name': 'S&P 100'},
    {'id': 'dow30',       'name': 'Dow Jones Industrial Average'},
    {'id': 'nasdaq100',   'name': 'Nasdaq 100'},
    {'id': 'russell1000', 'name': 'Russell 1000'},
    {'id': 'russell2000', 'name': 'Russell 2000'},
    {'id': 'russell3000', 'name': 'Russell 3000'},
    {'id': 'custom',      'name': 'Custom Watchlist'},
]
UNIVERSE_IDS = {u['id'] for u in UNIVERSES}


def _clean_ticker(t: str) -> str:
    """Normalize tickers: strip whitespace, replace dots with dashes (BRK.B → BRK-B)."""
    return t.strip().replace('.', '-').upper()


def _from_cache(universe_id: str) -> list[str] | None:
    entry = _cache.get(universe_id)
    if entry and (time.time() - entry['ts']) < _CACHE_TTL:
        return entry['tickers']
    return None


def _to_cache(universe_id: str, tickers: list[str]) -> None:
    _cache[universe_id] = {'tickers': tickers, 'ts': time.time()}


# ── Wikipedia fetchers ────────────────────────────────────────────────────────

def _fetch_sp500() -> list[dict]:
    url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    tables = pd.read_html(url, header=0)
    df = tables[0]
    records = []
    for _, row in df.iterrows():
        ticker = _clean_ticker(str(row.get('Symbol', row.get('Ticker symbol', ''))))
        name = str(row.get('Security', row.get('Company', '')))
        sector = str(row.get('GICS Sector', ''))
        if ticker:
            records.append({'ticker': ticker, 'company_name': name, 'sector': sector})
    return records


def _fetch_sp100() -> list[dict]:
    url = 'https://en.wikipedia.org/wiki/S%26P_100'
    tables = pd.read_html(url, header=0)
    # The table with Symbol column
    for df in tables:
        cols = [c.lower() for c in df.columns]
        if 'symbol' in cols or 'ticker' in cols:
            tcol = next(c for c in df.columns if c.lower() in ('symbol', 'ticker'))
            ncol = next((c for c in df.columns if c.lower() in ('name', 'company', 'security')), None)
            records = []
            for _, row in df.iterrows():
                t = _clean_ticker(str(row[tcol]))
                n = str(row[ncol]) if ncol else ''
                if t and t != 'NAN':
                    records.append({'ticker': t, 'company_name': n, 'sector': ''})
            if records:
                return records
    raise ValueError('Could not parse S&P 100 table from Wikipedia')


def _fetch_dow30() -> list[dict]:
    url = 'https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average'
    tables = pd.read_html(url, header=0)
    for df in tables:
        cols = [c.lower() for c in df.columns]
        if 'symbol' in cols or 'ticker' in cols:
            tcol = next(c for c in df.columns if c.lower() in ('symbol', 'ticker'))
            ncol = next((c for c in df.columns if c.lower() in ('company', 'name')), None)
            records = []
            for _, row in df.iterrows():
                t = _clean_ticker(str(row[tcol]))
                n = str(row[ncol]) if ncol else ''
                if t and t != 'NAN' and len(t) <= 8:
                    records.append({'ticker': t, 'company_name': n, 'sector': ''})
            if len(records) >= 25:
                return records
    raise ValueError('Could not parse Dow 30 table from Wikipedia')


def _fetch_nasdaq100() -> list[dict]:
    url = 'https://en.wikipedia.org/wiki/Nasdaq-100'
    tables = pd.read_html(url, header=0)
    for df in tables:
        cols = [c.lower() for c in df.columns]
        if 'ticker' in cols or 'symbol' in cols:
            tcol = next(c for c in df.columns if c.lower() in ('ticker', 'symbol'))
            ncol = next((c for c in df.columns if c.lower() in ('company', 'name', 'security')), None)
            scol = next((c for c in df.columns if 'sector' in c.lower() or 'industry' in c.lower()), None)
            records = []
            for _, row in df.iterrows():
                t = _clean_ticker(str(row[tcol]))
                n = str(row[ncol]) if ncol else ''
                s = str(row[scol]) if scol else ''
                if t and t != 'NAN' and len(t) <= 8:
                    records.append({'ticker': t, 'company_name': n, 'sector': s})
            if len(records) >= 90:
                return records
    raise ValueError('Could not parse Nasdaq-100 table from Wikipedia')


def _fetch_from_csv(universe_id: str) -> list[dict]:
    path = _DATA_DIR / f'{universe_id}.csv'
    if not path.exists():
        raise FileNotFoundError(
            f"Russell index file not found: {path}\n"
            f"Please download the {universe_id} constituent list and place it at {path}.\n"
            f"See backend/data/indexes/README.md for format."
        )
    df = pd.read_csv(path)
    cols = [c.lower() for c in df.columns]
    tcol = next((df.columns[i] for i, c in enumerate(cols) if c in ('ticker', 'symbol')), df.columns[0])
    ncol = next((df.columns[i] for i, c in enumerate(cols) if c in ('company_name', 'name', 'company')), None)
    scol = next((df.columns[i] for i, c in enumerate(cols) if 'sector' in c.lower()), None)
    records = []
    for _, row in df.iterrows():
        t = _clean_ticker(str(row[tcol]))
        n = str(row[ncol]) if ncol else ''
        s = str(row[scol]) if scol else ''
        if t and t != 'NAN':
            records.append({'ticker': t, 'company_name': n, 'sector': s})
    return records


_FETCHERS = {
    'sp500':       _fetch_sp500,
    'sp100':       _fetch_sp100,
    'dow30':       _fetch_dow30,
    'nasdaq100':   _fetch_nasdaq100,
    'russell1000': lambda: _fetch_from_csv('russell1000'),
    'russell2000': lambda: _fetch_from_csv('russell2000'),
    'russell3000': lambda: _fetch_from_csv('russell3000'),
}


def _persist_to_db(universe_id: str, records: list[dict], db: Session) -> None:
    """Upsert index constituents into MySQL."""
    try:
        from ..models.models import IndexUniverse, IndexConstituent
        from sqlalchemy.dialects.mysql import insert as mysql_insert

        # Upsert the universe row
        uni = db.query(IndexUniverse).filter_by(universe_id=universe_id).first()
        universe_name = next((u['name'] for u in UNIVERSES if u['id'] == universe_id), universe_id)
        if not uni:
            uni = IndexUniverse(universe_id=universe_id, name=universe_name,
                                source='wikipedia', last_updated=datetime.utcnow())
            db.add(uni)
        else:
            uni.last_updated = datetime.utcnow()

        # Delete old constituents and re-insert (simple full-refresh)
        db.query(IndexConstituent).filter_by(universe_id=universe_id).delete()
        db.bulk_save_objects([
            IndexConstituent(
                universe_id=universe_id,
                ticker=r['ticker'],
                company_name=r.get('company_name', ''),
                sector=r.get('sector', ''),
            )
            for r in records
        ])
        db.commit()
    except Exception as e:
        logger.warning('Failed to persist universe %s to DB: %s', universe_id, e)
        db.rollback()


def get_universe_tickers(universe_id: str, db: Session | None = None,
                         max_tickers: int | None = None) -> list[str]:
    """
    Return a list of ticker strings for the given universe_id.
    Raises ValueError for unknown IDs, FileNotFoundError for missing Russell CSVs.
    """
    if universe_id == 'custom':
        if db is None:
            return []
        from ..models.models import UserWatchlist
        rows = db.query(UserWatchlist.ticker).distinct().all()
        tickers = [r[0] for r in rows]
        if max_tickers:
            tickers = tickers[:max_tickers]
        return tickers

    if universe_id not in UNIVERSE_IDS:
        raise ValueError(f"Unknown universe '{universe_id}'. Valid options: {sorted(UNIVERSE_IDS)}")

    # Check memory cache
    cached = _from_cache(universe_id)
    if cached is not None:
        result = cached
        if max_tickers:
            result = result[:max_tickers]
        return result

    # Check DB cache (any constituents younger than TTL)
    if db:
        try:
            from ..models.models import IndexUniverse, IndexConstituent
            uni = db.query(IndexUniverse).filter_by(universe_id=universe_id).first()
            if uni and uni.last_updated:
                age = (datetime.utcnow() - uni.last_updated).total_seconds()
                if age < _CACHE_TTL:
                    rows = db.query(IndexConstituent.ticker).filter_by(universe_id=universe_id).all()
                    tickers = [r[0] for r in rows]
                    if tickers:
                        _to_cache(universe_id, tickers)
                        if max_tickers:
                            tickers = tickers[:max_tickers]
                        return tickers
        except Exception as e:
            logger.warning('DB cache lookup failed for %s: %s', universe_id, e)

    # Fetch fresh
    fetcher = _FETCHERS.get(universe_id)
    if not fetcher:
        raise ValueError(f"No fetcher for universe '{universe_id}'")

    records = fetcher()
    tickers = [r['ticker'] for r in records]
    _to_cache(universe_id, tickers)

    if db:
        _persist_to_db(universe_id, records, db)

    if max_tickers:
        tickers = tickers[:max_tickers]
    return tickers
