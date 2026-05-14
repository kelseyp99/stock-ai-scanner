from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Body, Query, Header
from fastapi.responses import JSONResponse
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, os, pathlib, secrets, subprocess, sys
from ..services.scanner import scan_ticker
from ..services.ai_summary_service import generate_scan_summary
from ..services.options_chain_service import get_options_chain
from ..services.options_strategy_service import suggest_strategies
from ..services.probability_service import prob_above_strike, prob_below_strike, prob_between, expected_move
from ..services.options_ai_summary_service import generate_options_summary
from ..database.session import get_db
from sqlalchemy.orm import Session
from .. import models
from ..schemas import schemas
from ..services.ticker_service import seed_default_tickers, get_tickers
from ..services.index_universe_service import UNIVERSES, get_universe_tickers
from ..services.news_service import get_news_for_ticker, get_news_for_tickers
from ..services import ai_provider_service
from . import scheduler as scheduler_router

router = APIRouter()

# register scheduler routes under /scheduler
router.include_router(scheduler_router.router)

# All possible signal categories for grouped output
ALL_CATEGORIES = [
    'Momentum', 'Dividend', 'Oversold', 'Breakout Volume',
    'High Volatility', 'Extreme Volatility', 'Pullback Risk', 'Weak Trend',
    'Speculative / High Risk', 'Market Leader', 'Market Laggard',
    'Bullish Crossover Setup', 'Bearish Crossover Risk', 'MA Converging',
]


def _scan_parallel(tickers: list, debug: bool = False, max_workers: int = 10) -> list:
    """Scan tickers in parallel using a thread pool."""
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(scan_ticker, t, 120, debug): t for t in tickers}
        for future in as_completed(futures):
            r = future.result()
            if r:
                results.append(r)
    return results


def _sort_results(results: list) -> list:
    """Sort by score desc, then volume_ratio desc, then volatility desc."""
    return sorted(
        results,
        key=lambda r: (
            -(r.get('score') or 0),
            -(r.get('volume_ratio') or 0),
            -(r.get('volatility') or 0),
        )
    )


def _group_by_category(results: list, limit_per_category: int = 5) -> dict:
    """Group results into category buckets, top N by score each."""
    by_cat = {}
    for cat in ALL_CATEGORIES:
        members = [r for r in results if cat in (r.get('categories') or [])]
        by_cat[cat] = _sort_results(members)[:limit_per_category]
    return by_cat

@router.get('/scan', response_model=List[schemas.ScanResultOut])
def scan_all(sample: int = 50, db: Session = Depends(get_db)):
    tickers = get_tickers(db, limit=sample)
    if not tickers:
        seed_default_tickers(db)
        tickers = get_tickers(db, limit=sample)
    results = _sort_results(_scan_parallel(tickers))[:15]
    return results


@router.get('/scan/grouped')
def scan_grouped(sample: int = 50, db: Session = Depends(get_db)):
    """
    Return top_ranked (top 15 by score) plus results grouped by signal category.
    Also includes an AI-ready plain-English summary.
    """
    tickers = get_tickers(db, limit=sample)
    if not tickers:
        seed_default_tickers(db)
        tickers = get_tickers(db, limit=sample)
    all_results = _sort_results(_scan_parallel(tickers))
    top_ranked = all_results[:15]
    return JSONResponse(content={
        'top_ranked':   top_ranked,
        'by_category':  _group_by_category(all_results),
        'summary':      generate_scan_summary(top_ranked),
        'total_scanned': len(all_results),
    })

_RESULTS_JSON = pathlib.Path(__file__).parents[3] / 'scan_results_latest.json'
_PROJECT_ROOT = pathlib.Path(__file__).parents[3]
_STATIC_DEPLOY_LOG = _PROJECT_ROOT / 'static_deploy_latest.log'


def _deploy_static_snapshot() -> None:
    """Build and deploy the static Firebase snapshot after remote scan ingest."""
    cmd = [sys.executable, 'scripts/deploy_static_firebase.py']
    with _STATIC_DEPLOY_LOG.open('a') as log:
        log.write('\n' + '=' * 72 + '\n')
        log.write('Starting static deploy from /scan/ingest\n')
        log.write('Command: ' + ' '.join(cmd) + '\n')
        log.flush()
        subprocess.run(
            cmd,
            cwd=str(_PROJECT_ROOT),
            stdout=log,
            stderr=log,
            check=False,
        )

@router.get('/scan/latest')
def scan_latest():
    """Serve the most recent scan_results_latest.json written by run_scan_now.py."""
    if not _RESULTS_JSON.exists():
        raise HTTPException(status_code=404, detail='No scan results yet. Run the scanner first.')
    with open(_RESULTS_JSON) as f:
        data = json.load(f)
    # Normalise key names: run_scan_now.py uses 'global_top', API uses 'top_ranked'
    if 'global_top' in data and 'top_ranked' not in data:
        data['top_ranked'] = data['global_top']
    if 'by_universe' in data and 'by_category' not in data:
        # Flatten universe results into a category dict keyed by universe name
        data['by_category'] = {k: v.get('results', v) for k, v in data['by_universe'].items()}
    data.setdefault('top_ranked', [])
    data.setdefault('by_category', {})
    data.setdefault('summary', data.get('ai_summary', ''))
    data.setdefault('total_scanned', data.get('total_hits', 0))
    # Deduplicate top_ranked by ticker (same ticker may appear in multiple universes)
    seen: set = set()
    deduped = []
    for item in data['top_ranked']:
        t = item.get('ticker')
        if t not in seen:
            seen.add(t)
            deduped.append(item)
    data['top_ranked'] = deduped
    return JSONResponse(content=data)


# ── Ingest endpoint: Hetzner worker POSTs results here ──────────────────────
_INGEST_TOKEN = os.environ.get('SCAN_INGEST_TOKEN', 'changeme-set-SCAN_INGEST_TOKEN')

@router.post('/scan/ingest')
def scan_ingest(
    background_tasks: BackgroundTasks,
    payload: dict = Body(...),
    authorization: Optional[str] = Header(None),
    deploy_static: bool = Query(False),
):
    """
    Accept scan results POSTed from a remote worker (e.g. Hetzner VM).
    Requires Bearer token in Authorization header matching SCAN_INGEST_TOKEN env var.

    Body: same shape as scan_results_latest.json
    """
    # Token auth
    expected = f'Bearer {_INGEST_TOKEN}'
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail='Invalid or missing bearer token')

    # Validate minimal shape
    if not isinstance(payload, dict) or 'global_top' not in payload:
        raise HTTPException(status_code=422, detail='Payload must include global_top list')

    # Persist — overwrite latest results file
    OUTPUT_FILE = pathlib.Path(__file__).parents[3] / 'scan_results_latest.json'
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2, default=str))

    static_deploy_queued = False
    if deploy_static:
        background_tasks.add_task(_deploy_static_snapshot)
        static_deploy_queued = True

    top_count = len(payload.get('global_top') or [])
    universes = payload.get('universes_scanned') or []
    return JSONResponse(content={
        'status': 'ok',
        'top_count': top_count,
        'universes': universes,
        'saved_to': str(OUTPUT_FILE),
        'static_deploy_queued': static_deploy_queued,
        'static_deploy_log': str(_STATIC_DEPLOY_LOG) if static_deploy_queued else None,
    })


@router.get('/news/{ticker}')
def news_for_ticker(ticker: str, max: int = 6, db: Session = Depends(get_db)):
    """Fetch recent news headlines for a single ticker via yfinance (cached in DB)."""
    articles = get_news_for_ticker(ticker.upper(), max_articles=max, db=db)
    return JSONResponse(content={'ticker': ticker.upper(), 'articles': articles})


@router.get('/scan/debug')
def scan_all_debug(sample: int = 50, db: Session = Depends(get_db)):
    """Return raw diagnostic scan results without pydantic response_model validation."""
    tickers = get_tickers(db, limit=sample)
    if not tickers:
        seed_default_tickers(db)
        tickers = get_tickers(db, limit=sample)

    results = _scan_parallel(tickers, debug=True)
    return JSONResponse(content=results)

@router.get('/scan/ticker/{ticker}', response_model=schemas.ScanResultOut)
def scan_one(ticker: str):
    r = scan_ticker(ticker)
    if not r:
        raise HTTPException(status_code=404, detail='Ticker not found or no data')
    return r

@router.post('/watchlist')
def add_watchlist(item: schemas.WatchlistItem, db: Session = Depends(get_db)):
    obj = models.UserWatchlist(user_id=item.user_id, ticker=item.ticker)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return {"status": "ok", "id": obj.id}

@router.get('/watchlist')
def get_watchlist(user_id: str = None, db: Session = Depends(get_db)):
    q = db.query(models.UserWatchlist)
    if user_id:
        q = q.filter(models.UserWatchlist.user_id == user_id)
    return q.all()

@router.get('/history/{ticker}', response_model=List[schemas.ScanResultOut])
def history(ticker: str, limit: int = 50, db: Session = Depends(get_db)):
    q = db.query(models.ScanResult).filter(models.ScanResult.ticker == ticker).order_by(models.ScanResult.id.desc()).limit(limit)
    return q.all()

@router.post('/seed')
def seed(db: Session = Depends(get_db)):
    created = seed_default_tickers(db)
    return {"created": created}

@router.get('/scan/raw')
def scan_all_raw(sample: int = 50, db: Session = Depends(get_db)):
    """Return raw diagnostic scan results without pydantic response_model validation."""
    tickers = get_tickers(db, limit=sample)
    if not tickers:
        seed_default_tickers(db)
        tickers = get_tickers(db, limit=sample)

    results = _scan_parallel(tickers, debug=True)
    return JSONResponse(content=results)

@router.get('/options/{ticker}')
def options_chain(ticker: str):
    return get_options_chain(ticker)


@router.get('/options/{ticker}/strategies')
def options_strategies(ticker: str):
    chain = get_options_chain(ticker, max_expirations=3)
    strategies = suggest_strategies(chain)
    return {'ticker': ticker, 'strategies': strategies}


@router.get('/options/{ticker}/probabilities')
def options_probabilities(ticker: str, strike: float = Query(None), low: float = Query(None), high: float = Query(None)):
    chain = get_options_chain(ticker, max_expirations=1)
    price = chain.get('current_price')
    # take first expiration's ATM IV
    exp = chain.get('expirations')[0] if chain.get('expirations') else None
    iv = None
    days = 7
    if exp:
        calls = chain['chains'][exp]['calls']
        if calls:
            atm = sorted(calls, key=lambda c: abs(c.get('strike') - price))[0]
            iv = atm.get('impliedVolatility')
        # compute days to exp
        try:
            from datetime import datetime
            days = max((datetime.fromisoformat(exp) - datetime.utcnow()).days, 1)
        except Exception:
            days = 7
    if strike is not None:
        return {'strike': strike, 'prob_above': prob_above_strike(price, strike, iv, days), 'prob_below': prob_below_strike(price, strike, iv, days)}
    if low is not None and high is not None:
        return {'low': low, 'high': high, 'prob_between': prob_between(price, low, high, iv, days)}
    return {'error': 'provide strike or low+high'}


@router.post('/options/analyze')
def options_analyze(payload: dict = Body(...)):
    ticker = payload.get('ticker')
    model = payload.get('model')
    provider = payload.get('provider', 'openrouter')
    chain = get_options_chain(ticker, max_expirations=3)
    strategies = suggest_strategies(chain)
    ai = generate_options_summary(ticker, chain, strategies, model=model, provider=provider)
    return {'ticker': ticker, 'strategies': strategies, 'ai_summary': ai}
