#!/usr/bin/env python3
"""
run_scan_now.py — Manually trigger the nightly scanner from the command line.

Usage:
    python scripts/run_scan_now.py                         # quick: 50/universe
    python scripts/run_scan_now.py --full                  # full: S&P 500 + Nasdaq 100 + Russell 2000 (all tickers)
    python scripts/run_scan_now.py --universes sp500 nasdaq100 russell2000 --max 50

Universes: sp500, sp100, dow30, nasdaq100, russell1000, russell2000, russell3000

Full-universe ticker counts (approximate):
  sp500       ~505
  nasdaq100   ~101
  russell2000 ~1920
  TOTAL       ~2526  (expect ~15-25 min with --workers 20)
"""

import sys
import os
import json
import argparse
import time
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed, wait, FIRST_COMPLETED
from pathlib import Path

# ── Path setup: allow imports from backend/app ────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'backend'))

from app.services.scanner import scan_ticker, assign_percentile_rank, assign_confidence
from app.services.index_universe_service import get_universe_tickers
from app.services.ai_summary_service import generate_scan_summary

# ── Logging ───────────────────────────────────────────────────────────────────
# force=True overrides any root-logger config set by yfinance on import
logging.basicConfig(
    force=True,
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s %(message)s',
    datefmt='%H:%M:%S',
)

# Silence noisy yfinance/urllib3 retry chatter (401 crumb retries etc.)
for _noisy in ('yfinance', 'peewee', 'urllib3', 'urllib3.connectionpool', 'requests'):
    logging.getLogger(_noisy).setLevel(logging.CRITICAL)
log = logging.getLogger('run_scan_now')

# ── Defaults ──────────────────────────────────────────────────────────────────
DEFAULT_UNIVERSES = ['sp500', 'nasdaq100', 'russell2000']
DEFAULT_MAX       = 50    # max tickers per universe in quick mode
FULL_MAX          = 9999  # effectively unlimited — scans every ticker in universe
OUTPUT_FILE       = ROOT / 'scan_results_latest.json'


def _post_results(url: str, payload: dict) -> None:
    """POST scan results payload to a remote ingest endpoint."""
    import urllib.request
    import urllib.error
    token = os.environ.get('SCAN_INGEST_TOKEN', 'changeme-set-SCAN_INGEST_TOKEN')
    body = json.dumps(payload, default=str).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        method='POST',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_body = resp.read().decode()
            log.info(f'[callback] POST {url} → HTTP {resp.status}  {resp_body[:200]}')
    except urllib.error.HTTPError as e:
        log.error(f'[callback] POST {url} failed HTTP {e.code}: {e.read().decode()[:200]}')
    except Exception as e:
        log.error(f'[callback] POST {url} error: {e}')


def _sort_results(results: list) -> list:
    return sorted(
        results,
        key=lambda r: (
            -(r.get('score') or 0),
            -(r.get('volume_ratio') or 0),
            -(r.get('volatility') or 0),
        )
    )


# ── Diversity-aware top-N selection ──────────────────────────────────────────
# Ensures at least BUCKET_MIN picks from each meaningful category, provided
# they clear MIN_BUCKET_SCORE, before filling remaining slots by raw score.
#
# Buckets and their detection predicates:
#   oversold      — RSI < 38 or trade_type = Mean Reversion Setup
#   squeeze       — squeeze flag or Volatility Compression category
#   breakout      — trade_type in (Breakout, Speculative Breakout, Vol Expansion)
#   dividend      — Dividend category
#   news_catalyst — news_boost >= 2 (extraordinary positive news)
#
_BUCKETS = [
    ('oversold',      lambda r: (r.get('rsi') or 99) < 38 or r.get('trade_type') == 'Mean Reversion Setup'),
    ('squeeze',       lambda r: bool(r.get('squeeze')) or '🌀 Volatility Compression' in (r.get('categories') or [])),
    ('breakout',      lambda r: r.get('trade_type') in ('Breakout Trade', 'Speculative Breakout', 'Volatility Expansion')),
    ('dividend',      lambda r: 'Dividend' in (r.get('categories') or [])),
    ('news_catalyst', lambda r: (r.get('news_boost') or 0) >= 2),
]
BUCKET_MIN       = 2   # guaranteed slots per bucket (if candidates exist above threshold)
MIN_BUCKET_SCORE = 2   # minimum composite score to qualify for a reserved slot


def _build_diverse_top(results: list, n: int = 25) -> list:
    """
    Phase 1 — fill up to BUCKET_MIN reserved slots per bucket (score >= MIN_BUCKET_SCORE).
    Phase 2 — fill remaining slots with the highest-scoring un-selected stocks.
    Phase 3 — sort the final set by score descending.
    """
    sorted_all = _sort_results(results)
    selected: dict[str, dict] = {}   # ticker → result

    # Phase 1: reserved bucket slots
    for _name, pred in _BUCKETS:
        candidates = [
            r for r in sorted_all
            if pred(r) and (r.get('score') or 0) >= MIN_BUCKET_SCORE
        ]
        added = 0
        for r in candidates:
            if added >= BUCKET_MIN:
                break
            t = r['ticker']
            if t not in selected:
                r = dict(r)           # don't mutate original
                r['diversity_slot'] = _name   # tag which bucket reserved this slot
                selected[t] = r
                added += 1

    # Phase 2: fill remaining slots by pure score
    for r in sorted_all:
        if len(selected) >= n:
            break
        t = r['ticker']
        if t not in selected:
            selected[t] = r

    # Phase 3: re-sort by score
    return _sort_results(list(selected.values()))[:n]


def scan_universe(universe_id: str, max_tickers: int, max_workers: int = 12) -> list:
    """Fetch universe tickers and scan them in parallel."""
    log.info(f'[{universe_id}] Fetching tickers…')
    tickers = get_universe_tickers(universe_id)
    if not tickers:
        log.warning(f'[{universe_id}] No tickers returned — skipping.')
        return []

    tickers = tickers[:max_tickers]
    log.info(f'[{universe_id}] Scanning {len(tickers)} tickers with {max_workers} workers…')

    results = []
    executor = ThreadPoolExecutor(max_workers=max_workers)
    try:
        futures = {executor.submit(scan_ticker, t, 120): t for t in tickers}
        done_count = 0
        pending = set(futures.keys())
        while pending:
            finished, pending = wait(pending, timeout=60, return_when=FIRST_COMPLETED)
            if not finished:
                # No future completed in 60s — all workers are stuck; bail out
                log.warning(f'[{universe_id}] No progress for 60s — abandoning {len(pending)} stuck tickers')
                break
            for future in finished:
                done_count += 1
                ticker = futures[future]
                try:
                    r = future.result(timeout=1)
                    if r:
                        r['universe'] = universe_id
                        results.append(r)
                except Exception as exc:
                    log.debug(f'[{universe_id}] {ticker} error: {exc}')
                if done_count % 25 == 0 or done_count == len(tickers):
                    log.info(f'[{universe_id}]   {done_count}/{len(tickers)} scanned, {len(results)} hits so far…')
    finally:
        # cancel_futures=True + wait=False lets us abandon stuck threads immediately
        executor.shutdown(wait=False, cancel_futures=True)

    log.info(f'[{universe_id}] Done — {len(results)} results.')
    return results


def main():
    parser = argparse.ArgumentParser(description='Run the stock AI scanner manually.')
    parser.add_argument(
        '--universes', nargs='+', default=DEFAULT_UNIVERSES,
        metavar='UNIVERSE',
        help=f'Universe IDs to scan (default: {" ".join(DEFAULT_UNIVERSES)})',
    )
    parser.add_argument(
        '--max', type=int, default=None,
        metavar='N',
        help=f'Max tickers per universe. Omit to use default ({DEFAULT_MAX}) or --full for all.',
    )
    parser.add_argument(
        '--full', action='store_true',
        help='Scan every ticker in each universe (S&P 500 + Nasdaq 100 + Russell 2000 = ~2,526 total). '
             'Expect 15-25 min. Overrides --max.',
    )
    parser.add_argument(
        '--workers', type=int, default=20,
        metavar='N',
        help='Thread-pool workers per universe (default: 20; increase for faster full runs)',
    )
    parser.add_argument(
        '--top', type=int, default=25,
        metavar='N',
        help='Top N results to include in the summary (default: 25)',
    )
    parser.add_argument(
        '--callback-url', default=None,
        metavar='URL',
        help='POST scan results to this URL when done (e.g. https://your-host/scan/ingest). '
             'Set SCAN_INGEST_TOKEN env var for Bearer auth.',
    )
    args = parser.parse_args()

    # Resolve max tickers
    if args.full:
        max_tickers = FULL_MAX
        mode = 'FULL (all tickers)'
    elif args.max is not None:
        max_tickers = args.max
        mode = f'capped at {max_tickers}/universe'
    else:
        max_tickers = DEFAULT_MAX
        mode = f'quick ({DEFAULT_MAX}/universe)'

    started_at = datetime.utcnow().isoformat() + 'Z'
    log.info('═' * 60)
    log.info(f'Stock AI Scanner — manual run  [{mode}]')
    log.info(f'Started : {started_at}')
    log.info(f'Universes: {", ".join(args.universes)}')
    log.info(f'Max/universe: {"ALL" if args.full else max_tickers}   Workers: {args.workers}   Top: {args.top}')
    log.info('═' * 60)

    # ── Pre-warm yfinance session / crumb ─────────────────────────────────────
    log.info('Pre-warming Yahoo Finance session…')
    try:
        import yfinance as yf
        yf.download('SPY', period='2d', progress=False, auto_adjust=True)
        log.info('Session ready.')
    except Exception as e:
        log.warning(f'Session pre-warm failed (will still try): {e}')

    all_results: list = []
    universe_stats: dict = {}

    for uid in args.universes:
        t0 = time.time()
        res = scan_universe(uid, max_tickers, args.workers)
        elapsed = round(time.time() - t0, 1)
        sorted_res = _sort_results(res)
        universe_stats[uid] = {
            'scanned': len(res),
            'hits': len(sorted_res),
            'elapsed_s': elapsed,
            'top': sorted_res[:args.top],
        }
        all_results.extend(sorted_res)
        log.info(f'[{uid}] Finished in {elapsed}s')

    # ── Global top across all universes ───────────────────────────────────────
    global_top = _build_diverse_top(all_results, n=args.top)

    # ── Assign percentile ranks across the full result set ───────────────────
    all_scores = [r.get('score') or 0 for r in all_results]
    for r in all_results:
        r['percentile_rank'], r['percentile_label'] = assign_percentile_rank(r.get('score') or 0, all_scores)
    # Rebuild global_top after enrichment (percentile labels now populated)
    global_top = _build_diverse_top(all_results, n=args.top)

    log.info('─' * 60)
    log.info(f'Total results across all universes: {len(all_results)}')

    # Log diversity breakdown
    bucket_counts = {}
    for r in global_top:
        slot = r.get('diversity_slot', 'open')
        bucket_counts[slot] = bucket_counts.get(slot, 0) + 1
    log.info('Diversity slots: ' + '  '.join(f'{k}={v}' for k, v in sorted(bucket_counts.items())))

    log.info(f'Generating AI summary for top {len(global_top)} stocks…')

    try:
        ai_summary = generate_scan_summary(global_top)
    except Exception as e:
        log.warning(f'AI summary failed: {e}')
        ai_summary = None

    finished_at = datetime.utcnow().isoformat() + 'Z'

    # ── Build output payload ──────────────────────────────────────────────────
    payload = {
        'scan_started_at':  started_at,
        'scan_finished_at': finished_at,
        'universes_scanned': args.universes,
        'max_per_universe':  args.max,
        'total_hits':        len(all_results),
        'global_top':        global_top,
        'by_universe':       universe_stats,
        'ai_summary':        ai_summary,
    }

    OUTPUT_FILE.write_text(json.dumps(payload, indent=2, default=str))
    log.info(f'Results saved → {OUTPUT_FILE}')

    # ── POST to callback URL if provided ─────────────────────────────────────
    if args.callback_url:
        _post_results(args.callback_url, payload)

    # ── Print top picks to console ────────────────────────────────────────────
    log.info('═' * 60)
    log.info(f'TOP {len(global_top)} PICKS (all universes)')
    log.info('─' * 60)
    for i, r in enumerate(global_top, 1):
        cats = ', '.join(r.get('categories') or []) or '—'
        log.info(
            f'  {i:>2}. {r.get("ticker","?"):<8} '
            f'score={r.get("score",0):>5.1f}  '
            f'RSI={r.get("rsi") or "?":>5}  '
            f'vol_ratio={r.get("volume_ratio") or 0:>4.1f}x  '
            f'[{r.get("universe","?")}]  {cats}'
        )
    log.info('═' * 60)

    if ai_summary:
        log.info('AI SUMMARY')
        log.info('─' * 60)
        for line in ai_summary.splitlines():
            log.info(f'  {line}')
        log.info('═' * 60)

    log.info('Scan complete.')


if __name__ == '__main__':
    main()
