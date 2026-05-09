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
    for exp in expirations:
        try:
            oc = tk.option_chain(exp)
            # convert to serializable dicts, take useful fields
            def row_to_dict(df_row):
                r = dict(df_row)
                # ensure numeric types
                for k in ('impliedVolatility', 'lastPrice', 'bid', 'ask', 'openInterest', 'volume'):
                    if k in r and (r[k] is None or (isinstance(r[k], float) and (r[k] != r[k]))):
                        r[k] = None
                return r
            calls = [row_to_dict(r) for r in oc.calls.to_dict(orient='records')]
            puts = [row_to_dict(r) for r in oc.puts.to_dict(orient='records')]
            chains[exp] = {'calls': calls, 'puts': puts}
        except Exception as e:
            logger.exception('Failed to fetch option chain for %s exp %s: %s', ticker, exp, e)
            chains[exp] = {'calls': [], 'puts': []}
    return {'ticker': ticker, 'current_price': current_price, 'expirations': expirations, 'chains': chains}
