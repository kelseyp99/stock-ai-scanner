"""
news_signal_service.py

Scores a ticker's recent news headlines for extraordinary catalysts.
Returns a boost integer that feeds directly into the scanner's composite score.

Positive catalysts → boost +1 to +4 (e.g. FDA approval, earnings beat, acquisition)
Negative catalysts → boost -1 to -4 (e.g. earnings miss, SEC probe, bankruptcy)

Only the single strongest signal (highest absolute weight) is used to avoid
stacking noise.  The label is surfaced in the UI as a badge.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Keyword tables  (pattern, weight)  — searched case-insensitively in
# title + first 400 chars of snippet.
# ─────────────────────────────────────────────────────────────────────────────
_BULLISH: list[tuple[str, int, str]] = [
    # pattern                       weight  label
    (r'fda appro(?:v|val)',            4,  '🚀 FDA Approval'),
    (r'acqui(?:res?|sition)',          3,  '🤝 Acquisition'),
    (r'\bmerger\b',                    3,  '🤝 Merger'),
    (r'share[\s-]repurchase|buyback',  3,  '💰 Share Buyback'),
    (r'earnings?\s+beat|beats?\s+estimate',  3,  '📈 Earnings Beat'),
    (r'record\s+(?:revenue|profit|earnings)', 3, '🏆 Record Earnings'),
    (r'guid(?:ance)?\s+rais|rais(?:ed|es)\s+guid', 3, '📊 Guidance Raised'),
    (r'strong[\s-]buy|buy\s+rating',   2,  '⬆️ Analyst Upgrade'),
    (r'\bupgrade[d]?\b',               2,  '⬆️ Analyst Upgrade'),
    (r'dividend\s+increas|increas\s+dividend', 2, '💵 Dividend Increase'),
    (r'major\s+contract|contract\s+win', 2, '📋 Contract Win'),
    (r'strategic\s+partner|partnership', 2, '🤝 New Partnership'),
    (r'(?:stock|share)\s+split',       2,  '✂️ Stock Split'),
    (r'insider\s+buy',                 2,  '🏦 Insider Buying'),
    (r'short\s+squeeze',               2,  '🔥 Short Squeeze'),
    (r'\bsurge[sd]?\b',                1,  '📈 Price Surge'),
    (r'\bbreakout\b',                  1,  '💥 Breakout'),
    (r'\brally\b',                     1,  '📈 Rally'),
]

_BEARISH: list[tuple[str, int, str]] = [
    # pattern                       weight  label
    (r'\bbankruptcy\b',                -4, '💀 Bankruptcy'),
    (r'\bfraud\b',                     -3, '🚨 Fraud Allegation'),
    (r'sec\s+(?:invest|charg|probe|subpoena)', -3, '🚨 SEC Investigation'),
    (r'earnings?\s+miss|miss(?:es|ed)?\s+estimate', -3, '📉 Earnings Miss'),
    (r'guid(?:ance)?\s+cut|cut\s+guid|lower(?:ed|s)\s+guid', -3, '📉 Guidance Cut'),
    (r'fda\s+(?:reject|refus|den)',    -3, '🚫 FDA Rejection'),
    (r'ceo\s+(?:resign|depart|step)',  -2, '⚠️ CEO Departure'),
    (r'cfo\s+(?:resign|depart|step)',  -2, '⚠️ CFO Departure'),
    (r'\blayoffs?\b',                  -2, '⚠️ Layoffs'),
    (r'\bdowngrade[d]?\b',             -2, '⬇️ Analyst Downgrade'),
    (r'sell\s+rating',                 -2, '⬇️ Analyst Downgrade'),
    (r'data\s+breach|cyber\s+attack',  -2, '🔓 Data Breach'),
    (r'\blawsuit\b',                   -1, '⚖️ Lawsuit'),
    (r'\brestructur',                  -1, '⚠️ Restructuring'),
    (r'profit\s+warn|warning',         -1, '⚠️ Profit Warning'),
    (r'recall\b',                      -1, '⚠️ Product Recall'),
]

# Compile once
_BULLISH_RE = [(re.compile(p, re.IGNORECASE), w, lbl) for p, w, lbl in _BULLISH]
_BEARISH_RE = [(re.compile(p, re.IGNORECASE), w, lbl) for p, w, lbl in _BEARISH]


def _search_text(text: str) -> list[tuple[int, str]]:
    """Return list of (weight, label) for all matches found in text."""
    hits: list[tuple[int, str]] = []
    for rx, w, lbl in _BULLISH_RE:
        if rx.search(text):
            hits.append((w, lbl))
    for rx, w, lbl in _BEARISH_RE:
        if rx.search(text):
            hits.append((w, lbl))
    return hits


def score_news(articles: list[dict]) -> dict:
    """
    Score a list of news articles (as returned by get_news_for_ticker).

    Returns:
        {
          'news_boost':    int   — net score contribution (-4 to +4),
          'news_catalyst': str   — human-readable label of the strongest signal,
          'news_headline': str   — title of the article that triggered the signal,
        }
    """
    if not articles:
        return {'news_boost': 0, 'news_catalyst': None, 'news_headline': None}

    all_hits: list[tuple[int, str, str]] = []  # (weight, label, headline)

    for art in articles[:10]:  # cap at 10 articles
        title   = (art.get('title') or '')
        snippet = (art.get('snippet') or '')[:400]
        text    = f"{title} {snippet}"
        for w, lbl in _search_text(text):
            all_hits.append((w, lbl, title))

    if not all_hits:
        return {'news_boost': 0, 'news_catalyst': None, 'news_headline': None}

    # Pick the single hit with the highest absolute weight
    best = max(all_hits, key=lambda h: abs(h[0]))
    weight, label, headline = best

    # Sum all signals but cap total boost to ±4
    total = sum(h[0] for h in all_hits)
    boost = max(-4, min(4, total))

    # Only apply boost if we found a meaningful signal (|weight| >= 2)
    if abs(weight) < 2:
        boost = max(-1, min(1, boost))
        label = None  # don't show a badge for minor noise

    return {
        'news_boost':    boost,
        'news_catalyst': label,
        'news_headline': headline[:120] if label else None,
    }


def fetch_and_score_news(ticker: str, db=None) -> dict:
    """
    Convenience wrapper: fetch news for ticker then score it.
    Safe to call from a thread — catches all exceptions.
    """
    try:
        from .news_service import get_news_for_ticker
        articles = get_news_for_ticker(ticker, max_articles=10, db=db)
        return score_news(articles)
    except Exception as e:
        logger.debug('news signal fetch failed for %s: %s', ticker, e)
        return {'news_boost': 0, 'news_catalyst': None, 'news_headline': None}
