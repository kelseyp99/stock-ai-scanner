import logging
from typing import List, Dict, Any
from datetime import datetime

from .probability_service import expected_move, prob_between, prob_above_strike, prob_below_strike

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
        emove = expected_move(price, atm_iv, days)

        # find strikes near price
        nearby_calls = sorted([c for c in calls if abs(c.get('strike') - price) < emove * 3], key=lambda x: abs(x.get('strike') - price))[:max_strikes_to_consider]
        nearby_puts = sorted([p for p in puts if abs(p.get('strike') - price) < emove * 3], key=lambda x: abs(x.get('strike') - price))[:max_strikes_to_consider]

        # Suggest basic strategies
        # 1) Covered call (if price and long underlying assumed)
        if price and nearby_calls:
            strike = round(nearby_calls[0].get('strike'))
            prob_itm = prob_above_strike(price, strike, atm_iv, days)
            out.append({
                'strategy': 'covered_call',
                'exp': exp,
                'description': f'Sell an OTM call near {strike} with probability of being ITM {prob_itm:.2f}',
                'probability_itm': prob_itm,
                'max_profit': 'premium',
                'max_loss': 'unlimited minus underlying',
                'direction': 'neutral-to-bullish',
                'strikes': {'sell_call': strike},
                'score': prob_between(price, price - emove, price + emove, atm_iv, days),
            })

        # 2) Cash secured put
        if price and nearby_puts:
            strike = round(nearby_puts[0].get('strike'))
            prob_otm = prob_below_strike(price, strike, atm_iv, days)
            out.append({
                'strategy': 'cash_secured_put',
                'exp': exp,
                'description': f'Sell a put near {strike} to collect premium with probability OTM {prob_otm:.2f}',
                'probability_otm': prob_otm,
                'max_profit': 'premium',
                'max_loss': 'strike minus underlying',
                'direction': 'bullish',
                'strikes': {'sell_put': strike},
                'score': prob_between(price, price - emove, price + emove, atm_iv, days),
            })

        # 3) Long straddle (if IV low and expected move high)
        if price and atm_iv < 0.6 and emove > price * 0.05:
            # choose ATM strike
            atm_strike = round(price)
            prob_between_range = prob_between(price, atm_strike - emove, atm_strike + emove, atm_iv, days)
            out.append({
                'strategy': 'long_straddle',
                'exp': exp,
                'description': f'Buy ATM straddle at {atm_strike}, probability to be within expected move {prob_between_range:.2f}',
                'probability_in_range': prob_between_range,
                'max_profit': 'theoretically unlimited',
                'max_loss': 'premium paid',
                'direction': 'volatility play',
                'strikes': {'call': atm_strike, 'put': atm_strike},
                'score': prob_between_range,
            })

        # 4) Iron condor for neutral outlook if IV moderate
        if price and atm_iv > 0.2 and atm_iv < 0.8:
            width = max(1, int(emove))
            lower_put = round(price - emove)
            upper_call = round(price + emove)
            out.append({
                'strategy': 'iron_condor',
                'exp': exp,
                'description': f'Iron condor between {lower_put} and {upper_call} to collect premium in neutral market',
                'probability_in_range': prob_between(price, lower_put, upper_call, atm_iv, days),
                'max_profit': 'premium collected',
                'max_loss': 'width of wings minus premium',
                'direction': 'neutral',
                'strikes': {'sell_put': lower_put, 'buy_put': lower_put - width, 'sell_call': upper_call, 'buy_call': upper_call + width},
                'score': prob_between(price, lower_put, upper_call, atm_iv, days)
            })

    # sort by score desc
    out = sorted(out, key=lambda x: -(x.get('score') or 0))
    return out
