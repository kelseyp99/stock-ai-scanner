import pandas as pd

def compute_rsi(series: pd.Series, period: int = 14):
    delta = series.diff()
    up = delta.clip(lower=0)
    down = -1 * delta.clip(upper=0)
    ma_up = up.ewm(com=(period - 1), adjust=False).mean()
    ma_down = down.ewm(com=(period - 1), adjust=False).mean()
    rs = ma_up / ma_down
    rsi = 100 - (100 / (1 + rs))
    return rsi

def moving_average(series: pd.Series, period: int):
    return series.rolling(window=period).mean()

def volatility(series: pd.Series, period: int = 20):
    return series.pct_change().rolling(window=period).std() * (252**0.5)
