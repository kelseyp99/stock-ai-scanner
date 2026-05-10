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
    # ── Volatility (ATR-based) ──
    volatility: Optional[float] = None          # ATR% (was annualized std)
    volatility_label: Optional[str] = None
    volatility_20: Optional[float] = None       # legacy alias = ATR%
    atr_dollar: Optional[float] = None
    atr_pct: Optional[float] = None
    # ── Expected move ──
    expected_move_pct: Optional[float] = None
    # ── Action zones ──
    buy_zone_low: Optional[float] = None
    buy_zone_high: Optional[float] = None
    chase_zone: Optional[float] = None
    danger_zone: Optional[float] = None
    in_buy_zone: Optional[bool] = None
    in_chase_zone: Optional[bool] = None
    # ── MA distance ──
    ma_distance_pct: Optional[float] = None
    ma_distance_label: Optional[str] = None
    # ── Dividend ──
    dividend_yield: Optional[float] = None
    dividend_yield_percent: Optional[float] = None
    # ── Weighted scoring ──
    bullish_score: Optional[int] = None
    risk_score: Optional[int] = None
    score: int = 0
    # ── Signal data ──
    categories: Optional[List[str]] = []
    reasons: str = ""
    explanation: Optional[str] = None
    risk_profile: Optional[str] = None
    # ── Fundamentals ──
    relative_strength_20d: Optional[float] = None
    market_cap: Optional[int] = None
    # ── MA convergence ──
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
