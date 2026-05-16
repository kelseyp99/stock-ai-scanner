from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.session import Base


class Stock(Base):
    __tablename__ = 'stocks'
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(16), unique=True, index=True, nullable=False)
    name = Column(String(256), nullable=True)


class ScanRun(Base):
    __tablename__ = 'scan_runs'
    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, server_default=func.now())
    finished_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)


class ScanResult(Base):
    __tablename__ = 'scan_results'
    id = Column(Integer, primary_key=True, index=True)
    scan_run_id = Column(Integer, ForeignKey('scan_runs.id'))
    ticker = Column(String(16), index=True)
    price = Column(Float)
    rsi = Column(Float)
    ma20 = Column(Float)
    ma50 = Column(Float)
    volume_ratio = Column(Float)
    dividend_yield = Column(Float)
    volatility_20 = Column(Float)
    score = Column(Integer)
    reasons = Column(Text)
    scan_run = relationship('ScanRun')


class ScannerCandidateHistory(Base):
    __tablename__ = 'scanner_candidate_history'
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), index=True, nullable=False)
    date_flagged = Column(DateTime, server_default=func.now(), index=True)
    price_when_flagged = Column(Float, nullable=True)
    rsi = Column(Float, nullable=True)
    volume_ratio = Column(Float, nullable=True)
    atr = Column(Float, nullable=True)
    trend_score = Column(Float, nullable=True)
    scanner_category = Column(String(256), nullable=True)
    sector = Column(String(128), nullable=True)
    asset_type = Column(String(32), nullable=True)
    source = Column(String(64), nullable=True)


class FibRetracementLevel(Base):
    __tablename__ = 'fib_retracement_levels'
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), index=True, nullable=False)
    calculated_at = Column(DateTime, server_default=func.now(), index=True)
    swing_low = Column(Float, nullable=True)
    swing_high = Column(Float, nullable=True)
    fib_382 = Column(Float, nullable=True)
    fib_500 = Column(Float, nullable=True)
    fib_618 = Column(Float, nullable=True)
    hit_level = Column(String(16), nullable=True)
    asset_type = Column(String(32), nullable=True)


class TechnicalAlert(Base):
    __tablename__ = 'technical_alerts'
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(32), index=True, nullable=False)
    alert_type = Column(String(64), index=True, nullable=False)
    severity = Column(String(32), nullable=True)
    message = Column(Text, nullable=True)
    payload = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)


class UserWatchlist(Base):
    __tablename__ = 'user_watchlists'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(128), index=True)
    ticker = Column(String(16), index=True)
    created_at = Column(DateTime, server_default=func.now())


# ── Index universe tables ─────────────────────────────────────────────────────

class IndexUniverse(Base):
    __tablename__ = 'index_universes'
    id = Column(Integer, primary_key=True, index=True)
    universe_id = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    source = Column(String(256), nullable=True)
    last_updated = Column(DateTime, nullable=True)
    constituents = relationship('IndexConstituent', back_populates='universe',
                                cascade='all, delete-orphan')


class IndexConstituent(Base):
    __tablename__ = 'index_constituents'
    id = Column(Integer, primary_key=True, index=True)
    universe_id = Column(String(32), ForeignKey('index_universes.universe_id'), index=True)
    ticker = Column(String(16), index=True)
    company_name = Column(String(256), nullable=True)
    sector = Column(String(128), nullable=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint('universe_id', 'ticker', name='uq_universe_ticker'),)
    universe = relationship('IndexUniverse', back_populates='constituents')


# ── News articles ─────────────────────────────────────────────────────────────

class NewsArticle(Base):
    __tablename__ = 'news_articles'
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(16), index=True, nullable=False)
    title = Column(String(512), nullable=False)
    publisher = Column(String(256), nullable=True)
    url = Column(String(1024), nullable=True)
    published_at = Column(DateTime, nullable=True)
    snippet = Column(Text, nullable=True)
    fetched_at = Column(DateTime, server_default=func.now())


# ── AI summary runs ───────────────────────────────────────────────────────────

class AiSummaryRun(Base):
    __tablename__ = 'ai_summary_runs'
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, server_default=func.now())
    provider = Column(String(64), nullable=True)   # openrouter | huggingface | local
    model_id = Column(String(128), nullable=True)
    universe_id = Column(String(32), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)
    error = Column(Text, nullable=True)


# ── Scheduler models ─────────────────────────────────────────────────────────
class SchedulerSetting(Base):
    __tablename__ = 'scheduler_settings'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(128), index=True, nullable=False)
    enabled = Column(Integer, default=0)  # 0/1 stored as int for compatibility
    scan_time = Column(String(16), nullable=False, default='02:00')
    timezone = Column(String(64), nullable=False, default='America/New_York')
    universe_id = Column(String(64), nullable=True)   # legacy single-universe field
    universe_ids = Column(Text, nullable=True)         # JSON list e.g. '["sp500","nasdaq100"]'
    weekdays_only = Column(Integer, default=1)         # 1 = Mon-Fri only; 0 = run every day
    max_tickers = Column(Integer, nullable=True)
    fetch_news = Column(Integer, default=0)
    generate_ai_summary = Column(Integer, default=0)
    ai_provider = Column(String(64), nullable=True)
    ai_model_id = Column(String(128), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ScheduledScanRun(Base):
    __tablename__ = 'scheduled_scan_runs'
    id = Column(Integer, primary_key=True, index=True)
    scheduler_setting_id = Column(Integer, ForeignKey('scheduler_settings.id'), index=True)
    user_id = Column(String(128), index=True, nullable=True)
    universe_id = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False, default='pending')  # pending|running|completed|failed
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    tickers_scanned = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    scan_run_id = Column(Integer, ForeignKey('scan_runs.id'), nullable=True)
    ai_summary_id = Column(Integer, ForeignKey('ai_summary_runs.id'), nullable=True)

    setting = relationship('SchedulerSetting')
    scan_run = relationship('ScanRun')
    ai_summary = relationship('AiSummaryRun')
