from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ScanResultBase(BaseModel):
    ticker: str
    price: Optional[float] = None
    rsi: Optional[float] = None
    ma20: Optional[float] = None
    ma50: Optional[float] = None
    volume_ratio: Optional[float] = None
    # volatility fields
    volatility: Optional[float] = None
    volatility_label: Optional[str] = None
    volatility_20: Optional[float] = None   # legacy alias
    # dividend
    dividend_yield: Optional[float] = None
    dividend_yield_percent: Optional[float] = None
    # score & signals
    score: int = 0
    categories: Optional[List[str]] = []
    reasons: str = ""
    relative_strength_20d: Optional[float] = None
    market_cap: Optional[int] = None
    # MA convergence
    ma_spread_percent: Optional[float] = None
    ma_convergence_direction: Optional[str] = None
    ma_convergence_label: Optional[str] = None

class ScanResultCreate(ScanResultBase):
    pass

class ScanResultOut(ScanResultBase):
    id: Optional[int] = None
    class Config:
        from_attributes = True

class WatchlistItem(BaseModel):
    user_id: str
    ticker: str

class ScanRunOut(BaseModel):
    id: int
    started_at: datetime
    finished_at: Optional[datetime]
    notes: Optional[str]
    class Config:
        orm_mode = True
