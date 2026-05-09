import math
from datetime import datetime
from typing import Optional, Tuple


def days_between(today: datetime, exp_date: datetime) -> float:
    delta = exp_date - today
    return max(delta.days, 0)


def expected_move(price: float, implied_vol: float, days_to_exp: float) -> float:
    """expected move = price * implied_vol * sqrt(days/365)"""
    return price * implied_vol * math.sqrt(max(days_to_exp, 1) / 365.0)


def std_from_iv(price: float, implied_vol: float, days_to_exp: float) -> float:
    """Return 1-sigma move in absolute price terms."""
    return expected_move(price, implied_vol, days_to_exp)


def prob_above_strike(price: float, strike: float, implied_vol: float, days_to_exp: float) -> float:
    """Probability price will be above strike at expiration using normal approx centered at current price."""
    if implied_vol is None or price is None:
        return 0.0
    sigma = std_from_iv(price, implied_vol, days_to_exp)
    if sigma <= 0:
        return 0.0
    # compute z for (strike - price) / sigma
    z = (strike - price) / sigma
    # use normal cdf (1 - Phi(z)) for above
    return 1.0 - _normal_cdf(z)


def prob_below_strike(price: float, strike: float, implied_vol: float, days_to_exp: float) -> float:
    if implied_vol is None or price is None:
        return 0.0
    sigma = std_from_iv(price, implied_vol, days_to_exp)
    if sigma <= 0:
        return 0.0
    z = (strike - price) / sigma
    return _normal_cdf(z)


def prob_between(price: float, low: float, high: float, implied_vol: float, days_to_exp: float) -> float:
    if implied_vol is None or price is None:
        return 0.0
    sigma = std_from_iv(price, implied_vol, days_to_exp)
    if sigma <= 0:
        return 0.0
    z1 = (low - price) / sigma
    z2 = (high - price) / sigma
    return _normal_cdf(z2) - _normal_cdf(z1)


# Normal CDF approximation
def _normal_cdf(x: float) -> float:
    # Abramowitz and Stegun approximation
    t = 1.0 / (1.0 + 0.2316419 * abs(x))
    d = 0.3989423 * math.exp(-x * x / 2.0)
    prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    if x > 0:
        return 1.0 - prob
    else:
        return prob
