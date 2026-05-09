"""
news_service.py

Fetches recent news for a ticker using yfinance.
Stores articles in MySQL to avoid duplicate fetches within NEWS_LOOKBACK_DAYS.
"""

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..core.config import settings

logger = logging.getLogger(__name__)


def _parse_yf_news(ticker: str, articles: list) -> list[dict]:
    """Normalise yfinance news items into our standard format."""
    out = []
    for a in articles:
        try:
            content = a.get('content', {})
            # yfinance ≥0.2.50 wraps metadata inside 'content'
            title = content.get('title') or a.get('title', '')
            url = (content.get('canonicalUrl', {}) or {}).get('url') or \
                  (content.get('clickThroughUrl', {}) or {}).get('url') or \
                  a.get('link', '')
            publisher = (content.get('provider', {}) or {}).get('displayName') or \
                        a.get('publisher', '')
            pub_ts = content.get('pubDate') or a.get('providerPublishTime')
            if isinstance(pub_ts, (int, float)):
                published_at = datetime.utcfromtimestamp(pub_ts)
            elif isinstance(pub_ts, str):
                try:
                    published_at = datetime.fromisoformat(pub_ts.replace('Z', '+00:00'))
                except Exception:
                    published_at = None
            else:
                published_at = None
            snippet = content.get('summary') or a.get('summary', '')
            if title:
                out.append({
                    'ticker': ticker,
                    'title': title[:512],
                    'publisher': publisher[:256] if publisher else '',
                    'url': url[:1024] if url else '',
                    'published_at': published_at,
                    'snippet': snippet[:2000] if snippet else '',
                })
        except Exception as e:
            logger.debug('Failed to parse news item for %s: %s', ticker, e)
    return out


def _is_fresh(ticker: str, db: Session) -> bool:
    """Return True if we fetched news for this ticker within NEWS_LOOKBACK_DAYS."""
    try:
        from ..models.models import NewsArticle
        cutoff = datetime.utcnow() - timedelta(days=settings.news_lookback_days)
        count = db.query(NewsArticle).filter(
            NewsArticle.ticker == ticker,
            NewsArticle.fetched_at >= cutoff
        ).limit(1).count()
        return count > 0
    except Exception:
        return False


def _store_articles(articles: list[dict], db: Session) -> None:
    try:
        from ..models.models import NewsArticle
        db.bulk_save_objects([
            NewsArticle(
                ticker=a['ticker'],
                title=a['title'],
                publisher=a.get('publisher', ''),
                url=a.get('url', ''),
                published_at=a.get('published_at'),
                snippet=a.get('snippet', ''),
            )
            for a in articles
        ])
        db.commit()
    except Exception as e:
        logger.warning('Failed to store news articles: %s', e)
        db.rollback()


def get_news_for_ticker(ticker: str, max_articles: int = 5,
                        db: Session | None = None) -> list[dict]:
    """
    Fetch recent news for ticker.
    Returns cached DB articles if fresh enough, otherwise fetches from yfinance.
    """
    # Try DB cache first
    if db and _is_fresh(ticker, db):
        try:
            from ..models.models import NewsArticle
            cutoff = datetime.utcnow() - timedelta(days=settings.news_lookback_days)
            rows = (db.query(NewsArticle)
                    .filter(NewsArticle.ticker == ticker,
                            NewsArticle.fetched_at >= cutoff)
                    .order_by(NewsArticle.published_at.desc())
                    .limit(max_articles)
                    .all())
            return [
                {
                    'ticker': r.ticker,
                    'title': r.title,
                    'publisher': r.publisher,
                    'url': r.url,
                    'published_at': r.published_at.isoformat() if r.published_at else None,
                    'snippet': r.snippet,
                }
                for r in rows
            ]
        except Exception as e:
            logger.warning('DB news lookup failed for %s: %s', ticker, e)

    # Fetch from yfinance
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        raw = t.news or []
        articles = _parse_yf_news(ticker, raw)[:max_articles]
        if articles and db:
            _store_articles(articles, db)
        # Serialise published_at for JSON
        return [
            {**a, 'published_at': a['published_at'].isoformat() if a.get('published_at') else None}
            for a in articles
        ]
    except Exception as e:
        logger.warning('yfinance news fetch failed for %s: %s', ticker, e)
        return []


def get_news_for_tickers(tickers: list[str], max_per_ticker: int = 5,
                         db: Session | None = None) -> dict[str, list[dict]]:
    """Batch fetch news for multiple tickers. Returns {ticker: [articles]}."""
    result = {}
    for ticker in tickers:
        result[ticker] = get_news_for_ticker(ticker, max_per_ticker, db)
    return result
