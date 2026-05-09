import pandas as pd

def _ensure_series(series_like):
    # if DataFrame passed, pick first numeric column
    if isinstance(series_like, pd.DataFrame):
        numeric_cols = [c for c in series_like.columns if pd.api.types.is_numeric_dtype(series_like[c])]
        if numeric_cols:
            return series_like[numeric_cols[0]]
        # fallback to first column
        return series_like.iloc[:, 0]
    return series_like

def compute_rsi(series: pd.Series, period: int = 14):
    series = _ensure_series(series).astype(float)
    delta = series.diff()
    up = delta.clip(lower=0)
    down = -1 * delta.clip(upper=0)
    ma_up = up.ewm(com=(period - 1), adjust=False).mean()
    ma_down = down.ewm(com=(period - 1), adjust=False).mean()
    rs = ma_up / ma_down
    rsi = 100 - (100 / (1 + rs))
    return rsi

def moving_average(series: pd.Series, period: int):
    series = _ensure_series(series).astype(float)
    return series.rolling(window=period).mean()

def volatility(series: pd.Series, period: int = 20):
    series = _ensure_series(series).astype(float)
    return series.pct_change().rolling(window=period).std() * (252**0.5)
