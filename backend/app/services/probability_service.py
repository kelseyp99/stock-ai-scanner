import math
from datetime import datetime
from typing import Optional

import pandas as pd
import numpy as np
import yfinance as yf
import logging

logger = logging.getLogger(__name__)


def days_between(today: datetime, exp_date: datetime) -> float:
    delta = exp_date - today
    return max(delta.days, 0)


def expected_move(price: float, implied_vol: float, days_to_exp: float) -> float:
    """expected move = price * implied_vol * sqrt(days/365)"""
    return price * implied_vol * math.sqrt(max(days_to_exp, 1) / 365.0)


def std_from_iv(price: float, implied_vol: float, days_to_exp: float) -> float:
    """Return 1-sigma move in absolute price terms (approx using IV)."""
    return expected_move(price, implied_vol, days_to_exp)


def historical_volatility(ticker: str, days: int = 30) -> Optional[float]:
    """Compute annualized historical volatility using log returns (uses ~252 trading days).

    This implementation is more robust: it requests a larger history window, cleans NaNs,
    computes log returns using numpy/pandas, and returns annualized volatility. Returns None
    if not enough data or if computation fails.
    """
    try:
        # request a window larger than `days` to ensure enough trading days (use at least 90 days)
        window = max(days * 3, 90)
        tk = yf.Ticker(ticker)
        hist = tk.history(period=f"{window}d")
        if hist is None or hist.empty:
            logger.debug("historical_volatility: no history for %s", ticker)
            return None
        closes = hist['Close'].dropna().astype(float)
        if closes.shape[0] < 2:
            logger.debug("historical_volatility: not enough close data for %s", ticker)
            return None
        # take the last (days + 1) closes to compute 'days' returns; if not enough, use what we have
        closes = closes.tail(days + 1)
        if closes.shape[0] < 2:
            logger.debug("historical_volatility: not enough tail data for %s", ticker)
            return None
        # compute log returns
        returns = np.log(closes / closes.shift(1)).dropna()
        if returns.size == 0:
            logger.debug("historical_volatility: zero returns for %s", ticker)
            return None
        # sample standard deviation (ddof=1) then annualize using 252 trading days
        sigma = returns.std(ddof=1)
        if sigma is None or sigma == 0 or np.isnan(sigma):
            logger.debug("historical_volatility: sigma invalid for %s -> %s", ticker, sigma)
            return None
        annualized = float(sigma * math.sqrt(252.0))
        return annualized
    except Exception as e:
        logger.exception("historical_volatility failed for %s: %s", ticker, e)
        return None


# Black-Scholes / lognormal probability approximations
def _bs_z(price: float, strike: float, sigma: float, days_to_exp: float) -> float:
    """Compute the Z used in lognormal P(S_T > K) = 1 - Phi(z) with zero drift."""
    T = max(days_to_exp, 1) / 365.0
    if sigma is None or sigma <= 0 or price is None or strike is None:
        return float('nan')
    try:
        z = (math.log(strike / price) + 0.5 * sigma * sigma * T) / (sigma * math.sqrt(T))
        return z
    except Exception:
        return float('nan')


def prob_above_strike(price: float, strike: float, implied_vol: float, days_to_exp: float) -> float:
    """Probability price will be above strike at expiration using lognormal (Black-Scholes) approx."""
    if implied_vol is None or price is None or strike is None:
        return 0.0
    z = _bs_z(price, strike, implied_vol, days_to_exp)
    if math.isnan(z):
        return 0.0
    return 1.0 - _normal_cdf(z)


def prob_below_strike(price: float, strike: float, implied_vol: float, days_to_exp: float) -> float:
    if implied_vol is None or price is None or strike is None:
        return 0.0
    z = _bs_z(price, strike, implied_vol, days_to_exp)
    if math.isnan(z):
        return 0.0
    return _normal_cdf(z)


def prob_between(price: float, low: float, high: float, implied_vol: float, days_to_exp: float) -> float:
    if implied_vol is None or price is None or low is None or high is None:
        return 0.0
    z_low = _bs_z(price, low, implied_vol, days_to_exp)
    z_high = _bs_z(price, high, implied_vol, days_to_exp)
    if math.isnan(z_low) or math.isnan(z_high):
        return 0.0
    return max(0.0, _normal_cdf(z_high) - _normal_cdf(z_low))


# Normal CDF approximation (Abramowitz and Stegun)
def _normal_cdf(x: float) -> float:
    t = 1.0 / (1.0 + 0.2316419 * abs(x))
    d = 0.3989423 * math.exp(-x * x / 2.0)
    prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    if x > 0:
        return 1.0 - prob
    else:
        return prob
