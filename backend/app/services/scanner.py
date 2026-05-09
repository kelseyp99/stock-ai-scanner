"""scanner.py — Core stock scanning logic."""
import time
import yfinance as yf
import pandas as pd
from ..indicators.indicators import compute_rsi, moving_average, volatility as calc_volatility
import logging
logger = logging.getLogger(__name__)

# ── SPY return cache (TTL = 1 hour) ──────────────────────────────────────────
_spy_cache: dict = {'return': None, 'ts': 0.0}
_SPY_TTL = 3600.0

def get_spy_20d_return() -> float | None:
    """Return SPY's 20-day percent price return, cached for 1 hour."""
    global _spy_cache
    if _spy_cache['return'] is not None and (time.time() - _spy_cache['ts']) < _SPY_TTL:
        return _spy_cache['return']
    try:
        data = yf.download('SPY', period='30d', progress=False, auto_adjust=True)
        if data is None or data.empty:
            return None
        close, _ = _extract_close_volume(data)
        if close is None or len(close) < 21:
            return None
        ret = calc_20d_return(close)
        _spy_cache = {'return': ret, 'ts': time.time()}
        return ret
    except Exception:
        return None

def calc_20d_return(close: pd.Series) -> float | None:
    """Percent return over the last 20 trading days."""
    try:
        if close is None or len(close) < 21:
            return None
        start = float(close.iloc[-21])
        end   = float(close.iloc[-1])
        if start == 0:
            return None
        return round((end - start) / start * 100, 2)
    except Exception:
        return None

def _last_numeric_value(obj):
    try:
        if obj is None: return None
        if isinstance(obj, pd.DataFrame):
            nc = [c for c in obj.columns if pd.api.types.is_numeric_dtype(obj[c])]
            s = obj[nc[0]] if nc else obj.iloc[:, 0]
        else:
            s = obj
        if hasattr(s, 'squeeze'): s = s.squeeze()
        if getattr(s, 'empty', False): return None
        val = s.iat[-1] if (hasattr(s, 'iat') and not isinstance(s, pd.DataFrame)) else s.iloc[-1]
        return None if pd.isna(val) else float(val)
    except Exception:
        return None

def _extract_close_volume(data):
    if isinstance(data.columns, pd.MultiIndex):
        data = data.copy(); data.columns = [c[0] for c in data.columns]
    cols = list(data.columns)
    close = data['Close'] if 'Close' in cols else next((data[c] for c in cols if pd.api.types.is_numeric_dtype(data[c])), None)
    volume = data['Volume'] if 'Volume' in cols else next((data[c] for c in cols if 'volume' in str(c).lower()), None)
    if isinstance(close, pd.DataFrame): close = close.iloc[:, 0]
    if isinstance(volume, pd.DataFrame): volume = volume.iloc[:, 0]
    return close, volume

def calculate_rsi(close):
    s = compute_rsi(close)
    if isinstance(s, pd.DataFrame): s = s.iloc[:, 0]
    return _last_numeric_value(s)

def calculate_moving_averages(close):
    return _last_numeric_value(moving_average(close, 20)), _last_numeric_value(moving_average(close, 50))

def calculate_volume_ratio(volume):
    if volume is None or getattr(volume, 'empty', True): return 0.0
    avg = _last_numeric_value(volume.rolling(window=20).mean())
    latest = _last_numeric_value(volume)
    return round(latest / avg, 2) if (avg and avg > 0 and latest is not None) else 0.0

def calculate_volatility(close):
    s = calc_volatility(close, 20)
    if isinstance(s, pd.DataFrame): s = s.iloc[:, 0]
    return _last_numeric_value(s)

def normalize_dividend_yield(raw_yield) -> float:
    """Normalize yfinance dividendYield to a clean % float. Values >20 are invalid."""
    if not raw_yield: return 0.0
    try: raw = float(raw_yield)
    except: return 0.0
    if raw <= 0: return 0.0
    if raw < 1.0:
        pct = raw * 100
        return round(pct, 2) if pct <= 20.0 else 0.0
    if raw <= 20.0: return round(raw, 2)
    return 0.0

def classify_volatility(vol) -> str:
    """< 0.25 Low | 0.25-0.45 Moderate | 0.45-0.75 High | >=0.75 Extreme"""
    if vol is None: return 'Unknown'
    if vol < 0.25: return 'Low'
    if vol < 0.45: return 'Moderate'
    if vol < 0.75: return 'High'
    return 'Extreme'

def calculate_ma_spread_percent(ma20, ma50) -> float | None:
    """((MA20 - MA50) / MA50) * 100. Positive = MA20 above MA50."""
    if ma20 is None or ma50 is None or ma50 == 0:
        return None
    return round((ma20 - ma50) / ma50 * 100, 3)

def detect_ma_convergence(close: pd.Series) -> dict:
    """
    Compute MA convergence/divergence over the last 5 trading days.

    Returns dict with:
      ma_spread_percent       – today's spread %
      ma_convergence_direction – 'converging' | 'diverging' | 'flat' | None
      ma_convergence_label    – human-readable label
    """
    result = {
        'ma_spread_percent': None,
        'ma_convergence_direction': None,
        'ma_convergence_label': None,
    }
    if close is None or len(close) < 55:   # need at least 50 + 5 days
        return result

    ma20_series = close.rolling(window=20).mean()
    ma50_series = close.rolling(window=50).mean()

    if ma20_series.isna().all() or ma50_series.isna().all():
        return result

    # Today's values
    today_ma20 = float(ma20_series.iloc[-1])
    today_ma50 = float(ma50_series.iloc[-1])
    if pd.isna(today_ma20) or pd.isna(today_ma50) or today_ma50 == 0:
        return result

    # 5 days ago values
    prev_ma20 = float(ma20_series.iloc[-6]) if len(ma20_series) >= 6 else None
    prev_ma50 = float(ma50_series.iloc[-6]) if len(ma50_series) >= 6 else None
    if prev_ma20 is None or prev_ma50 is None or pd.isna(prev_ma20) or pd.isna(prev_ma50):
        return result

    spread_pct = calculate_ma_spread_percent(today_ma20, today_ma50)
    result['ma_spread_percent'] = spread_pct

    current_spread = abs(today_ma20 - today_ma50)
    previous_spread = abs(prev_ma20 - prev_ma50)

    converging = current_spread < previous_spread
    diverging  = current_spread > previous_spread

    if converging:
        result['ma_convergence_direction'] = 'converging'
    elif diverging:
        result['ma_convergence_direction'] = 'diverging'
    else:
        result['ma_convergence_direction'] = 'flat'

    # Label logic – only directionally correct crossover setups
    abs_spread = abs(spread_pct)
    if abs_spread > 5:
        result['ma_convergence_label'] = 'MA Spread Wide'
    elif abs_spread <= 2 and converging:
        if today_ma20 < today_ma50:
            result['ma_convergence_label'] = 'Bullish Crossover Setup'
        else:
            result['ma_convergence_label'] = 'Bearish Crossover Risk'
    elif abs_spread <= 2 and converging:
        result['ma_convergence_label'] = 'MA Converging'
    elif converging:
        result['ma_convergence_label'] = 'MA Converging'

    return result

def is_speculative_stock(price, market_cap, vol) -> bool:
    """Return True only for genuinely speculative / high-risk stocks.

    Rules:
      - price < 10  →  always speculative (penny / micro-cap territory)
      - small-cap (market_cap < 5 B) AND extreme volatility (vol >= 0.75)
      - If market_cap is unavailable, only price < 10 triggers the flag
        (large-cap companies like AMD/INTC are never flagged by volatility alone).
    """
    if price is not None and price < 10:
        return True
    if vol is not None and vol >= 0.75:
        # Only flag if we know it's a small/micro-cap, NOT when market_cap unknown
        if market_cap is not None and market_cap < 5_000_000_000:
            return True
    return False

def assign_categories(rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, vol,
                      market_cap=None, relative_strength=None, ma_convergence_label=None) -> list:
    """Assign signal categories from indicators."""
    cats = []
    if rsi is not None:
        if rsi < 35: cats.append('Oversold')
        if rsi > 65: cats.extend(['Momentum', 'Pullback Risk'])
    if price is not None and ma20 is not None and ma50 is not None:
        if price > ma20 and price > ma50:
            if 'Momentum' not in cats: cats.append('Momentum')
        elif price < ma20 and price < ma50:
            cats.append('Weak Trend')
    if volume_ratio > 1.5: cats.append('Breakout Volume')
    if dividend_yield_pct > 3.0: cats.append('Dividend')
    if vol is not None:
        if vol >= 0.75: cats.append('Extreme Volatility')
        elif vol >= 0.45: cats.append('High Volatility')
    if is_speculative_stock(price, market_cap, vol):
        cats.append('Speculative / High Risk')
    if relative_strength is not None:
        if relative_strength > 10: cats.append('Market Leader')
        elif relative_strength < -10: cats.append('Market Laggard')
    if ma_convergence_label in ('Bullish Crossover Setup', 'Bearish Crossover Risk', 'MA Converging'):
        cats.append(ma_convergence_label)
    seen = set(); return [c for c in cats if not (seen.add(c) or c in seen - {c})]

def calculate_score(rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, vol,
                    relative_strength=None, ma_convergence_label=None):
    """Scoring rules — all signals contribute additively."""
    score = 0; reasons = []
    if rsi is not None:
        if rsi < 35: score += 2; reasons.append('RSI below 35 (oversold)')
        elif rsi > 65: score += 1; reasons.append('RSI above 65 (momentum)')
    if price is not None and ma20 is not None and ma50 is not None:
        if price > ma20 and price > ma50: score += 2; reasons.append('Price above MA20 and MA50')
        elif price < ma20 and price < ma50: score -= 1; reasons.append('Price below MA20 and MA50 (weak trend)')
    if volume_ratio and volume_ratio > 1.5: score += 2; reasons.append(f'Volume {volume_ratio:.2f}x 20-day avg (breakout)')
    if dividend_yield_pct > 3.0: score += 2; reasons.append(f'Dividend yield {dividend_yield_pct:.2f}%')
    if vol is not None:
        if vol >= 0.75: score += 2; reasons.append(f'Extreme volatility ({vol:.4f})')
        elif vol >= 0.45: score += 1; reasons.append(f'High volatility ({vol:.4f})')
    if relative_strength is not None:
        if relative_strength > 10:
            score += 2; reasons.append(f'Market leader: RS vs SPY +{relative_strength:.1f}%')
        elif relative_strength < -10:
            score -= 1; reasons.append(f'Market laggard: RS vs SPY {relative_strength:.1f}%')
    if ma_convergence_label == 'Bullish Crossover Setup':
        score += 2; reasons.append('Bullish MA crossover setup (MA20 approaching MA50 from below)')
    elif ma_convergence_label == 'MA Converging':
        score += 1; reasons.append('Moving averages converging')
    elif ma_convergence_label == 'Bearish Crossover Risk':
        score -= 1; reasons.append('Bearish MA crossover risk (MA20 approaching MA50 from above)')
    return score, reasons

def scan_ticker(ticker: str, period_days: int = 120, debug: bool = False):
    """Scan one ticker: fetch -> indicators -> score -> categories."""
    debug_info = {'ticker': ticker, 'fetched_rows': 0, 'has_close': False, 'has_volume': False, 'exception': None}
    try:
        data = yf.download(ticker, period=f"{period_days}d", progress=False, auto_adjust=True)
        if data is None or data.empty:
            return ({'ticker': ticker, 'ok': False, 'error': 'no data', 'debug': debug_info} if debug else None)
        debug_info['fetched_rows'] = int(data.shape[0])
        close, volume = _extract_close_volume(data)
        debug_info['has_close'] = close is not None and not getattr(close, 'empty', False)
        debug_info['has_volume'] = volume is not None and not getattr(volume, 'empty', False)
        if close is None or getattr(close, 'empty', True):
            return ({'ticker': ticker, 'ok': False, 'error': 'no close', 'debug': debug_info} if debug else None)
        price = _last_numeric_value(close)
        rsi = calculate_rsi(close)
        ma20, ma50 = calculate_moving_averages(close)
        volume_ratio = calculate_volume_ratio(volume)
        vol = calculate_volatility(close)
        vol_label = classify_volatility(vol)
        try:
            info = yf.Ticker(ticker).info
            raw_yield = info.get('dividendYield', 0)
            market_cap = info.get('marketCap', None)
            if market_cap is not None:
                try: market_cap = float(market_cap)
                except: market_cap = None
        except Exception:
            raw_yield = 0
            market_cap = None
        dividend_yield_pct = normalize_dividend_yield(raw_yield)
        stock_return = calc_20d_return(close)
        spy_return = get_spy_20d_return()
        if stock_return is not None and spy_return is not None:
            relative_strength = round(stock_return - spy_return, 2)
        else:
            relative_strength = None
        ma_conv = detect_ma_convergence(close)
        ma_conv_label = ma_conv['ma_convergence_label']
        score, reasons = calculate_score(
            rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, vol,
            relative_strength, ma_conv_label)
        categories = assign_categories(
            rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, vol,
            market_cap, relative_strength, ma_conv_label)
        result = {
            'ticker': ticker,
            'price': round(price, 2) if price is not None else None,
            'rsi': round(rsi, 2) if rsi is not None else None,
            'ma20': round(ma20, 2) if ma20 is not None else None,
            'ma50': round(ma50, 2) if ma50 is not None else None,
            'volume_ratio': round(volume_ratio, 2),
            'volatility': round(vol, 4) if vol is not None else None,
            'volatility_label': vol_label,
            'volatility_20': round(vol, 4) if vol is not None else None,
            'dividend_yield': dividend_yield_pct,
            'dividend_yield_percent': dividend_yield_pct,
            'market_cap': int(market_cap) if market_cap is not None else None,
            'score': int(score),
            'categories': categories,
            'reasons': '; '.join(reasons),
            'relative_strength_20d': relative_strength,
            'ma_spread_percent': ma_conv['ma_spread_percent'],
            'ma_convergence_direction': ma_conv['ma_convergence_direction'],
            'ma_convergence_label': ma_conv['ma_convergence_label'],
        }
        if debug: result['ok'] = True; result['debug'] = debug_info
        return result
    except Exception as e:
        logger.exception("scan_ticker failed for %s: %s", ticker, e)
        debug_info['exception'] = str(e)
        return ({'ticker': ticker, 'ok': False, 'error': str(e), 'debug': debug_info} if debug else None)
