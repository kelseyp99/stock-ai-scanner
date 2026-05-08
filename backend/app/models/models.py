from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database.session import Base

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

class UserWatchlist(Base):
    __tablename__ = 'user_watchlists'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(128), index=True)
    ticker = Column(String(16), index=True)
    created_at = Column(DateTime, server_default=func.now())
