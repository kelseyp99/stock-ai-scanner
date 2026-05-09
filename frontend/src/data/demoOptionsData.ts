const demoOptions: Record<string, any> = {
  AAPL: {
    ticker: 'AAPL',
    current_price: 189.50,
    iv_atm: 0.24,
    historical_volatility: { hv30: 0.21, hv90: 0.19 },
    expirations: ['2026-05-16', '2026-05-23', '2026-06-20', '2026-07-18'],
    chains: {
      '2026-05-16': {
        calls: [
          { strike: 180, lastPrice: 10.20, bid: 10.10, ask: 10.30, impliedVolatility: 0.28, openInterest: 1200, volume: 340 },
          { strike: 185, lastPrice: 5.80, bid: 5.70, ask: 5.90, impliedVolatility: 0.25, openInterest: 3400, volume: 890 },
          { strike: 190, lastPrice: 2.45, bid: 2.40, ask: 2.50, impliedVolatility: 0.23, openInterest: 8200, volume: 2100 },
          { strike: 195, lastPrice: 0.85, bid: 0.82, ask: 0.88, impliedVolatility: 0.22, openInterest: 5600, volume: 1400 },
          { strike: 200, lastPrice: 0.22, bid: 0.20, ask: 0.24, impliedVolatility: 0.24, openInterest: 4100, volume: 980 },
        ],
        puts: [
          { strike: 180, lastPrice: 0.30, bid: 0.28, ask: 0.32, impliedVolatility: 0.26, openInterest: 2100, volume: 560 },
          { strike: 185, lastPrice: 0.90, bid: 0.88, ask: 0.92, impliedVolatility: 0.24, openInterest: 4200, volume: 1100 },
          { strike: 190, lastPrice: 2.55, bid: 2.50, ask: 2.60, impliedVolatility: 0.23, openInterest: 7800, volume: 1950 },
          { strike: 195, lastPrice: 5.95, bid: 5.85, ask: 6.05, impliedVolatility: 0.22, openInterest: 3100, volume: 720 },
          { strike: 200, lastPrice: 10.60, bid: 10.50, ask: 10.70, impliedVolatility: 0.25, openInterest: 1800, volume: 410 },
        ],
      },
      '2026-05-23': {
        calls: [
          { strike: 180, lastPrice: 11.00, bid: 10.90, ask: 11.10, impliedVolatility: 0.27, openInterest: 900, volume: 210 },
          { strike: 185, lastPrice: 7.10, bid: 7.00, ask: 7.20, impliedVolatility: 0.25, openInterest: 2800, volume: 670 },
          { strike: 190, lastPrice: 3.80, bid: 3.75, ask: 3.85, impliedVolatility: 0.24, openInterest: 6500, volume: 1600 },
          { strike: 195, lastPrice: 1.70, bid: 1.65, ask: 1.75, impliedVolatility: 0.23, openInterest: 4300, volume: 1020 },
          { strike: 200, lastPrice: 0.65, bid: 0.62, ask: 0.68, impliedVolatility: 0.24, openInterest: 3200, volume: 740 },
        ],
        puts: [
          { strike: 180, lastPrice: 0.55, bid: 0.52, ask: 0.58, impliedVolatility: 0.26, openInterest: 1500, volume: 380 },
          { strike: 185, lastPrice: 1.45, bid: 1.42, ask: 1.48, impliedVolatility: 0.24, openInterest: 3600, volume: 860 },
          { strike: 190, lastPrice: 3.90, bid: 3.85, ask: 3.95, impliedVolatility: 0.24, openInterest: 6100, volume: 1480 },
          { strike: 195, lastPrice: 7.20, bid: 7.10, ask: 7.30, impliedVolatility: 0.23, openInterest: 2700, volume: 620 },
          { strike: 200, lastPrice: 11.30, bid: 11.20, ask: 11.40, impliedVolatility: 0.25, openInterest: 1400, volume: 310 },
        ],
      },
      '2026-06-20': {
        calls: [
          { strike: 175, lastPrice: 16.40, bid: 16.20, ask: 16.60, impliedVolatility: 0.26, openInterest: 720, volume: 150 },
          { strike: 185, lastPrice: 9.60, bid: 9.50, ask: 9.70, impliedVolatility: 0.24, openInterest: 2200, volume: 510 },
          { strike: 190, lastPrice: 6.30, bid: 6.20, ask: 6.40, impliedVolatility: 0.23, openInterest: 5100, volume: 1240 },
          { strike: 195, lastPrice: 3.80, bid: 3.75, ask: 3.85, impliedVolatility: 0.23, openInterest: 3800, volume: 900 },
          { strike: 200, lastPrice: 2.10, bid: 2.05, ask: 2.15, impliedVolatility: 0.24, openInterest: 2900, volume: 670 },
          { strike: 210, lastPrice: 0.55, bid: 0.52, ask: 0.58, impliedVolatility: 0.26, openInterest: 1800, volume: 390 },
        ],
        puts: [
          { strike: 175, lastPrice: 0.80, bid: 0.78, ask: 0.82, impliedVolatility: 0.27, openInterest: 1100, volume: 250 },
          { strike: 185, lastPrice: 2.90, bid: 2.85, ask: 2.95, impliedVolatility: 0.24, openInterest: 2900, volume: 680 },
          { strike: 190, lastPrice: 5.40, bid: 5.30, ask: 5.50, impliedVolatility: 0.23, openInterest: 4800, volume: 1150 },
          { strike: 195, lastPrice: 8.80, bid: 8.70, ask: 8.90, impliedVolatility: 0.23, openInterest: 2400, volume: 550 },
          { strike: 200, lastPrice: 13.00, bid: 12.90, ask: 13.10, impliedVolatility: 0.24, openInterest: 1600, volume: 360 },
          { strike: 210, lastPrice: 21.50, bid: 21.30, ask: 21.70, impliedVolatility: 0.26, openInterest: 800, volume: 170 },
        ],
      },
      '2026-07-18': {
        calls: [
          { strike: 175, lastPrice: 18.20, bid: 18.00, ask: 18.40, impliedVolatility: 0.25, openInterest: 540, volume: 110 },
          { strike: 185, lastPrice: 11.50, bid: 11.40, ask: 11.60, impliedVolatility: 0.24, openInterest: 1800, volume: 420 },
          { strike: 190, lastPrice: 8.30, bid: 8.20, ask: 8.40, impliedVolatility: 0.23, openInterest: 4200, volume: 1010 },
          { strike: 195, lastPrice: 5.60, bid: 5.50, ask: 5.70, impliedVolatility: 0.23, openInterest: 3100, volume: 740 },
          { strike: 200, lastPrice: 3.50, bid: 3.45, ask: 3.55, impliedVolatility: 0.24, openInterest: 2400, volume: 570 },
          { strike: 210, lastPrice: 1.10, bid: 1.05, ask: 1.15, impliedVolatility: 0.25, openInterest: 1500, volume: 330 },
        ],
        puts: [
          { strike: 175, lastPrice: 1.40, bid: 1.38, ask: 1.42, impliedVolatility: 0.26, openInterest: 860, volume: 190 },
          { strike: 185, lastPrice: 4.20, bid: 4.15, ask: 4.25, impliedVolatility: 0.24, openInterest: 2300, volume: 540 },
          { strike: 190, lastPrice: 7.20, bid: 7.10, ask: 7.30, impliedVolatility: 0.23, openInterest: 3900, volume: 930 },
          { strike: 195, lastPrice: 10.90, bid: 10.80, ask: 11.00, impliedVolatility: 0.23, openInterest: 2000, volume: 460 },
          { strike: 200, lastPrice: 15.10, bid: 15.00, ask: 15.20, impliedVolatility: 0.24, openInterest: 1300, volume: 290 },
          { strike: 210, lastPrice: 23.80, bid: 23.60, ask: 24.00, impliedVolatility: 0.25, openInterest: 680, volume: 140 },
        ],
      },
    },
    strategies: [
      { strategy: 'Covered Call', direction: 'neutral/bullish', description: 'Sell the 195 call expiring May 16 for $0.85 premium. Caps upside at $195 but collects income.', score: 0.82 },
      { strategy: 'Cash-Secured Put', direction: 'bullish', description: 'Sell the 185 put expiring May 16 for $0.90. Collect premium with obligation to buy at $185.', score: 0.78 },
      { strategy: 'Iron Condor', direction: 'neutral', description: 'Sell 185/180 put spread and 195/200 call spread. Profit if AAPL stays between $185–$195 through expiration.', score: 0.71 },
      { strategy: 'Bull Call Spread', direction: 'bullish', description: 'Buy 190 call / sell 200 call for Jun expiration. Risk $2.20, max profit $7.80 if AAPL > $200 at expiry.', score: 0.65 },
    ],
    ai_summary: { summary: 'AAPL IV (24%) is slightly above its 30-day HV (21%), suggesting options are modestly expensive. Neutral to mildly bullish bias. Premium-selling strategies like covered calls or iron condors are favored near current levels. Watch for earnings catalyst in Q3.' },
  },
  TSLA: {
    ticker: 'TSLA',
    current_price: 248.30,
    iv_atm: 0.58,
    historical_volatility: { hv30: 0.51, hv90: 0.48 },
    expirations: ['2026-05-16', '2026-05-23', '2026-06-20'],
    chains: {
      '2026-05-16': {
        calls: [
          { strike: 230, lastPrice: 20.50, bid: 20.30, ask: 20.70, impliedVolatility: 0.62, openInterest: 2100, volume: 540 },
          { strike: 245, lastPrice: 9.80, bid: 9.60, ask: 10.00, impliedVolatility: 0.58, openInterest: 5600, volume: 1420 },
          { strike: 250, lastPrice: 6.90, bid: 6.75, ask: 7.05, impliedVolatility: 0.57, openInterest: 8900, volume: 2300 },
          { strike: 260, lastPrice: 2.80, bid: 2.70, ask: 2.90, impliedVolatility: 0.56, openInterest: 6200, volume: 1600 },
          { strike: 275, lastPrice: 0.65, bid: 0.62, ask: 0.68, impliedVolatility: 0.59, openInterest: 3400, volume: 870 },
        ],
        puts: [
          { strike: 230, lastPrice: 2.40, bid: 2.30, ask: 2.50, impliedVolatility: 0.60, openInterest: 1800, volume: 450 },
          { strike: 245, lastPrice: 6.50, bid: 6.40, ask: 6.60, impliedVolatility: 0.58, openInterest: 4900, volume: 1250 },
          { strike: 250, lastPrice: 8.80, bid: 8.70, ask: 8.90, impliedVolatility: 0.57, openInterest: 7600, volume: 1950 },
          { strike: 260, lastPrice: 14.90, bid: 14.75, ask: 15.05, impliedVolatility: 0.56, openInterest: 4100, volume: 1020 },
          { strike: 275, lastPrice: 27.40, bid: 27.20, ask: 27.60, impliedVolatility: 0.59, openInterest: 2200, volume: 540 },
        ],
      },
      '2026-05-23': {
        calls: [
          { strike: 230, lastPrice: 23.10, bid: 22.90, ask: 23.30, impliedVolatility: 0.61, openInterest: 1600, volume: 390 },
          { strike: 245, lastPrice: 13.40, bid: 13.20, ask: 13.60, impliedVolatility: 0.58, openInterest: 4200, volume: 1050 },
          { strike: 250, lastPrice: 10.40, bid: 10.25, ask: 10.55, impliedVolatility: 0.57, openInterest: 6800, volume: 1720 },
          { strike: 260, lastPrice: 5.60, bid: 5.50, ask: 5.70, impliedVolatility: 0.56, openInterest: 4800, volume: 1200 },
          { strike: 275, lastPrice: 1.90, bid: 1.85, ask: 1.95, impliedVolatility: 0.58, openInterest: 2700, volume: 660 },
        ],
        puts: [
          { strike: 230, lastPrice: 4.20, bid: 4.10, ask: 4.30, impliedVolatility: 0.60, openInterest: 1400, volume: 340 },
          { strike: 245, lastPrice: 9.30, bid: 9.20, ask: 9.40, impliedVolatility: 0.58, openInterest: 3700, volume: 920 },
          { strike: 250, lastPrice: 12.10, bid: 12.00, ask: 12.20, impliedVolatility: 0.57, openInterest: 5900, volume: 1480 },
          { strike: 260, lastPrice: 18.50, bid: 18.35, ask: 18.65, impliedVolatility: 0.56, openInterest: 3200, volume: 790 },
          { strike: 275, lastPrice: 31.20, bid: 31.00, ask: 31.40, impliedVolatility: 0.58, openInterest: 1700, volume: 410 },
        ],
      },
      '2026-06-20': {
        calls: [
          { strike: 230, lastPrice: 28.60, bid: 28.40, ask: 28.80, impliedVolatility: 0.60, openInterest: 1100, volume: 260 },
          { strike: 245, lastPrice: 19.20, bid: 19.00, ask: 19.40, impliedVolatility: 0.57, openInterest: 3100, volume: 760 },
          { strike: 250, lastPrice: 16.10, bid: 16.00, ask: 16.20, impliedVolatility: 0.57, openInterest: 5200, volume: 1290 },
          { strike: 260, lastPrice: 10.80, bid: 10.70, ask: 10.90, impliedVolatility: 0.56, openInterest: 3800, volume: 940 },
          { strike: 275, lastPrice: 5.40, bid: 5.30, ask: 5.50, impliedVolatility: 0.57, openInterest: 2400, volume: 580 },
          { strike: 300, lastPrice: 1.60, bid: 1.55, ask: 1.65, impliedVolatility: 0.60, openInterest: 1500, volume: 360 },
        ],
        puts: [
          { strike: 230, lastPrice: 7.80, bid: 7.70, ask: 7.90, impliedVolatility: 0.60, openInterest: 950, volume: 220 },
          { strike: 245, lastPrice: 14.30, bid: 14.20, ask: 14.40, impliedVolatility: 0.57, openInterest: 2800, volume: 680 },
          { strike: 250, lastPrice: 17.50, bid: 17.40, ask: 17.60, impliedVolatility: 0.57, openInterest: 4600, volume: 1130 },
          { strike: 260, lastPrice: 24.20, bid: 24.05, ask: 24.35, impliedVolatility: 0.56, openInterest: 2900, volume: 700 },
          { strike: 275, lastPrice: 35.80, bid: 35.60, ask: 36.00, impliedVolatility: 0.57, openInterest: 1800, volume: 430 },
          { strike: 300, lastPrice: 55.10, bid: 54.90, ask: 55.30, impliedVolatility: 0.60, openInterest: 900, volume: 200 },
        ],
      },
    },
    strategies: [
      { strategy: 'Strangle', direction: 'neutral (volatile)', description: 'Buy 230 put / 275 call May 16 expiry. Profits from large move either direction. High IV makes this expensive — best if a big move is expected.', score: 0.74 },
      { strategy: 'Iron Condor', direction: 'neutral', description: 'Sell 245/235 put spread and 265/275 call spread. Collect premium if TSLA stays in range through May 16.', score: 0.69 },
      { strategy: 'Bull Call Spread', direction: 'bullish', description: 'Buy 250 call / sell 275 call Jun expiry. Risk $10.70, max profit $14.30 if TSLA > $275.', score: 0.61 },
    ],
    ai_summary: { summary: 'TSLA IV (58%) significantly exceeds 30-day HV (51%), meaning options are richly priced. Premium-selling strategies (iron condors, strangles) have an edge. High IV environment favors defined-risk spreads over naked long options. Monitor for catalyst events.' },
  },
  SPY: {
    ticker: 'SPY',
    current_price: 524.10,
    iv_atm: 0.14,
    historical_volatility: { hv30: 0.12, hv90: 0.11 },
    expirations: ['2026-05-16', '2026-05-23', '2026-06-20', '2026-07-18'],
    chains: {
      '2026-05-16': {
        calls: [
          { strike: 515, lastPrice: 10.30, bid: 10.20, ask: 10.40, impliedVolatility: 0.15, openInterest: 8400, volume: 2100 },
          { strike: 520, lastPrice: 5.90, bid: 5.85, ask: 5.95, impliedVolatility: 0.14, openInterest: 14200, volume: 3600 },
          { strike: 525, lastPrice: 2.40, bid: 2.38, ask: 2.42, impliedVolatility: 0.13, openInterest: 18600, volume: 4700 },
          { strike: 530, lastPrice: 0.70, bid: 0.68, ask: 0.72, impliedVolatility: 0.14, openInterest: 12300, volume: 3100 },
          { strike: 535, lastPrice: 0.15, bid: 0.14, ask: 0.16, impliedVolatility: 0.15, openInterest: 7800, volume: 1900 },
        ],
        puts: [
          { strike: 515, lastPrice: 0.85, bid: 0.83, ask: 0.87, impliedVolatility: 0.15, openInterest: 7200, volume: 1800 },
          { strike: 520, lastPrice: 2.30, bid: 2.28, ask: 2.32, impliedVolatility: 0.14, openInterest: 12800, volume: 3200 },
          { strike: 525, lastPrice: 4.80, bid: 4.75, ask: 4.85, impliedVolatility: 0.13, openInterest: 16900, volume: 4300 },
          { strike: 530, lastPrice: 8.50, bid: 8.45, ask: 8.55, impliedVolatility: 0.14, openInterest: 10100, volume: 2500 },
          { strike: 535, lastPrice: 13.20, bid: 13.10, ask: 13.30, impliedVolatility: 0.15, openInterest: 6200, volume: 1550 },
        ],
      },
      '2026-05-23': {
        calls: [
          { strike: 515, lastPrice: 11.80, bid: 11.70, ask: 11.90, impliedVolatility: 0.15, openInterest: 6100, volume: 1520 },
          { strike: 520, lastPrice: 7.90, bid: 7.85, ask: 7.95, impliedVolatility: 0.14, openInterest: 10800, volume: 2700 },
          { strike: 525, lastPrice: 4.50, bid: 4.45, ask: 4.55, impliedVolatility: 0.13, openInterest: 14200, volume: 3560 },
          { strike: 530, lastPrice: 2.10, bid: 2.08, ask: 2.12, impliedVolatility: 0.14, openInterest: 9600, volume: 2400 },
          { strike: 535, lastPrice: 0.75, bid: 0.73, ask: 0.77, impliedVolatility: 0.15, openInterest: 6100, volume: 1520 },
        ],
        puts: [
          { strike: 515, lastPrice: 1.80, bid: 1.78, ask: 1.82, impliedVolatility: 0.15, openInterest: 5400, volume: 1340 },
          { strike: 520, lastPrice: 3.80, bid: 3.75, ask: 3.85, impliedVolatility: 0.14, openInterest: 9700, volume: 2420 },
          { strike: 525, lastPrice: 6.30, bid: 6.25, ask: 6.35, impliedVolatility: 0.13, openInterest: 13100, volume: 3280 },
          { strike: 530, lastPrice: 9.90, bid: 9.85, ask: 9.95, impliedVolatility: 0.14, openInterest: 8200, volume: 2050 },
          { strike: 535, lastPrice: 14.60, bid: 14.50, ask: 14.70, impliedVolatility: 0.15, openInterest: 4900, volume: 1230 },
        ],
      },
      '2026-06-20': {
        calls: [
          { strike: 510, lastPrice: 17.40, bid: 17.30, ask: 17.50, impliedVolatility: 0.15, openInterest: 4800, volume: 1200 },
          { strike: 520, lastPrice: 11.20, bid: 11.10, ask: 11.30, impliedVolatility: 0.14, openInterest: 8900, volume: 2230 },
          { strike: 525, lastPrice: 8.10, bid: 8.05, ask: 8.15, impliedVolatility: 0.13, openInterest: 12100, volume: 3030 },
          { strike: 530, lastPrice: 5.40, bid: 5.35, ask: 5.45, impliedVolatility: 0.13, openInterest: 8600, volume: 2150 },
          { strike: 540, lastPrice: 1.90, bid: 1.88, ask: 1.92, impliedVolatility: 0.14, openInterest: 5700, volume: 1420 },
        ],
        puts: [
          { strike: 510, lastPrice: 2.60, bid: 2.58, ask: 2.62, impliedVolatility: 0.16, openInterest: 4200, volume: 1050 },
          { strike: 520, lastPrice: 6.10, bid: 6.05, ask: 6.15, impliedVolatility: 0.14, openInterest: 7800, volume: 1950 },
          { strike: 525, lastPrice: 8.80, bid: 8.75, ask: 8.85, impliedVolatility: 0.13, openInterest: 11200, volume: 2800 },
          { strike: 530, lastPrice: 12.10, bid: 12.05, ask: 12.15, impliedVolatility: 0.13, openInterest: 7400, volume: 1850 },
          { strike: 540, lastPrice: 19.80, bid: 19.70, ask: 19.90, impliedVolatility: 0.14, openInterest: 4400, volume: 1100 },
        ],
      },
      '2026-07-18': {
        calls: [
          { strike: 510, lastPrice: 20.10, bid: 20.00, ask: 20.20, impliedVolatility: 0.15, openInterest: 3600, volume: 890 },
          { strike: 520, lastPrice: 14.20, bid: 14.10, ask: 14.30, impliedVolatility: 0.14, openInterest: 6800, volume: 1700 },
          { strike: 525, lastPrice: 11.30, bid: 11.20, ask: 11.40, impliedVolatility: 0.13, openInterest: 9400, volume: 2360 },
          { strike: 530, lastPrice: 8.60, bid: 8.55, ask: 8.65, impliedVolatility: 0.13, openInterest: 6900, volume: 1730 },
          { strike: 540, lastPrice: 4.20, bid: 4.15, ask: 4.25, impliedVolatility: 0.14, openInterest: 4600, volume: 1150 },
        ],
        puts: [
          { strike: 510, lastPrice: 4.80, bid: 4.75, ask: 4.85, impliedVolatility: 0.15, openInterest: 3200, volume: 800 },
          { strike: 520, lastPrice: 8.60, bid: 8.55, ask: 8.65, impliedVolatility: 0.14, openInterest: 6100, volume: 1530 },
          { strike: 525, lastPrice: 11.40, bid: 11.30, ask: 11.50, impliedVolatility: 0.13, openInterest: 8600, volume: 2150 },
          { strike: 530, lastPrice: 14.80, bid: 14.70, ask: 14.90, impliedVolatility: 0.13, openInterest: 5800, volume: 1450 },
          { strike: 540, lastPrice: 22.50, bid: 22.40, ask: 22.60, impliedVolatility: 0.14, openInterest: 3500, volume: 870 },
        ],
      },
    },
    strategies: [
      { strategy: 'Iron Condor', direction: 'neutral', description: 'Sell 515/510 put spread and 530/535 call spread May 16. Low IV makes premium thin but risk/reward is favorable in range-bound market.', score: 0.80 },
      { strategy: 'Covered Call', direction: 'neutral/bullish', description: 'Sell the 530 call May 16 for $0.70. Modest income on existing SPY position.', score: 0.75 },
      { strategy: 'Cash-Secured Put', direction: 'bullish', description: 'Sell the 520 put May 23 for $3.80. Willing to own SPY at $520 effective cost.', score: 0.70 },
    ],
    ai_summary: { summary: 'SPY IV (14%) is near its 30-day HV (12%), suggesting fair option pricing. Low volatility environment favors selling premium. Iron condors and covered calls are well-suited here. The broad market appears range-bound; watch macro catalysts for breakout signals.' },
  },
}

export default demoOptions
