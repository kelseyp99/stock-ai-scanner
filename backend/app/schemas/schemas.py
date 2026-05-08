from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class ScanResultBase(BaseModel):
    ticker: str
    price: float
    rsi: float
    ma20: float
    ma50: float
    volume_ratio: float
    dividend_yield: float
    volatility_20: float
    score: int
    reasons: str

class ScanResultCreate(ScanResultBase):
    pass

class ScanResultOut(ScanResultBase):
    id: int
    class Config:
        orm_mode = True

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
