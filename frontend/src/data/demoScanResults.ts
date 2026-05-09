const demo = {
  total_scanned: 20,
  summary: "Static demo scan shows 20 tickers scanned across momentum, volatility, dividend, and breakout themes. Top names include SPCE, INTC, AMD, and CSCO. The strongest signals are momentum and extreme volatility, while a few dividend and oversold candidates add balance.",
  top_ranked: [
    {
      ticker: 'SPCE', price: 2.94, rsi: 58.13, ma20: 2.7, ma50: 2.62,
      volume_ratio: 1.96, volatility: 1.0154, volatility_label: 'Extreme', dividend_yield_percent: 0,
      score: 6, categories: ['Breakout Volume', 'Extreme Volatility', 'Momentum'],
      reasons: 'Price above MA20 and MA50; Volume 1.96x 20-day avg (breakout); Extreme volatility (1.0154)',
      relative_strength_20d: 18.5,
      ma_spread_percent: 2.90,
      ma_convergence_label: 'Bullish Crossover Setup',
      ma_convergence_direction: 'converging'
    },
    {
      ticker: 'INTC', price: 124.92, rsi: 85.07, ma20: 84.37, ma50: 62.11,
      volume_ratio: 1.5, volatility: 1.1221, volatility_label: 'Extreme', dividend_yield_percent: 0,
      score: 5, categories: ['Momentum', 'Extreme Volatility', 'Market Leader'],
      reasons: 'RSI above 65 (momentum); Price above MA20 and MA50; Extreme volatility (1.1221)',
      relative_strength_20d: 12.3,
      ma_spread_percent: 36.0,
      ma_convergence_label: 'MA Spread Wide'
    },
    {
      ticker: 'AMD', price: 455.19, rsi: 80.78, ma20: 326.23, ma50: 254.51,
      volume_ratio: 1.22, volatility: 0.9713, volatility_label: 'Extreme', dividend_yield_percent: 0,
      score: 5, categories: ['Momentum', 'Extreme Volatility'],
      reasons: 'Strong trend above MA20/MA50; Elevated volatility suggests momentum continuation',
      relative_strength_20d: 14.7,
      ma_spread_percent: 28.1,
      ma_convergence_label: 'MA Spread Wide'
    },
    {
      ticker: 'GOOG', price: 397.05, rsi: 83.28, ma20: 355.00, ma50: 322.07,
      volume_ratio: 0.73, volatility: 0.3911, volatility_label: 'High', dividend_yield_percent: 0,
      score: 4, categories: ['Momentum'],
      reasons: 'Strong uptrend with elevated RSI; watch for continuation or pullback',
      relative_strength_20d: 9.8,
      ma_spread_percent: 10.1,
      ma_convergence_label: 'MA Spread Wide'
    },
    {
      ticker: 'CSCO', price: 96.57, rsi: 72.61, ma20: 88.91, ma50: 83.02,
      volume_ratio: 1.37, volatility: 0.2837, volatility_label: 'Moderate', dividend_yield_percent: 1.82,
      score: 4, categories: ['Momentum', 'Dividend'],
      reasons: 'RSI above 65; Price above both moving averages; Dividend yield > 1.8%',
      relative_strength_20d: 5.9,
      ma_spread_percent: 6.9,
      ma_convergence_label: 'MA Spread Wide'
    },
    {
      ticker: 'AAPL', price: 293.32, rsi: 72.93, ma20: 273.21, ma50: 262.80,
      volume_ratio: 0.94, volatility: 0.2634, volatility_label: 'Moderate', dividend_yield_percent: 0.63,
      score: 4, categories: ['Momentum', 'Dividend'],
      reasons: 'Bullish trend above MA20 and MA50; steady dividend yield; moderate volatility',
      relative_strength_20d: 6.5,
      ma_spread_percent: 4.7,
      ma_convergence_label: 'MA Spread Wide'
    },
    {
      ticker: 'F', price: 12.32, rsi: 52.30, ma20: 12.35, ma50: 12.15,
      volume_ratio: 0.81, volatility: 0.3243, volatility_label: 'Moderate', dividend_yield_percent: 4.93,
      score: 3, categories: ['Dividend'],
      reasons: 'Dividend yield > 3%; Value-style setup with a steady volume profile',
      relative_strength_20d: -2.1,
      ma_spread_percent: 1.6,
      ma_convergence_label: 'MA Converging',
      ma_convergence_direction: 'converging'
    },
    {
      ticker: 'RIVN', price: 14.22, rsi: 36.50, ma20: 16.0, ma50: 15.62,
      volume_ratio: 1.15, volatility: 0.4827, volatility_label: 'High', dividend_yield_percent: 0,
      score: 3, categories: ['Oversold', 'High Volatility', 'Speculative / High Risk'],
      reasons: 'RSI below 35; elevated volatility; risk of further weakness if the trend does not hold',
      relative_strength_20d: -12.9,
      ma_spread_percent: -8.9,
      ma_convergence_label: 'Bearish Crossover Risk',
      ma_convergence_direction: 'converging'
    },
    {
      ticker: 'SPCE', price: 2.94, rsi: 58.13, ma20: 2.7, ma50: 2.62,
      volume_ratio: 1.96, volatility: 1.0154, volatility_label: 'Extreme', dividend_yield_percent: 0,
      score: 6, categories: ['Breakout Volume', 'Extreme Volatility', 'Momentum'],
      reasons: 'Price above MA20 and MA50; Volume 1.96x 20-day avg (breakout); Extreme volatility (1.0154)',
      relative_strength_20d: 22.4,
      ma_spread_percent: 12.8,
      ma_convergence_label: 'Bullish Crossover Setup',
      ma_convergence_direction: 'converging'
    },
    {
      ticker: 'ZM', price: 109.21, rsi: 74.64, ma20: 95.06, ma50: 84.76,
      volume_ratio: 0.79, volatility: 0.4724, volatility_label: 'High', dividend_yield_percent: 0,
      score: 4, categories: ['Momentum', 'High Volatility'],
      reasons: 'RSI above 65 and strong trend; high volatility elevates both opportunity and risk',
      relative_strength_20d: 10.2,
      ma_spread_percent: 12.2,
      ma_convergence_label: 'MA Spread Wide'
    },
    {
      ticker: 'SHOP', price: 110.41, rsi: 40.71, ma20: 122.28, ma50: 121.80,
      volume_ratio: 1.30, volatility: 0.7924, volatility_label: 'Extreme', dividend_yield_percent: 0,
      score: 3, categories: ['High Volatility', 'Pullback Risk'],
      reasons: 'Price below both MAs; strong volume run but volatility is extreme, suggesting a pullback risk',
      relative_strength_20d: -6.7,
      ma_spread_percent: -9.6,
      ma_convergence_label: 'Bearish Crossover Risk',
      ma_convergence_direction: 'converging'
    },
    {
      ticker: 'NFLX', price: 520.11, rsi: 65.48, ma20: 502.18, ma50: 483.90,
      volume_ratio: 1.12, volatility: 0.4120, volatility_label: 'High', dividend_yield_percent: 0,
      score: 3, categories: ['Momentum', 'High Volatility'],
      reasons: 'Price above trend MAs; volatility elevated but not extreme; watch for continuation or mean reversion',
      relative_strength_20d: 8.4,
      ma_spread_percent: 7.1,
      ma_convergence_label: 'MA Spread Wide'
    }
  ],
  by_category: {
    Momentum: [
      { ticker: 'INTC', price: 124.92, rsi: 85.07, ma20: 84.37, ma50: 62.11, volume_ratio: 1.5, volatility: 1.1221, volatility_label: 'Extreme', dividend_yield_percent: 0, score: 5, categories: ['Momentum'], reasons: 'RSI above 65; strong trend', relative_strength_20d: 12.3, ma_spread_percent: 36.0, ma_convergence_label: 'MA Spread Wide' },
      { ticker: 'AMD', price: 455.19, rsi: 80.78, ma20: 326.23, ma50: 254.51, volume_ratio: 1.22, volatility: 0.9713, volatility_label: 'Extreme', dividend_yield_percent: 0, score: 5, categories: ['Momentum'], reasons: 'Strong trend above MA20/MA50', relative_strength_20d: 14.7 }
    ],
    'Breakout Volume': [
      { ticker: 'SPCE', price: 2.94, rsi: 58.13, ma20: 2.7, ma50: 2.62, volume_ratio: 1.96, volatility: 1.0154, volatility_label: 'Extreme', dividend_yield_percent: 0, score: 6, categories: ['Breakout Volume'], reasons: 'Volume spike and breakout momentum', relative_strength_20d: 22.4 }
    ],
    Dividend: [
      { ticker: 'F', price: 12.32, rsi: 52.30, ma20: 12.35, ma50: 12.15, volume_ratio: 0.81, volatility: 0.3243, volatility_label: 'Moderate', dividend_yield_percent: 4.93, score: 3, categories: ['Dividend'], reasons: 'High dividend yield with stable price action' },
      { ticker: 'CSCO', price: 96.57, rsi: 72.61, ma20: 88.91, ma50: 83.02, volume_ratio: 1.37, volatility: 0.2837, volatility_label: 'Moderate', dividend_yield_percent: 1.82, score: 4, categories: ['Dividend','Momentum'], reasons: 'Dividend with bullish trend' }
    ],
    Oversold: [
      { ticker: 'RIVN', price: 14.22, rsi: 36.50, ma20: 16.0, ma50: 15.62, volume_ratio: 1.15, volatility: 0.4827, volatility_label: 'High', dividend_yield_percent: 0, score: 3, categories: ['Oversold','High Volatility'], reasons: 'RSI near oversold and high volatility' }
    ],
    'Extreme Volatility': [
      { ticker: 'SPCE', price: 2.94, rsi: 58.13, ma20: 2.7, ma50: 2.62, volume_ratio: 1.96, volatility: 1.0154, volatility_label: 'Extreme', dividend_yield_percent: 0, score: 6, categories: ['Extreme Volatility'], reasons: 'Option-like intraday action' },
      { ticker: 'AMD', price: 455.19, rsi: 80.78, ma20: 326.23, ma50: 254.51, volume_ratio: 1.22, volatility: 0.9713, volatility_label: 'Extreme', dividend_yield_percent: 0, score: 5, categories: ['Extreme Volatility'], reasons: 'Very large daily ranges' }
    ],
    'Pullback Risk': [
      { ticker: 'SHOP', price: 110.41, rsi: 40.71, ma20: 122.28, ma50: 121.80, volume_ratio: 1.30, volatility: 0.7924, volatility_label: 'Extreme', dividend_yield_percent: 0, score: 3, categories: ['Pullback Risk'], reasons: 'Price below trend and volatility elevated' }
    ],
    'Speculative / High Risk': [
      { ticker: 'RIVN', price: 14.22, rsi: 36.50, ma20: 16.0, ma50: 15.62, volume_ratio: 1.15, volatility: 0.4827, volatility_label: 'High', dividend_yield_percent: 0, score: 3, categories: ['Speculative / High Risk'], reasons: 'Small cap name with high volatility and weak trend' }
    ]
  }
}

export default demo
