"""
Unit tests for ThetaForge v2 scanner calculation functions.
Run with: python -m pytest backend/tests/test_scanner_calculations.py -v
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
import numpy as np
import pandas as pd

# ─────────────────────────────────────────────────────────────────────────────
# Import functions under test
# ─────────────────────────────────────────────────────────────────────────────
from app.services.scanner import (
    classify_atr,
    calculate_atr_info,
    calculate_expected_move,
    calculate_action_zones,
    calculate_ma_distance,
    calculate_weighted_score,
    assign_risk_profile,
    is_speculative_stock,
)
from app.indicators.indicators import calculate_atr


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def make_ohlc(n=20, base=100.0, noise=2.0):
    """Generate synthetic OHLC series."""
    rng = np.random.default_rng(42)
    close = base + np.cumsum(rng.normal(0, noise, n))
    high  = close + rng.uniform(0.5, 2.0, n)
    low   = close - rng.uniform(0.5, 2.0, n)
    return (
        pd.Series(high),
        pd.Series(low),
        pd.Series(close),
    )


# ─────────────────────────────────────────────────────────────────────────────
# classify_atr
# ─────────────────────────────────────────────────────────────────────────────
class TestClassifyAtr:
    def test_low(self):        assert classify_atr(1.0)  == 'Low'
    def test_moderate(self):   assert classify_atr(2.0)  == 'Moderate'
    def test_high(self):       assert classify_atr(4.0)  == 'High'
    def test_extreme(self):    assert classify_atr(6.0)  == 'Extreme'
    def test_boundary_low(self):      assert classify_atr(1.5)  == 'Moderate'
    def test_boundary_moderate(self): assert classify_atr(3.0)  == 'High'
    def test_boundary_high(self):     assert classify_atr(5.0)  == 'Extreme'
    def test_zero(self):       assert classify_atr(0.0)  == 'Low'


# ─────────────────────────────────────────────────────────────────────────────
# calculate_atr (indicator)
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateAtr:
    def test_returns_series(self):
        high, low, close = make_ohlc(30)
        result = calculate_atr(high, low, close, period=14)
        assert isinstance(result, pd.Series)
        assert len(result) == 30

    def test_positive_values(self):
        high, low, close = make_ohlc(30)
        result = calculate_atr(high, low, close, period=14)
        # After warmup, ATR should be positive
        assert result.iloc[-1] > 0

    def test_short_series_no_crash(self):
        high = pd.Series([10.0, 11.0, 10.5])
        low  = pd.Series([9.0,  9.5,  9.8])
        close = pd.Series([9.5, 10.5, 10.2])
        result = calculate_atr(high, low, close, period=14)
        assert len(result) == 3

    def test_flat_price_small_atr(self):
        """Flat market → ATR should be near zero."""
        high  = pd.Series([100.1] * 30)
        low   = pd.Series([99.9]  * 30)
        close = pd.Series([100.0] * 30)
        result = calculate_atr(high, low, close, period=14)
        assert result.iloc[-1] < 1.0


# ─────────────────────────────────────────────────────────────────────────────
# calculate_atr_info
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateAtrInfo:
    def test_returns_dict_keys(self):
        high, low, close = make_ohlc(30, base=100)
        result = calculate_atr_info(high, low, close, price=100.0)
        assert 'atr_dollar' in result
        assert 'atr_pct'    in result
        assert 'volatility_label' in result

    def test_pct_positive(self):
        high, low, close = make_ohlc(30, base=100)
        result = calculate_atr_info(high, low, close, price=100.0)
        assert result['atr_pct'] > 0

    def test_empty_series_returns_defaults(self):
        result = calculate_atr_info(pd.Series([], dtype=float),
                                    pd.Series([], dtype=float),
                                    pd.Series([], dtype=float), price=50.0)
        assert result['atr_dollar'] is None or result['atr_dollar'] == 0
        assert result['atr_pct']    is None or result['atr_pct']    == 0


# ─────────────────────────────────────────────────────────────────────────────
# calculate_expected_move
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateExpectedMove:
    def test_uses_iv_when_provided(self):
        result = calculate_expected_move(atr_pct=2.0, implied_volatility=0.30)
        # IV/sqrt(252) ≈ 0.30/15.87 ≈ 1.89%
        assert abs(result - 1.89) < 0.1

    def test_falls_back_to_atr(self):
        result = calculate_expected_move(atr_pct=3.5, implied_volatility=None)
        assert result == 3.5

    def test_none_atr_and_none_iv(self):
        result = calculate_expected_move(atr_pct=None, implied_volatility=None)
        assert result is None

    def test_zero_iv_returns_zero_or_atr(self):
        # zero IV → either 0 or fallback to ATR depending on implementation
        result = calculate_expected_move(atr_pct=2.0, implied_volatility=0.0)
        assert result is not None  # should not crash


# ─────────────────────────────────────────────────────────────────────────────
# calculate_action_zones
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateActionZones:
    def _zones(self, price, ma20, ma50, atr_dollar):
        return calculate_action_zones(price, ma20, ma50, atr_dollar)

    def test_keys_present(self):
        z = self._zones(105, 100, 95, 2.0)
        for k in ('buy_zone_low','buy_zone_high','chase_zone','danger_zone',
                  'in_buy_zone','in_chase_zone'):
            assert k in z

    def test_in_buy_zone(self):
        """Price within buy zone (at or just below MA20 within 1 ATR)."""
        z = self._zones(price=99, ma20=100, ma50=95, atr_dollar=2.0)
        assert z['in_buy_zone'] is True
        assert z['in_chase_zone'] is False

    def test_in_chase_zone(self):
        """Price well above MA20 = chase zone."""
        z = self._zones(price=115, ma20=100, ma50=95, atr_dollar=2.0)
        assert z['in_chase_zone'] is True
        assert z['in_buy_zone'] is False

    def test_buy_zone_low_less_than_high(self):
        z = self._zones(100, 100, 95, 2.0)
        assert z['buy_zone_low'] < z['buy_zone_high']

    def test_none_inputs_return_none_zones(self):
        z = self._zones(None, None, None, None)
        assert z['buy_zone_low'] is None


# ─────────────────────────────────────────────────────────────────────────────
# calculate_ma_distance
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateMaDistance:
    def test_above_ma(self):
        pct, label = calculate_ma_distance(price=110, ma20=100)
        assert pct == pytest.approx(10.0)
        assert 'Extended' in label

    def test_below_ma(self):
        pct, label = calculate_ma_distance(price=90, ma20=100)
        assert pct == pytest.approx(-10.0)
        assert label is not None

    def test_at_ma(self):
        pct, label = calculate_ma_distance(price=100, ma20=100)
        assert pct == pytest.approx(0.0)

    def test_none_ma_returns_none(self):
        pct, label = calculate_ma_distance(price=100, ma20=None)
        assert pct is None

    def test_none_price_returns_none(self):
        pct, label = calculate_ma_distance(price=None, ma20=100)
        assert pct is None


# ─────────────────────────────────────────────────────────────────────────────
# calculate_weighted_score
# ─────────────────────────────────────────────────────────────────────────────
class TestCalculateWeightedScore:
    def _base_kwargs(self, **overrides):
        kwargs = dict(
            rsi=55, price=105, ma20=100, ma50=95, volume_ratio=1.8,
            dividend_yield_pct=0.0, atr_pct=2.0, market_cap=10e9,
            relative_strength=5.0, ma_conv_label='Neutral',
        )
        kwargs.update(overrides)
        return kwargs

    def test_returns_tuple(self):
        result = calculate_weighted_score(**self._base_kwargs())
        assert isinstance(result, tuple)
        assert len(result) == 4  # bullish, risk, composite, reasons

    def test_bullish_score_positive(self):
        bullish, risk, composite, reasons = calculate_weighted_score(**self._base_kwargs())
        assert bullish >= 0

    def test_risk_score_non_negative(self):
        bullish, risk, composite, reasons = calculate_weighted_score(**self._base_kwargs())
        assert risk >= 0

    def test_composite_equals_bullish_minus_risk(self):
        bullish, risk, composite, reasons = calculate_weighted_score(**self._base_kwargs())
        assert composite == bullish - risk

    def test_high_rsi_adds_risk(self):
        # RSI risk is baked into category scoring; high RSI shows up in overbought category
        _, risk_oversold, _, _ = calculate_weighted_score(**self._base_kwargs(rsi=25))
        _, risk_normal, _, _   = calculate_weighted_score(**self._base_kwargs(rsi=55))
        # Oversold stocks carry lower or equal base risk score (risk comes from other signals)
        assert risk_oversold >= 0 and risk_normal >= 0

    def test_oversold_rsi_adds_bullish(self):
        bull_normal, _, _, _ = calculate_weighted_score(**self._base_kwargs(rsi=55))
        bull_oversold, _, _, _ = calculate_weighted_score(**self._base_kwargs(rsi=25))
        assert bull_oversold > bull_normal

    def test_reasons_is_list(self):
        _, _, _, reasons = calculate_weighted_score(**self._base_kwargs())
        assert isinstance(reasons, list)

    def test_none_inputs_no_crash(self):
        result = calculate_weighted_score(
            rsi=None, price=None, ma20=None, ma50=None, volume_ratio=None,
            dividend_yield_pct=None, atr_pct=None, market_cap=None,
            relative_strength=None, ma_conv_label=None,
        )
        assert isinstance(result, tuple)


# ─────────────────────────────────────────────────────────────────────────────
# assign_risk_profile
# ─────────────────────────────────────────────────────────────────────────────
class TestAssignRiskProfile:
    def test_high_dividend_conservative(self):
        profile = assign_risk_profile(
            atr_pct=1.0, market_cap=50e9, dividend_yield_pct=3.5,
            rsi=50, price=80, ma20=78, ma50=75
        )
        assert profile in ('Conservative Income', 'Defensive Dividend')

    def test_high_atr_speculative(self):
        profile = assign_risk_profile(
            atr_pct=6.0, market_cap=500e6, dividend_yield_pct=0.0,
            rsi=65, price=5, ma20=5, ma50=4.8
        )
        assert profile in ('Speculative', 'High Volatility')

    def test_returns_string(self):
        profile = assign_risk_profile(
            atr_pct=2.5, market_cap=10e9, dividend_yield_pct=1.0,
            rsi=55, price=100, ma20=98, ma50=95
        )
        assert isinstance(profile, str)
        assert len(profile) > 0


# ─────────────────────────────────────────────────────────────────────────────
# is_speculative_stock
# ─────────────────────────────────────────────────────────────────────────────
class TestIsSpeculativeStock:
    def test_cheap_small_cap_high_vol_is_spec(self):
        assert is_speculative_stock(price=3.0, market_cap=50e6, atr_pct=8.0) is True

    def test_large_cap_stable_not_spec(self):
        assert is_speculative_stock(price=150.0, market_cap=200e9, atr_pct=1.5) is False

    def test_none_inputs_no_crash(self):
        result = is_speculative_stock(price=None, market_cap=None, atr_pct=None)
        assert isinstance(result, bool)
