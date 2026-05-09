from typing import List
from sqlalchemy.orm import Session
from ..models.models import Stock

DEFAULT_TICKERS = [
    'AAPL','MSFT','GOOG','AMZN','TSLA','NVDA','META','NFLX','INTC','AMD',
    'BABA','ORCL','CSCO','ADBE','CRM','PYPL','UBER','LYFT','SQ','SHOP',
    'V','MA','JPM','BAC','WFC','C','GS','MS','F','GM','NIO','RIVN','PLTR',
    'SPCE','SHOP','TWTR','SNAP','ZM','DOCU','WORK','OKTA','NOW','ATVI'
]

def seed_default_tickers(db: Session, tickers: List[str] | None = None):
    tickers = tickers or DEFAULT_TICKERS
    # Query existing tickers in one call
    existing_rows = db.query(Stock.ticker).filter(Stock.ticker.in_(tickers)).all()
    existing = {r[0] for r in existing_rows}
    to_create = [Stock(ticker=t) for t in tickers if t not in existing]
    created = 0
    if to_create:
        db.bulk_save_objects(to_create)
        db.commit()
        created = len(to_create)
    return created

def get_tickers(db: Session, limit: int = 50):
    q = db.query(Stock.ticker).order_by(Stock.ticker).limit(limit)
    return [r[0] for r in q.all()]
