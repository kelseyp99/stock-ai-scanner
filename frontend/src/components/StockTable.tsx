import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FilterId = 'all' | 'momentum' | 'oversold' | 'low-vol' | 'dividend' | 'options' | 'extreme' | 'mean-reversion' | 'squeeze'

// ─────────────────────────────────────────────────────────────────────────────
// Company names
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_NAMES: Record<string, string> = {
  AAPL:'Apple', MSFT:'Microsoft', GOOGL:'Alphabet', GOOG:'Alphabet',
  AMZN:'Amazon', NVDA:'NVIDIA', META:'Meta Platforms', TSLA:'Tesla',
  AMD:'Advanced Micro Devices', INTC:'Intel', CSCO:'Cisco Systems',
  ORCL:'Oracle', QCOM:'Qualcomm', TXN:'Texas Instruments', AVGO:'Broadcom',
  NFLX:'Netflix', DIS:'Walt Disney', JPM:'JPMorgan Chase', BAC:'Bank of America',
  GS:'Goldman Sachs', MS:'Morgan Stanley', WFC:'Wells Fargo', C:'Citigroup',
  XOM:'Exxon Mobil', CVX:'Chevron', COP:'ConocoPhillips',
  JNJ:'Johnson & Johnson', PFE:'Pfizer', MRK:'Merck', ABBV:'AbbVie', LLY:'Eli Lilly',
  UNH:'UnitedHealth', CVS:'CVS Health', WMT:'Walmart', COST:'Costco',
  HD:'Home Depot', TGT:'Target', AMGN:'Amgen',
  SPY:'SPDR S&P 500 ETF', QQQ:'Invesco QQQ', IWM:'iShares Russell 2000',
  PLTR:'Palantir', SOFI:'SoFi Technologies', MSTR:'MicroStrategy', COIN:'Coinbase',
  F:'Ford Motor', GM:'General Motors', BA:'Boeing', LMT:'Lockheed Martin',
  RTX:'RTX Corporation', NOC:'Northrop Grumman', GD:'General Dynamics',
  ADBE:'Adobe', CRM:'Salesforce', NOW:'ServiceNow', SNOW:'Snowflake',
  UBER:'Uber', LYFT:'Lyft', ABNB:'Airbnb', DASH:'DoorDash', HOOD:'Robinhood',
  AKAM:'Akamai', ADSK:'Autodesk', AMAT:'Applied Materials', LRCX:'Lam Research',
  MU:'Micron Technology', MRVL:'Marvell Technology', ARM:'Arm Holdings',
  SMCI:'Super Micro Computer', DELL:'Dell Technologies', HPQ:'HP Inc',
  PYPL:'PayPal', V:'Visa', MA:'Mastercard', AXP:'American Express',
  ROKU:'Roku', SPOT:'Spotify', PINS:'Pinterest', SNAP:'Snap',
  T:'AT&T', VZ:'Verizon', TMUS:'T-Mobile',
  NKE:'Nike', SBUX:'Starbucks', PG:'Procter & Gamble', KO:'Coca-Cola', PEP:'PepsiCo',
  GE:'GE Aerospace', MMM:'3M', HON:'Honeywell', CAT:'Caterpillar', DE:'Deere & Co',
  TSM:'Taiwan Semiconductor',
}

// ─────────────────────────────────────────────────────────────────────────────
// Category config with priority tiers (1=highest visual weight)
// ─────────────────────────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: string; cls: string; priority: number }> = {
  '🌀 Volatility Compression': { icon: '🌀', cls: 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-300', priority: 1 },
  'Pullback Risk':             { icon: '⚠️', cls: 'bg-orange-500 text-white font-bold ring-2 ring-orange-300', priority: 1 },
  'Extreme Volatility':        { icon: '🔥', cls: 'bg-red-600 text-white font-bold ring-2 ring-red-300',     priority: 1 },
  'Breakout Volume':           { icon: '🧨', cls: 'bg-violet-600 text-white font-bold',                       priority: 2 },
  'Momentum':                  { icon: '🚀', cls: 'bg-blue-600 text-white font-semibold',                     priority: 2 },
  'Oversold':                  { icon: '💚', cls: 'bg-emerald-600 text-white font-semibold',                  priority: 2 },
  'Market Leader':             { icon: '🏆', cls: 'bg-green-600 text-white font-semibold',                   priority: 2 },
  'Speculative / High Risk':   { icon: '🎲', cls: 'bg-pink-600 text-white font-bold',                        priority: 2 },
  'High Volatility':           { icon: '⚡', cls: 'bg-red-400 text-white',                                   priority: 3 },
  'Dividend':                  { icon: '💰', cls: 'bg-yellow-400 text-gray-900',                             priority: 3 },
  'Market Laggard':            { icon: '🐢', cls: 'bg-slate-400 text-white',                                 priority: 3 },
  'Bullish Crossover Setup':   { icon: '🔀', cls: 'bg-teal-500 text-white',                                  priority: 3 },
  'Bearish Crossover Risk':    { icon: '🔁', cls: 'bg-amber-600 text-white',                                 priority: 3 },
  'MA Converging':             { icon: '〰️', cls: 'bg-sky-400 text-white',                                   priority: 4 },
  'Weak Trend':                { icon: '😴', cls: 'bg-gray-300 text-gray-700',                               priority: 4 },
}

const TRADE_TYPE_CONFIG: Record<string, { cls: string; icon: string }> = {
  'Momentum Swing':       { cls: 'bg-blue-100 text-blue-800',     icon: '🚀' },
  'Breakout Trade':       { cls: 'bg-orange-100 text-orange-800', icon: '🧨' },
  'Mean Reversion Setup': { cls: 'bg-purple-100 text-purple-800', icon: '��' },
  'Covered Call Income':  { cls: 'bg-green-100 text-green-800',   icon: '💵' },
  'Dividend Trend':       { cls: 'bg-yellow-100 text-yellow-900', icon: '💰' },
  'Speculative Breakout': { cls: 'bg-pink-100 text-pink-800',     icon: '🎲' },
  'Volatility Expansion': { cls: 'bg-indigo-100 text-indigo-800', icon: '🌀' },
  'Low Volatility Trend': { cls: 'bg-teal-100 text-teal-800',     icon: '��️' },
}

const SETUP_QUALITY_CONFIG: Record<string, { cls: string; desc: string }> = {
  'A+': { cls: 'bg-amber-400 text-white font-black',   desc: 'Elite — rare, high-conviction setup' },
  'A':  { cls: 'bg-green-500 text-white font-bold',    desc: 'Strong signal alignment' },
  'B':  { cls: 'bg-blue-400 text-white font-semibold', desc: 'Moderate — watch for confirmation' },
  'C':  { cls: 'bg-gray-300 text-gray-700',            desc: 'Mixed signals — smaller sizing' },
  'D':  { cls: 'bg-red-200 text-red-800',              desc: 'Poor setup — speculative only' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS: { id: FilterId; label: string; icon: string }[] = [
  { id: 'all',            label: 'All',         icon: '🔍' },
  { id: 'momentum',       label: 'Momentum',    icon: '🚀' },
  { id: 'oversold',       label: 'Oversold',    icon: '💚' },
  { id: 'mean-reversion', label: 'Mean Rev',    icon: '🔄' },
  { id: 'squeeze',        label: 'Vol Squeeze', icon: '🌀' },
  { id: 'dividend',       label: 'Dividend',    icon: '💰' },
  { id: 'options',        label: 'High Vol',    icon: '⚡' },
  { id: 'low-vol',        label: 'Low Vol',     icon: '🛡️' },
  { id: 'extreme',        label: 'Elite Score', icon: '🔥' },
]

function applyFilter(data: any[], filter: FilterId): any[] {
  const cats = (r: any): string[] => r.categories ?? []
  switch (filter) {
    case 'momentum':       return data.filter(r => cats(r).includes('Momentum'))
    case 'oversold':       return data.filter(r => cats(r).includes('Oversold'))
    case 'mean-reversion': return data.filter(r => r.risk_profile === 'Mean Reversion' || cats(r).includes('Oversold'))
    case 'squeeze':        return data.filter(r => r.squeeze === true || cats(r).includes('🌀 Volatility Compression'))
    case 'dividend':       return data.filter(r => cats(r).includes('Dividend'))
    case 'options':        return data.filter(r => r.atr_pct != null && r.atr_pct >= 3.0)
    case 'low-vol':        return data.filter(r => r.atr_pct != null && r.atr_pct < 2.0)
    case 'extreme':        return data.filter(r => r.score >= 8)
    default:               return data
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip — scoped with group/tip to avoid row-hover leakage
// ─────────────────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip cursor-help">
      {children}
      <span className="pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 text-xs text-white bg-slate-800 rounded-lg px-2.5 py-1.5 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-normal text-center leading-relaxed">
        {text}
      </span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricBlock — value + tier label + narrative in a column
// ─────────────────────────────────────────────────────────────────────────────
function MetricBlock({ label, value, tier, narrative, valueClass }: {
  label: string; value: string; tier?: string; narrative?: string; valueClass?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[68px]">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-lg font-black tabular-nums leading-tight ${valueClass ?? 'text-slate-800'}`}>{value}</span>
      {tier      && <span className="text-xs font-semibold text-slate-600 leading-snug">{tier}</span>}
      {narrative && <span className="text-[11px] text-slate-400 leading-snug hidden sm:block">{narrative}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric implementations
// ─────────────────────────────────────────────────────────────────────────────
function RsiBlock({ rsi }: { rsi: number | null }) {
  if (rsi == null) return <MetricBlock label="RSI" value="—" />
  const { tier, cls, narrative } =
    rsi > 85 ? { tier: '🔥 Extremely OB',    cls: 'text-red-700',     narrative: 'Reversal risk very high' } :
    rsi > 75 ? { tier: '⚠️ Overbought',      cls: 'text-orange-600',  narrative: 'Caution on new longs' } :
    rsi > 65 ? { tier: '🚀 Strong Momentum',  cls: 'text-blue-600',   narrative: 'Trend established' } :
    rsi < 25 ? { tier: '💀 Deeply Oversold',  cls: 'text-purple-700', narrative: 'Bounce candidate' } :
    rsi < 35 ? { tier: '💚 Oversold',         cls: 'text-emerald-600',narrative: 'Mean reversion likely' } :
    rsi < 45 ? { tier: '🔻 Weakening',        cls: 'text-slate-600',  narrative: 'Momentum fading' } :
               { tier: 'Neutral',              cls: 'text-slate-700',  narrative: 'No extreme reading' }
  return <MetricBlock label="RSI" value={rsi.toFixed(1)} tier={tier} narrative={narrative} valueClass={cls} />
}

function AtrBlock({ atrPct, atrDollar }: { atrPct: number | null; atrDollar?: number | null }) {
  if (atrPct == null) return <MetricBlock label="ATR%" value="—" />
  const dollar = atrDollar != null ? ` ($${atrDollar.toFixed(2)})` : ''
  const { tier, cls, narrative } =
    atrPct >= 7   ? { tier: '💀 Extreme',   cls: 'text-red-700',    narrative: `Dangerous swings${dollar}` } :
    atrPct >= 5   ? { tier: '🔥 Very High', cls: 'text-red-600',    narrative: `Options-grade vol${dollar}` } :
    atrPct >= 3   ? { tier: '⚡ High',      cls: 'text-orange-500', narrative: `Elevated swings${dollar}` } :
    atrPct >= 1.5 ? { tier: 'Moderate',     cls: 'text-yellow-600', narrative: `Normal range${dollar}` } :
                    { tier: '🛡️ Low',        cls: 'text-green-600',  narrative: `Stable — cheap options${dollar}` }
  return <MetricBlock label="ATR%" value={`${atrPct.toFixed(1)}%`} tier={tier} narrative={narrative} valueClass={cls} />
}

function MADistBlock({ pct, label }: { pct: number | null; label: string | null }) {
  if (pct == null) return <MetricBlock label="vs MA20" value="—" />
  const sign = pct > 0 ? '+' : ''
  const { cls, narrative } =
    pct > 20  ? { cls: 'text-red-800',    narrative: 'Parabolic — reversion likely' } :
    pct > 12  ? { cls: 'text-red-700',    narrative: 'Euphoric — risky to chase' } :
    pct > 8   ? { cls: 'text-red-500',    narrative: 'Very extended — caution' } :
    pct > 5   ? { cls: 'text-orange-500', narrative: 'Extended but intact' } :
    pct > 2   ? { cls: 'text-slate-600',  narrative: 'Slightly above avg' } :
    pct > -2  ? { cls: 'text-slate-500',  narrative: 'Near average — healthy' } :
    pct > -5  ? { cls: 'text-blue-500',   narrative: 'Minor pullback' } :
    pct > -10 ? { cls: 'text-purple-500', narrative: 'Oversold pullback' } :
                { cls: 'text-purple-800', narrative: 'Deep selloff' }
  return (
    <MetricBlock
      label="vs MA20"
      value={`${sign}${pct.toFixed(1)}%`}
      tier={label ?? undefined}
      narrative={narrative}
      valueClass={cls}
    />
  )
}

function VolBlock({ v }: { v?: number | null }) {
  if (v == null) return <MetricBlock label="Volume" value="—" />
  const { tier, cls, narrative } =
    v >= 3.0 ? { tier: '🔊 Massive',  cls: 'text-violet-800', narrative: 'Major institutional flow' } :
    v >= 2.0 ? { tier: '📢 Heavy',    cls: 'text-violet-700', narrative: 'Strong conviction' } :
    v >= 1.5 ? { tier: '📈 Elevated', cls: 'text-violet-600', narrative: 'Above-avg participation' } :
    v < 0.7  ? { tier: '🔇 Thin',     cls: 'text-gray-400',   narrative: 'Low conviction — caution' } :
               { tier: 'Normal',       cls: 'text-slate-600',  narrative: 'Average activity' }
  return <MetricBlock label="Volume" value={`${v.toFixed(2)}x`} tier={tier} narrative={narrative} valueClass={cls} />
}

function RSBlock({ rs }: { rs?: number | null }) {
  if (rs == null) return <MetricBlock label="vs SPY" value="—" />
  const sign = rs > 0 ? '+' : ''
  const { tier, cls } =
    rs > 15  ? { tier: '🏆 Market Leader',   cls: 'text-green-700' } :
    rs > 5   ? { tier: '↗️ Outperforming',   cls: 'text-green-600' } :
    rs > -5  ? { tier: '↔️ Inline',          cls: 'text-slate-600' } :
    rs > -15 ? { tier: '↘️ Underperforming', cls: 'text-red-500' } :
               { tier: '🐢 Laggard',         cls: 'text-red-700' }
  return <MetricBlock label="vs SPY" value={`${sign}${rs.toFixed(1)}%`} tier={tier} valueClass={cls} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence meter
// ─────────────────────────────────────────────────────────────────────────────
function ConfidenceMeter({ pct }: { pct?: number | null }) {
  if (pct == null) return null
  const barCls = pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'
  const label  = pct >= 85 ? 'High' : pct >= 70 ? 'Good' : pct >= 50 ? 'Moderate' : 'Low'
  return (
    <Tooltip text={`Setup confidence: ${pct}% — signal alignment, volume confirmation, RSI, ATR, and relative strength vs market`}>
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200">
          <div className={`h-1.5 rounded-full ${barCls} transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{pct}% {label}</span>
      </div>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Score badge
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBadge({ score, bullish, risk, percentileLabel }: {
  score: number; bullish?: number; risk?: number; percentileLabel?: string | null
}) {
  const tip = [`Score: ${score}`, bullish != null ? `Bullish: ${bullish}  Risk: ${risk}` : '', percentileLabel ?? ''].filter(Boolean).join(' | ')
  const cls =
    score >= 10 ? 'bg-orange-500 text-white ring-2 ring-orange-300' :
    score >= 7  ? 'bg-green-500 text-white ring-2 ring-green-300' :
    score >= 4  ? 'bg-blue-500 text-white' :
    score >= 0  ? 'bg-slate-200 text-slate-700' :
                  'bg-red-100 text-red-700'
  return (
    <Tooltip text={tip}>
      <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl ${cls} min-w-[52px] shadow-sm`}>
        <span className="text-2xl font-black tabular-nums leading-none">{score}</span>
        {percentileLabel && <span className="text-[10px] font-semibold opacity-90 leading-tight mt-0.5 whitespace-nowrap">{percentileLabel}</span>}
      </div>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Category badge — priority-aware sizing
// ─────────────────────────────────────────────────────────────────────────────
function CategoryBadge({ label }: { label: string }) {
  const cfg = CAT_CONFIG[label] ?? { icon: '📌', cls: 'bg-gray-200 text-gray-700', priority: 5 }
  const sizeClass = cfg.priority === 1 ? 'px-2.5 py-1 text-xs' : cfg.priority === 2 ? 'px-2 py-0.5 text-xs' : 'px-1.5 py-0.5 text-[11px]'
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full shadow-sm ${sizeClass} ${cfg.cls}`}>
      {cfg.icon} {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Action zones panel
// ─────────────────────────────────────────────────────────────────────────────
function ActionZonesPanel({ row }: { row: any }) {
  const { buy_zone_low, buy_zone_high, chase_zone, danger_zone, price, in_buy_zone, in_chase_zone } = row
  if (buy_zone_low == null) {
    return <p className="text-xs text-gray-400 italic">Action zones unavailable — need MA20 + ATR data.</p>
  }
  const fmt = (v: number) => `$${v.toFixed(2)}`
  return (
    <div className="flex flex-wrap gap-3">
      <div className={`flex flex-col px-3 py-2 rounded-lg border text-sm font-mono min-w-[130px] ${in_buy_zone ? 'bg-green-50 border-green-400' : 'bg-white border-gray-200'}`}>
        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-0.5">🟢 Buy Zone</span>
        <span className="font-bold text-green-800">{fmt(buy_zone_low)} – {fmt(buy_zone_high)}</span>
        {in_buy_zone && <span className="text-xs text-green-600 font-semibold mt-0.5">← Price is here</span>}
      </div>
      <div className={`flex flex-col px-3 py-2 rounded-lg border text-sm font-mono min-w-[130px] ${in_chase_zone ? 'bg-orange-50 border-orange-400' : 'bg-white border-gray-200'}`}>
        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-0.5">🟡 Chase Zone</span>
        <span className="font-bold text-orange-700">Above {fmt(chase_zone)}</span>
        {in_chase_zone && <span className="text-xs text-orange-500 font-semibold mt-0.5">← Chasing here</span>}
      </div>
      <div className="flex flex-col px-3 py-2 rounded-lg border bg-white border-gray-200 text-sm font-mono min-w-[130px]">
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-0.5">🔴 Danger Zone</span>
        <span className="font-bold text-red-700">Below {fmt(danger_zone)}</span>
        {price != null && price < danger_zone && <span className="text-xs text-red-500 font-semibold mt-0.5">⚠️ In danger zone</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Options interpretation card
// ─────────────────────────────────────────────────────────────────────────────
function OptionsInterpretationCard({ row }: { row: any }) {
  const { atr_pct, atr_dollar, expected_move_pct, price, rsi, squeeze, trade_type, categories, ma_distance_pct } = row
  const cats: string[]  = categories ?? []
  const isHighVol       = atr_pct != null && atr_pct >= 5
  const isLowVol        = atr_pct != null && atr_pct < 2
  const isOversold      = cats.includes('Oversold') || (rsi != null && rsi < 35)
  const isMomentum      = cats.includes('Momentum')
  const hasSqueeze      = squeeze === true || cats.includes('🌀 Volatility Compression')
  const isParabolic     = (ma_distance_pct ?? 0) > 20
  const isEuphoric      = !isParabolic && (ma_distance_pct ?? 0) > 12

  const bias      = isMomentum && !isParabolic ? 'Bullish' : isOversold ? 'Neutral-to-Bullish' : isParabolic ? 'Caution — Extended' : 'Neutral'
  const biasColor = bias === 'Bullish' ? 'text-green-700' : bias === 'Neutral-to-Bullish' ? 'text-blue-700' : 'text-orange-700'
  const volEnv    = isHighVol ? 'High IV — expensive options' : isLowVol ? 'Low IV — cheap options' : hasSqueeze ? 'Compressed IV — pre-expansion' : 'Moderate IV'

  let strategy = '', rationale = '', strikeHint = ''
  if (hasSqueeze) {
    strategy  = 'Long Straddle / Strangle'
    rationale = 'Volatility compression precedes a sharp directional move. A straddle profits from expansion in either direction — ideal before the catalyst fires. Wait for volume confirmation of direction before converting to a directional position.'
    strikeHint = price != null && expected_move_pct != null ? `ATM straddle near $${price.toFixed(2)} — wings ±${expected_move_pct.toFixed(1)}%` : ''
  } else if (isParabolic || isEuphoric) {
    strategy  = 'Bear Put Spread / Credit Call Spread'
    rationale = 'Price is significantly overextended. Momentum may briefly persist, but risk/reward for new longs is poor. Selling upside calls or buying put spreads can capitalize on expected mean reversion with defined risk.'
    strikeHint = price != null && atr_dollar != null ? `Sell call spread starting ~$${(price + atr_dollar * 0.5).toFixed(2)}` : ''
  } else if (isHighVol && isMomentum) {
    strategy  = 'Bull Call Spread'
    rationale = 'Momentum is strong but elevated implied volatility makes outright calls expensive. A debit call spread reduces cost basis while preserving upside participation within a defined range.'
    strikeHint = price != null && atr_dollar != null ? `Buy ATM call, sell call ~$${(price + atr_dollar * 2).toFixed(2)}` : ''
  } else if (isHighVol && !isMomentum) {
    strategy  = 'Iron Condor / Short Strangle'
    rationale = 'Elevated IV with no clear trend creates premium-selling opportunities. Short strikes placed outside the expected move range offer high probability of profit if the stock remains range-bound.'
    strikeHint = expected_move_pct != null && price != null ? `Short strikes ≈ ±${(expected_move_pct * 1.5).toFixed(1)}% from current price` : ''
  } else if (isOversold) {
    strategy  = 'Cash-Secured Put / Bull Put Spread'
    rationale = 'Oversold conditions with mean-reversion potential. Selling a put below support collects premium while positioning for a bounce — defined risk, positive theta decay works in your favor.'
    strikeHint = price != null && atr_dollar != null ? `Sell put ~$${(price - atr_dollar).toFixed(2)} (1 ATR below price)` : ''
  } else if (trade_type === 'Covered Call Income') {
    strategy  = 'Covered Call'
    rationale = 'Low-volatility income stock. Writing covered calls against a long stock position generates premium yield on top of any dividend income.'
    strikeHint = expected_move_pct != null && price != null ? `Sell call ~${expected_move_pct.toFixed(1)}% OTM = $${(price * (1 + expected_move_pct / 100)).toFixed(2)}` : ''
  } else if (isLowVol) {
    strategy  = 'Long Call / LEAPS'
    rationale = 'Low implied volatility means options are relatively cheap. Buying calls or long-dated LEAPS provides leveraged upside at a lower cost than in high-IV environments — a favorable structural entry.'
    strikeHint = price != null ? `Slight OTM call — strike ~$${(price * 1.03).toFixed(2)}` : ''
  } else {
    strategy  = 'Vertical Call Spread'
    rationale = 'Balanced setup with moderate IV. A debit call spread gives defined risk exposure in the direction of the trend while limiting premium outlay — the standard active trader approach.'
    strikeHint = atr_dollar != null && price != null ? `Buy ATM, sell ~$${(price + atr_dollar * 1.5).toFixed(2)}` : ''
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 space-y-2">
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">⚡ Options Interpretation</span>
        <span className={`text-xs font-bold ${biasColor}`}>{bias} Bias</span>
        <span className="text-xs text-slate-500 italic">{volEnv}</span>
      </div>
      <p className="text-sm font-bold text-indigo-900">{strategy}</p>
      <p className="text-xs text-indigo-800 leading-relaxed">{rationale}</p>
      {strikeHint && <p className="text-xs text-indigo-600 font-mono bg-indigo-100 rounded px-2 py-1">💡 {strikeHint}</p>}
      {expected_move_pct != null && (
        <p className="text-xs text-slate-500">
          Expected daily move: <span className="font-semibold text-slate-700">±{expected_move_pct.toFixed(1)}%</span>
          {atr_dollar != null ? ` (≈ $${atr_dollar.toFixed(2)})` : ''}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis panels
// ─────────────────────────────────────────────────────────────────────────────
function NarrativePanel({ row }: { row: any }) {
  if (!row.explanation) return null
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">💡 Why This Appeared</p>
      <p className="text-sm text-slate-700 leading-relaxed">{row.explanation}</p>
      {(row.bullish_score != null || row.risk_score != null) && (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">📈 Bullish: {row.bullish_score ?? '—'}</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">⚠️ Risk: {row.risk_score ?? '—'}</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">🎯 Net: {row.score}</span>
          {row.percentile_label && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">🏅 {row.percentile_label}</span>}
        </div>
      )}
    </div>
  )
}

function EducationalPanel({ row }: { row: any }) {
  const { rsi, atr_pct, volume_ratio, setup_quality, squeeze } = row
  const insights: { label: string; text: string }[] = []

  if (rsi != null) {
    if (rsi > 80)
      insights.push({ label: 'RSI', text: `At ${rsi.toFixed(1)}, momentum is extreme. Strong trends can stay overbought for extended periods, but the probability of a near-term stall is materially elevated. New longs here carry higher entry risk and warrant a tighter stop.` })
    else if (rsi > 70)
      insights.push({ label: 'RSI', text: `RSI of ${rsi.toFixed(1)} is overbought but not extreme. The trend is intact — however watch for volume decline or a bearish candle as an early reversal warning.` })
    else if (rsi < 30)
      insights.push({ label: 'RSI', text: `RSI of ${rsi.toFixed(1)} signals deeply oversold conditions. A bounce is plausible but requires a catalyst. Avoid catching a falling knife — wait for price stabilization and volume confirmation before entering.` })
  }

  if (atr_pct != null && atr_pct >= 5)
    insights.push({ label: 'Volatility', text: `ATR of ${atr_pct.toFixed(1)}%/day means this stock regularly moves ${(atr_pct * 5).toFixed(0)}%+ in a single week. Strict position sizing is critical — use 25–50% of your normal size to stay within a standard risk budget.` })

  if (squeeze)
    insights.push({ label: 'Volatility Compression', text: `ATR has contracted well below its 20-period average — a "coiling" pattern. Historical analysis shows tight compressions resolve with above-average directional moves. Direction is unknown — wait for a breakout on volume before committing.` })

  if (volume_ratio != null && volume_ratio >= 1.5)
    insights.push({ label: 'Volume', text: `Volume running ${volume_ratio.toFixed(1)}x the 20-day average — elevated volume on a directional move is the hallmark of institutional participation. Low-volume moves are significantly more likely to fade.` })

  if (setup_quality) {
    const desc = setup_quality === 'A+' ? 'multiple high-confidence signals align simultaneously — rare and actionable' :
                 setup_quality === 'A'  ? 'strong alignment across most key factors' :
                 setup_quality === 'B'  ? 'moderate signal quality — look for additional confirmation' :
                                          'mixed or weak signals — smaller sizing appropriate'
    insights.push({ label: 'Setup Quality', text: `Grade ${setup_quality}: ${desc}.` })
  }

  if (!insights.length) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2 mt-3">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">📚 What This Means</p>
      {insights.map(ins => (
        <div key={ins.label} className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-800">{ins.label}: </span>{ins.text}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual stock card
// ─────────────────────────────────────────────────────────────────────────────
function StockCard({ row }: { row: any }) {
  const [expanded, setExpanded] = React.useState(false)
  const [tab, setTab] = React.useState<'zones' | 'options' | 'analysis'>('zones')

  const cats: string[] = row.categories ?? []
  const companyName    = COMPANY_NAMES[row.ticker] ?? null
  const isHot          = row.score >= 7
  const inBuy          = row.in_buy_zone
  const hasSqueeze     = row.squeeze === true || cats.includes('🌀 Volatility Compression')
  const isSpec         = cats.includes('Speculative / High Risk')

  const sortedCats = [...cats].sort((a, b) =>
    (CAT_CONFIG[a]?.priority ?? 5) - (CAT_CONFIG[b]?.priority ?? 5)
  )

  const setupCfg = row.setup_quality ? (SETUP_QUALITY_CONFIG[row.setup_quality] ?? null) : null
  const tradeCfg = row.trade_type    ? (TRADE_TYPE_CONFIG[row.trade_type] ?? null) : null

  const accentBorder =
    isHot      ? 'border-l-4 border-green-500' :
    hasSqueeze ? 'border-l-4 border-indigo-500' :
    isSpec     ? 'border-l-4 border-pink-500' :
                 'border-l-4 border-slate-200'

  const headerBg = inBuy ? 'bg-green-50' : hasSqueeze ? 'bg-indigo-50' : 'bg-white'

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${accentBorder} hover:shadow-md transition-shadow`}>

      {/* ── Header ── */}
      <div className={`px-4 pt-4 pb-3 ${headerBg}`}>
        <div className="flex items-start justify-between gap-3">

          {/* Left: ticker + meta */}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">{row.ticker}</span>
              {companyName && <span className="text-sm text-slate-500 font-medium truncate">{companyName}</span>}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tradeCfg && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tradeCfg.cls}`}>
                  {tradeCfg.icon} {row.trade_type}
                </span>
              )}
              {setupCfg && (
                <Tooltip text={`Setup Quality: ${row.setup_quality} — ${setupCfg.desc}`}>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${setupCfg.cls}`}>
                    {row.setup_quality}
                  </span>
                </Tooltip>
              )}
              {inBuy      && <span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">�� Buy Zone</span>}
              {hasSqueeze && !inBuy && <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full">🌀 Squeeze</span>}
              {row.risk_profile && <span className="text-xs text-slate-400 font-medium">{row.risk_profile}</span>}
            </div>
            {row.confidence != null && (
              <div className="mt-0.5 max-w-[220px]">
                <ConfidenceMeter pct={row.confidence} />
              </div>
            )}
          </div>

          {/* Right: score + price */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <ScoreBadge score={row.score} bullish={row.bullish_score} risk={row.risk_score} percentileLabel={row.percentile_label} />
            {row.price != null && (
              <span className="text-base font-bold text-slate-700 tabular-nums">${Number(row.price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 overflow-x-auto">
        <div className="flex gap-5 min-w-max sm:min-w-0 sm:flex-wrap">
          <RsiBlock rsi={row.rsi} />
          <AtrBlock atrPct={row.atr_pct} atrDollar={row.atr_dollar} />
          <MADistBlock pct={row.ma_distance_pct} label={row.ma_distance_label} />
          <VolBlock v={row.volume_ratio} />
          <RSBlock rs={row.relative_strength_20d} />
          {row.expected_move_pct != null && (
            <MetricBlock label="Exp Move" value={`±${row.expected_move_pct.toFixed(1)}%`} tier="Daily range" valueClass="text-slate-600" />
          )}
          {row.dividend_yield_percent != null && row.dividend_yield_percent > 0 && (
            <MetricBlock label="Dividend" value={`${Number(row.dividend_yield_percent).toFixed(2)}%`} tier="💰 Income" valueClass="text-yellow-700" />
          )}
        </div>
      </div>

      {/* ── Signals row ── */}
      {sortedCats.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
          {sortedCats.map(c => <CategoryBadge key={c} label={c} />)}
        </div>
      )}

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1"
      >
        {expanded ? '▲ Show less' : '▼ Action zones · Options · Analysis'}
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="flex bg-slate-50 border-b border-slate-100">
            {(['zones', 'options', 'analysis'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors
                  ${tab === t ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {t === 'zones' ? '🎯 Zones' : t === 'options' ? '⚡ Options' : '📚 Analysis'}
              </button>
            ))}
          </div>
          <div className="px-4 py-4 space-y-4">
            {tab === 'zones'    && <ActionZonesPanel row={row} />}
            {tab === 'options'  && <OptionsInterpretationCard row={row} />}
            {tab === 'analysis' && <><NarrativePanel row={row} /><EducationalPanel row={row} /></>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main StockTable
// ─────────────────────────────────────────────────────────────────────────────
export default function StockTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>('score')
  const [filter, setFilter]   = React.useState<FilterId>('all')
  const [sortDir, setSortDir] = React.useState<'desc' | 'asc'>('desc')

  const filtered = React.useMemo(() => applyFilter(data, filter), [data, filter])
  const sorted   = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff    = (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
      const ordered = sortDir === 'desc' ? diff : -diff
      return ordered !== 0 ? ordered : (b.score ?? 0) - (a.score ?? 0)
    })
  }, [filtered, sortKey, sortDir])

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-6xl mb-4">📭</span>
        <p className="text-sm font-medium">No scan results — hit Refresh to run a scan</p>
      </div>
    )
  }

  const SORT_OPTIONS = [
    { key: 'score',                 label: 'Score' },
    { key: 'confidence',            label: 'Confidence' },
    { key: 'rsi',                   label: 'RSI' },
    { key: 'atr_pct',               label: 'ATR%' },
    { key: 'volume_ratio',          label: 'Volume' },
    { key: 'relative_strength_20d', label: 'vs SPY' },
    { key: 'ma_distance_pct',       label: 'MA Dist' },
    { key: 'price',                 label: 'Price' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter + sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
                ${filter === f.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>
              {f.icon} {f.label}
              {filter === f.id && filtered.length !== data.length &&
                <span className="ml-0.5 bg-blue-500 text-white rounded-full px-1.5 text-[10px]">{filtered.length}</span>}
            </button>
          ))}
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-xs text-gray-400 hover:text-gray-600 underline px-1">✕ clear</button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0">
          <span className="font-semibold text-slate-500">Sort:</span>
          <select value={sortKey} onChange={e => { setSortKey(e.target.value); setSortDir('desc') }}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-400">
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="px-2 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 font-bold">
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Card grid — 1 col mobile, 2 col xl */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sorted.map((row: any, i: number) => (
          <StockCard key={`${row.ticker}-${i}`} row={row} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-right pr-1">
        {sorted.length} of {data.length} results
        {filter !== 'all' && ` — ${FILTERS.find(f => f.id === filter)?.label}`}
      </p>
    </div>
  )
}
