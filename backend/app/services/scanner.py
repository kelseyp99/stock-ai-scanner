from datetime import datetime
import yfinance as yf
import pandas as pd
from backend.app.indicators.indicators import compute_rsi, moving_average, volatility

def scan_ticker(ticker: str, period_days: int = 120):
    data = yf.download(ticker, period=f"{period_days}d", progress=False)
    if data.empty:
        return None
    close = data['Close']
    volume = data['Volume']

    rsi = compute_rsi(close).iloc[-1]
    ma20 = moving_average(close, 20).iloc[-1]
    ma50 = moving_average(close, 50).iloc[-1]
    avg_vol20 = volume.rolling(window=20).mean().iloc[-1]
    volume_ratio = (volume.iloc[-1] / avg_vol20) if avg_vol20 and avg_vol20 > 0 else 0
    vol20 = volatility(close, 20).iloc[-1]

    # dividend yield from yfinance ticker info if available
    info = yf.Ticker(ticker).info
    dividend_yield = info.get('dividendYield', 0) or 0
    if dividend_yield and dividend_yield < 1:
        # yfinance dividendYield might be fraction; convert to percent
        dividend_yield = dividend_yield * 100

    price = close.iloc[-1]

    # scoring
    score = 0
    reasons = []
    if rsi is not None:
        if rsi < 35:
            score += 2
            reasons.append('RSI below 35')
        elif rsi > 65:
            score += 1
            reasons.append('RSI above 65')
    if price > ma20 and price > ma50:
        score += 2
        reasons.append('Price above MA20 and MA50')
    if volume_ratio and volume_ratio > 1.5:
        score += 2
        reasons.append('Volume > 1.5x 20-day avg')
    if dividend_yield and dividend_yield > 3:
        score += 2
        reasons.append('Dividend yield > 3%')
    if vol20 and vol20 > 0.05:
        score += 1
        reasons.append('High volatility')

    return {
        'ticker': ticker,
        'price': float(price),
        'rsi': float(rsi) if rsi is not None else None,
        'ma20': float(ma20) if ma20 is not None else None,
        'ma50': float(ma50) if ma50 is not None else None,
        'volume_ratio': float(volume_ratio) if volume_ratio is not None else None,
        'dividend_yield': float(dividend_yield) if dividend_yield is not None else 0,
        'volatility_20': float(vol20) if vol20 is not None else None,
        'score': int(score),
        'reasons': '; '.join(reasons)
    }
