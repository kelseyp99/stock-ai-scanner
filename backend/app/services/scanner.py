"""scanner.py — Core stock scanning logic (v2: ATR%, action zones, risk profiles, weighted scoring)."""
import math
import time
import yfinance as yf
import pandas as pd
from ..indicators.indicators import compute_rsi, moving_average, calculate_atr as _calc_atr
import logging
logger = logging.getLogger(__name__)

# ── SPY return cache ──────────────────────────────────────────────────────────
_spy_cache: dict = {'return': None, 'ts': 0.0}
_SPY_TTL = 3600.0

def get_spy_20d_return() -> float | None:
    global _spy_cache
    if _spy_cache['return'] is not None and (time.time() - _spy_cache['ts']) < _SPY_TTL:
        return _spy_cache['return']
    try:
        data = yf.download('SPY', period='30d', progress=False, auto_adjust=True)
        if data is None or data.empty: return None
        close, _, _, _ = _extract_ohlcv(data)
        if close is None or len(close) < 21: return None
        ret = calc_20d_return(close)
        _spy_cache = {'return': ret, 'ts': time.time()}
        return ret
    except Exception:
        return None

def calc_20d_return(close: pd.Series) -> float | None:
    try:
        if close is None or len(close) < 21: return None
        start = float(close.iloc[-21]); end = float(close.iloc[-1])
        if start == 0: return None
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

def _extract_ohlcv(data):
    if isinstance(data.columns, pd.MultiIndex):
        data = data.copy(); data.columns = [c[0] for c in data.columns]
    cols = list(data.columns)
    def _pick(name):
        if name in cols:
            s = data[name]
            return s.iloc[:, 0] if isinstance(s, pd.DataFrame) else s
        return None
    close = _pick('Close'); high = _pick('High'); low = _pick('Low'); volume = _pick('Volume')
    if close is None:
        close = next((data[c] for c in cols if pd.api.types.is_numeric_dtype(data[c])), None)
    return close, high, low, volume

def _extract_close_volume(data):
    close, _, _, volume = _extract_ohlcv(data)
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

# ── ATR-based volatility ──────────────────────────────────────────────────────

def classify_atr(atr_pct: float | None) -> str:
    """ATR% tiers: Low <1.5 | Moderate 1.5-3 | High 3-5 | Extreme >5."""
    if atr_pct is None: return 'Unknown'
    if atr_pct < 1.5: return 'Low'
    if atr_pct < 3.0: return 'Moderate'
    if atr_pct < 5.0: return 'High'
    return 'Extreme'

classify_volatility = classify_atr   # backward-compat alias

def calculate_atr_info(high, low, close, price: float | None) -> dict:
    try:
        atr_series = _calc_atr(high, low, close, period=14)
        atr_dollar = _last_numeric_value(atr_series)
        if atr_dollar is None or price is None or price == 0:
            return {'atr_dollar': None, 'atr_pct': None, 'volatility_label': 'Unknown'}
        atr_pct = round((atr_dollar / price) * 100, 2)
        return {'atr_dollar': round(atr_dollar, 2), 'atr_pct': atr_pct, 'volatility_label': classify_atr(atr_pct)}
    except Exception:
        return {'atr_dollar': None, 'atr_pct': None, 'volatility_label': 'Unknown'}

def normalize_dividend_yield(raw_yield) -> float:
    if not raw_yield: return 0.0
    try: raw = float(raw_yield)
    except: return 0.0
    if raw <= 0: return 0.0
    if raw < 1.0:
        pct = raw * 100
        return round(pct, 2) if pct <= 20.0 else 0.0
    if raw <= 20.0: return round(raw, 2)
    return 0.0

def calculate_ma_spread_percent(ma20, ma50) -> float | None:
    if ma20 is None or ma50 is None or ma50 == 0: return None
    return round((ma20 - ma50) / ma50 * 100, 3)

def detect_ma_convergence(close: pd.Series) -> dict:
    result = {'ma_spread_percent': None, 'ma_convergence_direction': None, 'ma_convergence_label': None}
    if close is None or len(close) < 55: return result
    ma20_series = close.rolling(window=20).mean()
    ma50_series = close.rolling(window=50).mean()
    if ma20_series.isna().all() or ma50_series.isna().all(): return result
    today_ma20 = float(ma20_series.iloc[-1]); today_ma50 = float(ma50_series.iloc[-1])
    if pd.isna(today_ma20) or pd.isna(today_ma50) or today_ma50 == 0: return result
    prev_ma20 = float(ma20_series.iloc[-6]) if len(ma20_series) >= 6 else None
    prev_ma50 = float(ma50_series.iloc[-6]) if len(ma50_series) >= 6 else None
    if prev_ma20 is None or prev_ma50 is None or pd.isna(prev_ma20) or pd.isna(prev_ma50): return result
    result['ma_spread_percent'] = calculate_ma_spread_percent(today_ma20, today_ma50)
    current_spread = abs(today_ma20 - today_ma50); previous_spread = abs(prev_ma20 - prev_ma50)
    converging = current_spread < previous_spread; diverging = current_spread > previous_spread
    result['ma_convergence_direction'] = 'converging' if converging else ('diverging' if diverging else 'flat')
    abs_spread = abs(result['ma_spread_percent'] or 0)
    if abs_spread > 5:
        result['ma_convergence_label'] = 'MA Spread Wide'
    elif abs_spread <= 2 and converging:
        result['ma_convergence_label'] = 'Bullish Crossover Setup' if today_ma20 < today_ma50 else 'Bearish Crossover Risk'
    elif converging:
        result['ma_convergence_label'] = 'MA Converging'
    return result

# ── Expected daily move ───────────────────────────────────────────────────────

def calculate_expected_move(atr_pct: float | None, implied_volatility: float | None = None) -> float | None:
    """Expected daily move %. IV/sqrt(252) when available, else ATR%."""
    if implied_volatility is not None:
        try: return round(float(implied_volatility) * 100 / math.sqrt(252), 2)
        except Exception: pass
    return atr_pct

# ── Action zones ──────────────────────────────────────────────────────────────

def calculate_action_zones(price, ma20, ma50, atr_dollar) -> dict:
    empty = {'buy_zone_low': None, 'buy_zone_high': None, 'chase_zone': None, 'danger_zone': None, 'in_buy_zone': None, 'in_chase_zone': None}
    if any(v is None for v in [price, ma20, ma50, atr_dollar]): return empty
    buy_zone_low = round(ma20 - atr_dollar * 0.5, 2)
    buy_zone_high = round(ma20, 2)
    chase_zone = round(ma20 + atr_dollar * 0.5, 2)
    danger_zone = round(ma50 - atr_dollar, 2)
    return {'buy_zone_low': buy_zone_low, 'buy_zone_high': buy_zone_high,
            'chase_zone': chase_zone, 'danger_zone': danger_zone,
            'in_buy_zone': bool(buy_zone_low <= price <= buy_zone_high),
            'in_chase_zone': bool(price > chase_zone)}

# ── MA distance from price ────────────────────────────────────────────────────

def calculate_ma_distance(price, ma20) -> tuple[float | None, str | None]:
    if price is None or ma20 is None or ma20 == 0: return None, None
    pct = round(((price - ma20) / ma20) * 100, 2)
    if   pct >  8: label = 'Extended'
    elif pct >  3: label = 'Slightly Extended'
    elif pct > -3: label = 'Neutral'
    elif pct > -8: label = 'Pulling Back'
    else:          label = 'Oversold'
    return pct, label

# ── Risk profile ──────────────────────────────────────────────────────────────

def assign_risk_profile(atr_pct, market_cap, dividend_yield_pct, rsi, price, ma20, ma50) -> str:
    div = dividend_yield_pct or 0; atr = atr_pct or 0
    if div > 3.0 and atr < 2.0: return 'Conservative Income'
    if div > 2.0 and atr < 3.0: return 'Defensive Dividend'
    if atr > 5.0 and (market_cap is None or market_cap < 2_000_000_000): return 'Speculative'
    if atr > 5.0: return 'High Volatility'
    if rsi is not None and rsi > 60 and price is not None and ma20 is not None and price > ma20: return 'Momentum Growth'
    if rsi is not None and rsi < 40: return 'Mean Reversion'
    if div > 1.5: return 'Defensive Dividend'
    return 'Balanced'

# ── Speculative flag ──────────────────────────────────────────────────────────

def is_speculative_stock(price, market_cap, atr_pct) -> bool:
    if price is not None and price < 10: return True
    if atr_pct is not None and atr_pct > 5.0:
        if market_cap is not None and market_cap < 5_000_000_000: return True
    return False

# ── Weighted scoring ──────────────────────────────────────────────────────────

def calculate_weighted_score(rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct,
                              atr_pct, market_cap, relative_strength, ma_conv_label):
    reasons = []; bullish = 0; risk = 0
    if rsi is not None:
        if rsi > 65:   bullish += 2; reasons.append(f'RSI {rsi:.1f} — strong momentum')
        elif rsi < 35: bullish += 1; reasons.append(f'RSI {rsi:.1f} — oversold, potential reversal')
    if price is not None and ma20 is not None:
        if price > ma20: bullish += 2; reasons.append('Above MA20')
        else:            risk    += 2; reasons.append('Below MA20 — bearish bias')
    if price is not None and ma50 is not None:
        if price > ma50: bullish += 2; reasons.append('Above MA50')
    if volume_ratio is not None and volume_ratio > 1.5:
        bullish += 2; reasons.append(f'Volume {volume_ratio:.1f}x average — breakout signal')
    if ma_conv_label == 'Bullish Crossover Setup':
        bullish += 2; reasons.append('Bullish MA crossover setup')
    elif ma_conv_label == 'Bearish Crossover Risk':
        risk    += 1; reasons.append('Bearish MA crossover risk')
    if relative_strength is not None:
        if relative_strength > 10:   bullish += 2; reasons.append(f'+{relative_strength:.1f}% vs SPY — market leader')
        elif relative_strength < -10: risk   += 1; reasons.append(f'{relative_strength:.1f}% vs SPY — lagging')
    if dividend_yield_pct is not None and dividend_yield_pct > 3.0:
        bullish += 1; reasons.append(f'{dividend_yield_pct:.1f}% dividend yield')
    if atr_pct is not None and atr_pct > 6:
        risk += 2; reasons.append(f'ATR {atr_pct:.1f}%/day — large daily swings')
    if market_cap is not None and market_cap < 1_000_000_000:
        risk += 2; reasons.append('Small-cap — elevated risk')
    return bullish, risk, bullish - risk, reasons

# ── Category assignment ───────────────────────────────────────────────────────

def assign_categories(rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, atr_pct,
                      market_cap=None, relative_strength=None, ma_convergence_label=None) -> list:
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
    if dividend_yield_pct and dividend_yield_pct > 3.0: cats.append('Dividend')
    if atr_pct is not None:
        if atr_pct >= 5.0: cats.append('Extreme Volatility')
        elif atr_pct >= 3.0: cats.append('High Volatility')
    if is_speculative_stock(price, market_cap, atr_pct): cats.append('Speculative / High Risk')
    if relative_strength is not None:
        if relative_strength > 10: cats.append('Market Leader')
        elif relative_strength < -10: cats.append('Market Laggard')
    if ma_convergence_label in ('Bullish Crossover Setup', 'Bearish Crossover Risk', 'MA Converging'):
        cats.append(ma_convergence_label)
    seen = set()
    return [c for c in cats if not (seen.add(c) or c in seen - {c})]

# ── Natural-language explanation ──────────────────────────────────────────────

def generate_explanation(price, rsi, ma20, ma50, atr_pct, volume_ratio,
                         ma_distance_pct, relative_strength, dividend_yield_pct) -> str:
    parts = []
    if ma_distance_pct is not None:
        d = abs(ma_distance_pct)
        if ma_distance_pct > 8:    parts.append(f"Price is {d:.1f}% above MA20 — extended, watch for a pullback.")
        elif ma_distance_pct > 3:  parts.append(f"Price is {d:.1f}% above MA20 with bullish trend intact.")
        elif ma_distance_pct > -3: parts.append("Price is near MA20 — neutral positioning.")
        elif ma_distance_pct > -8: parts.append(f"Price is {d:.1f}% below MA20 — in pullback territory.")
        else:                      parts.append(f"Price is {d:.1f}% below MA20 — deeply extended downside.")
    if rsi is not None:
        if rsi > 80:   parts.append(f"RSI {rsi:.1f} — overbought and overheated.")
        elif rsi > 65: parts.append(f"RSI {rsi:.1f} confirms strong momentum.")
        elif rsi < 30: parts.append(f"RSI {rsi:.1f} — deeply oversold, mean reversion possible.")
        elif rsi < 40: parts.append(f"RSI {rsi:.1f} — momentum weakening.")
    if atr_pct is not None:
        if atr_pct > 5:     parts.append(f"ATR {atr_pct:.1f}%/day — large intraday swings, well-suited for options plays.")
        elif atr_pct > 3:   parts.append(f"ATR {atr_pct:.1f}%/day — elevated volatility, size positions accordingly.")
        elif atr_pct < 1.5: parts.append(f"ATR {atr_pct:.1f}%/day — low volatility, conservative swing candidate.")
    if volume_ratio is not None:
        if volume_ratio >= 2.0:   parts.append(f"Volume {volume_ratio:.1f}x average — strong institutional activity.")
        elif volume_ratio >= 1.5: parts.append(f"Volume {volume_ratio:.1f}x average — notable breakout signal.")
    if relative_strength is not None:
        if relative_strength > 15:   parts.append(f"Outperforming SPY by {relative_strength:.1f}% over 20 days.")
        elif relative_strength < -15: parts.append(f"Underperforming SPY by {abs(relative_strength):.1f}% over 20 days.")
    if dividend_yield_pct and dividend_yield_pct > 3:
        parts.append(f"{dividend_yield_pct:.1f}% dividend yield supports income thesis.")
    return " ".join(parts) if parts else "No significant signals detected."

# ── Main scan function ────────────────────────────────────────────────────────

def scan_ticker(ticker: str, period_days: int = 120, debug: bool = False):
    """Scan one ticker: fetch → indicators → weighted score → categories → explanation."""
    debug_info = {'ticker': ticker, 'fetched_rows': 0, 'has_close': False, 'has_volume': False, 'exception': None}
    try:
        data = yf.download(ticker, period=f"{period_days}d", progress=False, auto_adjust=True)
        if data is None or data.empty:
            return ({'ticker': ticker, 'ok': False, 'error': 'no data', 'debug': debug_info} if debug else None)
        debug_info['fetched_rows'] = int(data.shape[0])
        close, high, low, volume = _extract_ohlcv(data)
        debug_info['has_close']  = close is not None and not getattr(close, 'empty', False)
        debug_info['has_volume'] = volume is not None and not getattr(volume, 'empty', False)
        if close is None or getattr(close, 'empty', True):
            return ({'ticker': ticker, 'ok': False, 'error': 'no close', 'debug': debug_info} if debug else None)

        price        = _last_numeric_value(close)
        rsi          = calculate_rsi(close)
        ma20, ma50   = calculate_moving_averages(close)
        volume_ratio = calculate_volume_ratio(volume)
        atr_info     = calculate_atr_info(high, low, close, price)
        atr_dollar   = atr_info['atr_dollar']
        atr_pct      = atr_info['atr_pct']
        vol_label    = atr_info['volatility_label']

        try:
            info        = yf.Ticker(ticker).info
            raw_yield   = info.get('dividendYield', 0)
            market_cap  = info.get('marketCap', None)
            implied_vol = info.get('impliedVolatility', None)
            if market_cap is not None:
                try: market_cap = float(market_cap)
                except: market_cap = None
        except Exception:
            raw_yield, market_cap, implied_vol = 0, None, None

        dividend_yield_pct = normalize_dividend_yield(raw_yield)
        stock_return       = calc_20d_return(close)
        spy_return         = get_spy_20d_return()
        relative_strength  = (round(stock_return - spy_return, 2)
                              if stock_return is not None and spy_return is not None else None)
        ma_conv            = detect_ma_convergence(close)
        ma_conv_label      = ma_conv['ma_convergence_label']

        expected_move_pct              = calculate_expected_move(atr_pct, implied_vol)
        action_zones                   = calculate_action_zones(price, ma20, ma50, atr_dollar)
        ma_distance_pct, ma_distance_label = calculate_ma_distance(price, ma20)
        risk_profile                   = assign_risk_profile(atr_pct, market_cap, dividend_yield_pct, rsi, price, ma20, ma50)
        bullish_score, risk_score, composite_score, reasons = calculate_weighted_score(
            rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, atr_pct, market_cap, relative_strength, ma_conv_label)
        categories  = assign_categories(rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, atr_pct,
                                        market_cap, relative_strength, ma_conv_label)
        explanation = generate_explanation(price, rsi, ma20, ma50, atr_pct, volume_ratio,
                                           ma_distance_pct, relative_strength, dividend_yield_pct)

        result = {
            'ticker': ticker,
            'price':  round(price, 2) if price is not None else None,
            'rsi':    round(rsi, 2) if rsi is not None else None,
            'ma20':   round(ma20, 2) if ma20 is not None else None,
            'ma50':   round(ma50, 2) if ma50 is not None else None,
            'volume_ratio':      round(volume_ratio, 2),
            'volatility':        atr_pct,
            'volatility_label':  vol_label,
            'volatility_20':     atr_pct,
            'atr_dollar':        atr_dollar,
            'atr_pct':           atr_pct,
            'expected_move_pct': expected_move_pct,
            'buy_zone_low':      action_zones['buy_zone_low'],
            'buy_zone_high':     action_zones['buy_zone_high'],
            'chase_zone':        action_zones['chase_zone'],
            'danger_zone':       action_zones['danger_zone'],
            'in_buy_zone':       action_zones['in_buy_zone'],
            'in_chase_zone':     action_zones['in_chase_zone'],
            'ma_distance_pct':   ma_distance_pct,
            'ma_distance_label': ma_distance_label,
            'dividend_yield':         dividend_yield_pct,
            'dividend_yield_percent': dividend_yield_pct,
            'market_cap':             int(market_cap) if market_cap is not None else None,
            'bullish_score':  bullish_score,
            'risk_score':     risk_score,
            'score':          composite_score,
            'categories':     categories,
            'reasons':        '; '.join(reasons),
            'explanation':    explanation,
            'risk_profile':   risk_profile,
            'relative_strength_20d':    relative_strength,
            'ma_spread_percent':        ma_conv['ma_spread_percent'],
            'ma_convergence_direction': ma_conv['ma_convergence_direction'],
            'ma_convergence_label':     ma_conv['ma_convergence_label'],
        }
        if debug: result['ok'] = True; result['debug'] = debug_info
        return result
    except Exception as e:
        logger.exception("scan_ticker failed for %s: %s", ticker, e)
        debug_info['exception'] = str(e)
        return ({'ticker': ticker, 'ok': False, 'error': str(e), 'debug': debug_info} if debug else None)

# Backward-compat shim
def calculate_score(rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct, vol,
                    relative_strength=None, ma_convergence_label=None):
    b, r, c, reasons = calculate_weighted_score(
        rsi, price, ma20, ma50, volume_ratio, dividend_yield_pct,
        vol, None, relative_strength, ma_convergence_label)
    return c, reasons
