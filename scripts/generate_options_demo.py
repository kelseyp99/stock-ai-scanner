"""
generate_options_demo.py

Fetches real option chain data from yfinance for all dashboard tickers
and writes the result to frontend/src/data/demoOptionsData.ts.

Run nightly via GitHub Actions to keep the demo data fresh.

Usage:
    python scripts/generate_options_demo.py
"""

import json
import math
import sys
import os
from datetime import datetime, timezone

import yfinance as yf

# ─── Tickers to fetch ────────────────────────────────────────────────────────
# All tickers that appear in demoScanResults.ts (dashboard demo data)
TICKERS = [
    'SPCE', 'INTC', 'AMD', 'GOOG', 'CSCO',
    'AAPL', 'F', 'RIVN', 'ZM', 'SHOP',
    'NFLX', 'TSLA', 'SPY', 'QQQ', 'MSFT',
    'AMZN', 'NVDA', 'META', 'BABA', 'BA',
]

MAX_EXPIRATIONS = 4   # how many expiry dates to include per ticker
MAX_STRIKES = 10      # max strikes per side (calls/puts) per expiry


def safe_float(val, default=None):
    """Return float or default if NaN / None."""
    if val is None:
        return default
    try:
        v = float(val)
        return default if math.isnan(v) or math.isinf(v) else round(v, 4)
    except (TypeError, ValueError):
        return default


def row_to_dict(row):
    fields = ['strike', 'lastPrice', 'bid', 'ask',
              'impliedVolatility', 'openInterest', 'volume']
    return {k: safe_float(row.get(k)) for k in fields}


def fetch_ticker(symbol):
    print(f"  Fetching {symbol}...", end=' ', flush=True)
    try:
        tk = yf.Ticker(symbol)
        info = tk.info or {}

        # current price
        price = safe_float(info.get('regularMarketPrice'))
        if price is None:
            hist = tk.history(period='2d')
            if not hist.empty:
                price = round(float(hist['Close'].iloc[-1]), 4)

        expirations = list(tk.options or [])[:MAX_EXPIRATIONS]
        chains = {}
        iv_atm = None

        for exp in expirations:
            try:
                oc = tk.option_chain(exp)
                calls_df = oc.calls.sort_values('strike')
                puts_df  = oc.puts.sort_values('strike')

                # Keep strikes near the money
                def near_money(df):
                    if price is None or df.empty:
                        return df.head(MAX_STRIKES)
                    df = df.copy()
                    df['_dist'] = (df['strike'] - price).abs()
                    df = df.sort_values('_dist').head(MAX_STRIKES).sort_values('strike')
                    return df

                calls = [row_to_dict(r) for r in near_money(calls_df).to_dict(orient='records')]
                puts  = [row_to_dict(r) for r in near_money(puts_df).to_dict(orient='records')]
                chains[exp] = {'calls': calls, 'puts': puts}

                # Estimate ATM IV from first expiration
                if iv_atm is None and price is not None:
                    best = None
                    for row in calls + puts:
                        strike = row.get('strike')
                        iv = row.get('impliedVolatility')
                        if strike is None or iv is None:
                            continue
                        dist = abs(strike - price)
                        if best is None or dist < best[0]:
                            best = (dist, iv)
                    if best:
                        iv_atm = best[1]
                        if iv_atm and iv_atm > 3:   # expressed as percent
                            iv_atm = iv_atm / 100.0

            except Exception as e:
                print(f"[warn] {symbol} {exp}: {e}")
                chains[exp] = {'calls': [], 'puts': []}

        # Historical volatility
        hv30 = hv90 = None
        try:
            hist = tk.history(period='6mo')
            if not hist.empty:
                rets = hist['Close'].pct_change().dropna()
                hv30 = round(float(rets.tail(30).std() * math.sqrt(252)), 4) if len(rets) >= 30 else None
                hv90 = round(float(rets.tail(90).std() * math.sqrt(252)), 4) if len(rets) >= 90 else None
        except Exception:
            pass

        print("✓")
        return {
            'ticker': symbol,
            'current_price': price,
            'iv_atm': round(iv_atm, 4) if iv_atm else None,
            'historical_volatility': {'hv30': hv30, 'hv90': hv90},
            'expirations': expirations,
            'chains': chains,
            # Simple strategy suggestions based on IV vs HV
            'strategies': build_strategies(symbol, price, iv_atm, hv30),
            'ai_summary': build_summary(symbol, price, iv_atm, hv30, hv90),
        }
    except Exception as e:
        print(f"✗ ERROR: {e}")
        return None


def build_strategies(symbol, price, iv, hv30):
    """Generate a few rule-based strategy suggestions."""
    strategies = []
    if price is None:
        return strategies

    p = round(price, 2)
    atm_call = round(p * 1.03, 0)   # ~3% OTM call
    atm_put  = round(p * 0.97, 0)   # ~3% OTM put
    wing_call = round(p * 1.07, 0)
    wing_put  = round(p * 0.93, 0)

    iv_rich = iv and hv30 and iv > hv30 * 1.15

    if iv_rich:
        strategies.append({
            'strategy': 'Iron Condor',
            'direction': 'neutral',
            'description': (f'Sell {atm_put}/{wing_put} put spread and '
                            f'{atm_call}/{wing_call} call spread. '
                            f'IV ({iv*100:.0f}%) above HV30 ({hv30*100:.0f}%) — '
                            f'premium selling has statistical edge.'),
            'score': 0.80,
        })
        strategies.append({
            'strategy': 'Covered Call',
            'direction': 'neutral/bullish',
            'description': f'Sell the {atm_call} call for income. IV elevated so premium is attractive.',
            'score': 0.74,
        })
        strategies.append({
            'strategy': 'Cash-Secured Put',
            'direction': 'bullish',
            'description': f'Sell the {atm_put} put. Collect elevated premium with obligation to buy {symbol} at ${atm_put}.',
            'score': 0.70,
        })
    else:
        strategies.append({
            'strategy': 'Bull Call Spread',
            'direction': 'bullish',
            'description': f'Buy {p} call / sell {atm_call} call. Defined risk bullish play with lower debit when IV is moderate.',
            'score': 0.72,
        })
        strategies.append({
            'strategy': 'Long Straddle',
            'direction': 'neutral (volatile)',
            'description': f'Buy ATM call and put at ~${p}. Profits from large move either direction. IV is not stretched so debit is fair.',
            'score': 0.65,
        })

    return strategies


def build_summary(symbol, price, iv, hv30, hv90):
    if iv is None or hv30 is None:
        return {'summary': f'{symbol}: option data fetched but volatility metrics unavailable.'}
    ratio = iv / hv30 if hv30 else 1
    if ratio > 1.2:
        bias = 'Options are richly priced (IV >> HV). Premium selling strategies — iron condors, covered calls — have a statistical edge.'
    elif ratio < 0.85:
        bias = 'Options look cheap (IV < HV). Long options or debit spreads may offer value.'
    else:
        bias = 'Options are fairly priced. Balanced strategy selection; match direction bias with a vertical spread.'
    return {
        'summary': (
            f'{symbol} @ ${price:.2f}. '
            f'ATM IV: {iv*100:.1f}% | HV30: {hv30*100:.1f}% | HV90: {(hv90*100 if hv90 else 0):.1f}%. '
            f'{bias}'
        )
    }


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_path = os.path.join(root, 'frontend', 'src', 'data', 'demoOptionsData.ts')

    print(f"Fetching option chains for {len(TICKERS)} tickers...")
    results = {}
    failed = []
    for symbol in TICKERS:
        data = fetch_ticker(symbol)
        if data:
            results[symbol] = data
        else:
            failed.append(symbol)

    if failed:
        print(f"\nFailed: {failed}")

    # Write TypeScript file
    generated_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    ts = f'// Auto-generated by scripts/generate_options_demo.py — {generated_at}\n'
    ts += '// DO NOT EDIT MANUALLY — run the script to regenerate.\n\n'
    ts += 'const demoOptions: Record<string, any> = '
    ts += json.dumps(results, indent=2, ensure_ascii=False)
    ts += '\n\nexport default demoOptions\n'

    with open(out_path, 'w') as f:
        f.write(ts)

    print(f"\n✅ Wrote {len(results)} tickers to {out_path}")
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
