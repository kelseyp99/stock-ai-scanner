import logging
from typing import List, Dict, Any
from datetime import datetime
from math import isfinite

from .probability_service import expected_move, prob_between, prob_above_strike, prob_below_strike, historical_volatility

logger = logging.getLogger(__name__)


def suggest_strategies(chain_data: Dict[str, Any], max_strikes_to_consider: int = 10) -> List[Dict[str, Any]]:
    """Suggest candidate option strategies for a single ticker based on IV, price, and probability metrics.
    Returns a list of strategy dicts with summary metrics.
    """
    price = chain_data.get('current_price')
    expirations = chain_data.get('expirations', [])
    chains = chain_data.get('chains', {})
    out = []
    today = datetime.utcnow()

    def _find_option_by_strike(options: list, strike: float) -> dict | None:
        if not options:
            return None
        for o in options:
            if o.get('strike') == strike:
                return o
        # fallback to nearest
        return min(options, key=lambda x: abs((x.get('strike') or 0) - strike))

    def _mid_price(opt: dict) -> float | None:
        if not opt:
            return None
        bid = opt.get('bid')
        ask = opt.get('ask')
        last = opt.get('lastPrice')
        if bid is not None and ask is not None and isfinite(bid) and isfinite(ask):
            return (bid + ask) / 2.0
        if last is not None and isfinite(last):
            return float(last)
        return None

    for exp in expirations:
        calls = chains.get(exp, {}).get('calls', [])
        puts = chains.get(exp, {}).get('puts', [])
        if not calls and not puts:
            continue
        # parse expiration date
        try:
            exp_dt = datetime.fromisoformat(exp)
        except Exception:
            # fallback, skip
            continue
        days = max((exp_dt - today).days, 0)
        # estimate iv from ATM call/put midpoint
        atm_iv = None
        if calls:
            # find strike nearest to price
            calls_sorted = sorted(calls, key=lambda c: abs((c.get('strike') or 0) - (price or 0)))
            if calls_sorted:
                atm_iv = calls_sorted[0].get('impliedVolatility') or calls_sorted[0].get('iv')
        if atm_iv is None and puts:
            puts_sorted = sorted(puts, key=lambda p: abs((p.get('strike') or 0) - (price or 0)))
            if puts_sorted:
                atm_iv = puts_sorted[0].get('impliedVolatility') or puts_sorted[0].get('iv')
        if atm_iv is None:
            continue

        hv30 = historical_volatility(chain_data.get('ticker'), days=30)
        iv_hv_ratio = (atm_iv / hv30) if hv30 and atm_iv else None
        emove = expected_move(price, atm_iv, days)

        # find strikes near price
        nearby_calls = sorted([c for c in calls if abs(c.get('strike') - price) < emove * 3], key=lambda x: abs(x.get('strike') - price))[:max_strikes_to_consider]
        nearby_puts = sorted([p for p in puts if abs(p.get('strike') - price) < emove * 3], key=lambda x: abs(x.get('strike') - price))[:max_strikes_to_consider]

        # Suggest basic strategies
        # 1) Covered call (if price and long underlying assumed)
        if price and nearby_calls:
            strike = round(nearby_calls[0].get('strike'))
            prob_itm = prob_above_strike(price, strike, atm_iv, days)
            opt = _find_option_by_strike(calls, strike)
            premium = _mid_price(opt) or 0.0
            breakeven = price - premium  # assuming underlying bought at current price
            max_profit_numeric = max(0.0, (strike - price) + premium)
            max_loss_numeric = None  # effectively large; report as None
            roi = None
            if max_loss_numeric is None:
                roi = None
            out.append({
                'strategy': 'covered_call',
                'exp': exp,
                'description': f'Sell an OTM call near {strike} with probability of being ITM {prob_itm:.2f}',
                'probability_itm': prob_itm,
                'premium': premium,
                'breakeven': breakeven,
                'max_profit': max_profit_numeric,
                'max_loss': None,
                'direction': 'neutral-to-bullish',
                'strikes': {'sell_call': strike},
                'score': prob_between(price, price - emove, price + emove, atm_iv, days),
                'metrics': {'iv': atm_iv, 'hv30': hv30, 'iv_hv_ratio': iv_hv_ratio}
            })

        # 2) Cash secured put
        if price and nearby_puts:
            strike = round(nearby_puts[0].get('strike'))
            prob_otm = prob_below_strike(price, strike, atm_iv, days)
            opt = _find_option_by_strike(puts, strike)
            premium = _mid_price(opt) or 0.0
            breakeven = strike - premium
            max_profit_numeric = premium
            max_loss_numeric = max(0.0, strike - premium)
            roi = None
            if max_loss_numeric and max_loss_numeric > 0:
                roi = (max_profit_numeric / max_loss_numeric) if max_loss_numeric else None
            out.append({
                'strategy': 'cash_secured_put',
                'exp': exp,
                'description': f'Sell a put near {strike} to collect premium with probability OTM {prob_otm:.2f}',
                'probability_otm': prob_otm,
                'premium': premium,
                'breakeven': breakeven,
                'max_profit': max_profit_numeric,
                'max_loss': max_loss_numeric,
                'direction': 'bullish',
                'strikes': {'sell_put': strike},
                'score': prob_between(price, price - emove, price + emove, atm_iv, days),
                'metrics': {'iv': atm_iv, 'hv30': hv30, 'iv_hv_ratio': iv_hv_ratio}
            })

        # 3) Long straddle (if IV low and expected move high)
        if price and atm_iv < 0.6 and emove > price * 0.05:
            # choose ATM strike
            atm_strike = round(price)
            call_opt = _find_option_by_strike(calls, atm_strike)
            put_opt = _find_option_by_strike(puts, atm_strike)
            call_p = _mid_price(call_opt) or 0.0
            put_p = _mid_price(put_opt) or 0.0
            total_premium = call_p + put_p
            breakeven_low = atm_strike - total_premium
            breakeven_high = atm_strike + total_premium
            prob_between_range = prob_between(price, atm_strike - emove, atm_strike + emove, atm_iv, days)
            out.append({
                'strategy': 'long_straddle',
                'exp': exp,
                'description': f'Buy ATM straddle at {atm_strike}, probability to be within expected move {prob_between_range:.2f}',
                'probability_in_range': prob_between_range,
                'premium': total_premium,
                'breakeven': {'low': breakeven_low, 'high': breakeven_high},
                'max_profit': None,
                'max_loss': total_premium,
                'direction': 'volatility play',
                'strikes': {'call': atm_strike, 'put': atm_strike},
                'score': prob_between_range,
                'metrics': {'iv': atm_iv, 'hv30': hv30, 'iv_hv_ratio': iv_hv_ratio}
            })

        # 4) Iron condor for neutral outlook if IV moderate
        if price and atm_iv > 0.2 and atm_iv < 0.8:
            width = max(1, int(emove))
            lower_put = round(price - emove)
            upper_call = round(price + emove)
            # find option premiums
            sell_put_opt = _find_option_by_strike(puts, lower_put)
            buy_put_opt = _find_option_by_strike(puts, lower_put - width)
            sell_call_opt = _find_option_by_strike(calls, upper_call)
            buy_call_opt = _find_option_by_strike(calls, upper_call + width)
            sell_put_p = _mid_price(sell_put_opt) or 0.0
            buy_put_p = _mid_price(buy_put_opt) or 0.0
            sell_call_p = _mid_price(sell_call_opt) or 0.0
            buy_call_p = _mid_price(buy_call_opt) or 0.0
            net_credit = (sell_put_p + sell_call_p) - (buy_put_p + buy_call_p)
            max_loss_numeric = width - net_credit if width > net_credit else None
            out.append({
                'strategy': 'iron_condor',
                'exp': exp,
                'description': f'Iron condor between {lower_put} and {upper_call} to collect premium in neutral market',
                'probability_in_range': prob_between(price, lower_put, upper_call, atm_iv, days),
                'premium': net_credit,
                'max_profit': net_credit,
                'max_loss': max_loss_numeric,
                'breakeven': {'low': lower_put - net_credit, 'high': upper_call + net_credit},
                'direction': 'neutral',
                'strikes': {'sell_put': lower_put, 'buy_put': lower_put - width, 'sell_call': upper_call, 'buy_call': upper_call + width},
                'score': prob_between(price, lower_put, upper_call, atm_iv, days),
                'metrics': {'iv': atm_iv, 'hv30': hv30, 'iv_hv_ratio': iv_hv_ratio}
            })

    # sort by score desc
    out = sorted(out, key=lambda x: -(x.get('score') or 0))
    return out
