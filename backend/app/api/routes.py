from fastapi import APIRouter, Depends, HTTPException
from typing import List
from backend.app.services.scanner import scan_ticker
from backend.app.database.session import get_db
from sqlalchemy.orm import Session
from backend.app import models
from backend.app.schemas import schemas

router = APIRouter()

@router.get('/scan', response_model=List[schemas.ScanResultOut])
def scan_all(sample: int = 50):
    # For starter, scan a small sample of tickers hard-coded or from DB.
    tickers = ['AAPL','MSFT','GOOG','TSLA','AMZN'][:sample]
    results = []
    for t in tickers:
        r = scan_ticker(t)
        if r:
            results.append(r)
    return results

@router.get('/scan/{ticker}', response_model=schemas.ScanResultOut)
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
