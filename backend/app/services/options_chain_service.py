import logging
from typing import Dict, Any
import yfinance as yf

logger = logging.getLogger(__name__)


def get_options_chain(ticker: str, max_expirations: int = 5) -> Dict[str, Any]:
    """Fetch options chain data for a ticker using yfinance. Returns current price and a small set of expirations with calls/puts lists."""
    tk = yf.Ticker(ticker)
    # try to get current price safely
    info = tk.info or {}
    try:
        current_price = info.get('regularMarketPrice')
    except Exception:
        current_price = None
    if current_price is None:
        hist = tk.history(period='2d')
        if not hist.empty:
            current_price = float(hist['Close'].iloc[-1])
    expirations = list(tk.options or [])[:max_expirations]
    chains = {}
    iv_atm = None
    for exp in expirations:
        try:
            oc = tk.option_chain(exp)
            # convert to serializable dicts, take useful fields
            def row_to_dict(df_row):
                r = dict(df_row)
                # ensure numeric types
                for k in ('impliedVolatility', 'lastPrice', 'bid', 'ask', 'openInterest', 'volume', 'strike'):
                    if k in r and (r[k] is None or (isinstance(r[k], float) and (r[k] != r[k]))):
                        r[k] = None
                return r
            calls = [row_to_dict(r) for r in oc.calls.to_dict(orient='records')]
            puts = [row_to_dict(r) for r in oc.puts.to_dict(orient='records')]
            # attempt to set atm iv for first expiration
            # leave detailed ATM IV computation to after all expirations are collected
            chains[exp] = {'calls': calls, 'puts': puts}
        except Exception as e:
            logger.exception('Failed to fetch option chain for %s exp %s: %s', ticker, exp, e)
            chains[exp] = {'calls': [], 'puts': []}

    # compute ATM IV robustly from collected chains (search calls+puts, avg if both present)
    def _norm_iv(val):
        try:
            if val is None:
                return None
            v = float(val)
            # if iv appears expressed as percent > 3 (e.g., 103) convert to decimal
            if v > 3:
                return v / 100.0
            return v
        except Exception:
            return None
    if iv_atm is None:
        best = None
        # prefer first expiration but allow fallback across expirations
        for exp in expirations:
            ch = chains.get(exp, {})
            strike_map = {}
            for side in ('calls', 'puts'):
                for o in ch.get(side, []):
                    try:
                        s = float(o.get('strike'))
                    except Exception:
                        continue
                    iv_o = _norm_iv(o.get('impliedVolatility'))
                    if s not in strike_map:
                        strike_map[s] = [None, None]
                    if side == 'calls':
                        strike_map[s][0] = iv_o
                    else:
                        strike_map[s][1] = iv_o
            # find nearest strike in this expiration
            for s, (call_iv, put_iv) in strike_map.items():
                try:
                    diff = abs(s - float(current_price or 0))
                except Exception:
                    continue
                chosen = None
                if call_iv is not None and put_iv is not None:
                    chosen = (call_iv + put_iv) / 2.0
                else:
                    chosen = call_iv or put_iv
                if chosen is None:
                    continue
                if best is None or diff < best[0]:
                    best = (diff, chosen)
            if best and best[1] is not None:
                iv_atm = best[1]
                break

    # compute historical volatility (uses yfinance price history)
    hv30 = None
    hv90 = None
    try:
        from .probability_service import historical_volatility
        hv30 = historical_volatility(ticker, days=30)
        hv90 = historical_volatility(ticker, days=90)
    except Exception:
        hv30 = None
        hv90 = None

    return {
        'ticker': ticker,
        'current_price': current_price,
        'expirations': expirations,
        'chains': chains,
        'iv_atm': iv_atm,
        'historical_volatility': {'hv30': hv30, 'hv90': hv90},
    }
