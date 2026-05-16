import React from 'react'
import ReactDOM from 'react-dom'
import { useWatchlist } from '../context/WatchlistContext'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FilterId = 'all' | 'momentum' | 'oversold' | 'low-vol' | 'dividend' | 'options' | 'extreme' | 'mean-reversion' | 'squeeze' | 'institutional'

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
  'Earnings Soon':             { icon: '📅', cls: 'bg-orange-100 text-orange-800 font-semibold ring-1 ring-orange-200', priority: 2 },
  'Institutional Accumulation': { icon: '🏦', cls: 'bg-emerald-100 text-emerald-800 font-semibold ring-1 ring-emerald-200', priority: 2 },
  'Institutional Distribution': { icon: '🏦', cls: 'bg-red-100 text-red-800 font-semibold ring-1 ring-red-200', priority: 2 },
  'Government Buying':         { icon: '🏛️', cls: 'bg-cyan-100 text-cyan-800 font-semibold ring-1 ring-cyan-200', priority: 2 },
  'Government Cluster Buy':    { icon: '🏛️', cls: 'bg-cyan-600 text-white font-bold ring-2 ring-cyan-200', priority: 1 },
  'Government Selling':        { icon: '🏛️', cls: 'bg-rose-100 text-rose-800 font-semibold ring-1 ring-rose-200', priority: 2 },
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
  'Earnings Volatility Play': { cls: 'bg-orange-100 text-orange-800', icon: '📅' },
  'Political Momentum': { cls: 'bg-cyan-100 text-cyan-800', icon: '🏛️' },
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
const FILTERS: { id: FilterId; label: string; icon: string; tip: string }[] = [
  { id: 'all',            label: 'All',         icon: '🔍', tip: 'Show all scanned stocks sorted by composite score.' },
  { id: 'momentum',       label: 'Momentum',    icon: '🚀', tip: 'Stocks with strong upward price momentum — RSI above 65 and price above both MA20 and MA50. Best for trend-following and breakout continuation plays.' },
  { id: 'oversold',       label: 'Oversold',    icon: '💚', tip: 'Stocks with RSI below 35 — they\'ve sold off hard and may be due for a mean-reversion bounce. Higher risk but strong reward-to-risk if timed correctly.' },
  { id: 'mean-reversion', label: 'Mean Rev',    icon: '🔄', tip: 'Stocks that have pulled back significantly from their average and are set up to snap back. Look for price near or below MA20 with oversold RSI.' },
  { id: 'squeeze',        label: 'Vol Squeeze', icon: '🌀', tip: 'Volatility Compression — ATR has contracted well below its 20-day average. Like a coiled spring: tight ranges historically precede large directional moves. Direction unknown — wait for the breakout.' },
  { id: 'institutional',  label: '13F',         icon: '🏦', tip: 'Stocks with institutional ownership changes from configured 13F data. Because 13F filings are delayed, treat this as conviction context rather than a primary signal.' },
  { id: 'dividend',       label: 'Dividend',    icon: '💰', tip: 'Stocks with a dividend yield above 0. Good candidates for covered call income strategies or income-focused buy-and-hold positions.' },
  { id: 'options',        label: 'High Vol',    icon: '⚡', tip: 'Stocks with ATR% ≥ 3.0 — elevated daily range makes them ideal for options plays (wide premiums, faster moves). Use smaller position sizes.' },
  { id: 'low-vol',        label: 'Low Vol',     icon: '🛡️', tip: 'Stocks with ATR% below 2.0 — stable, low-volatility movers. Great for covered calls, conservative trend holds, or accounts that need to limit drawdown.' },
  { id: 'extreme',        label: 'Elite Score', icon: '🔥', tip: 'Only stocks scoring 8 or higher on the composite signal score. Multiple strong signals aligning at once — the highest-conviction setups in the scan.' },
]

function applyFilter(data: any[], filter: FilterId): any[] {
  const cats = (r: any): string[] => r.categories ?? []
  switch (filter) {
    case 'momentum':       return data.filter(r => cats(r).includes('Momentum'))
    case 'oversold':       return data.filter(r => cats(r).includes('Oversold'))
    case 'mean-reversion': return data.filter(r => r.risk_profile === 'Mean Reversion' || cats(r).includes('Oversold'))
    case 'squeeze':        return data.filter(r => r.squeeze === true || cats(r).includes('🌀 Volatility Compression'))
    case 'institutional':  return data.filter(r => r.institutional_ownership_delta_pct != null)
    case 'dividend':       return data.filter(r => cats(r).includes('Dividend'))
    case 'options':        return data.filter(r => r.atr_pct != null && r.atr_pct >= 3.0)
    case 'low-vol':        return data.filter(r => r.atr_pct != null && r.atr_pct < 2.0)
    case 'extreme':        return data.filter(r => r.score >= 8)
    default:               return data
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Tooltip — fixed-position so it's never clipped by overflow:hidden parents
// ─────────────────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null)

  const show = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPos({ x: rect.left + rect.width / 2, y: rect.top })
  }
  const hide = () => setPos(null)

  return (
    <span className="cursor-help" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {pos && ReactDOM.createPortal(
        <span
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className="w-64 text-xs text-white bg-slate-800 rounded-lg px-3 py-2 shadow-2xl whitespace-normal text-center leading-relaxed"
        >
          {text}
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -5, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #1e293b' }} />
        </span>,
        document.body
      )}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricBlock — value + tier label + narrative in a column
// labelTip  = "what is this metric" shown on label hover
// valueTip  = "what does this specific number mean" shown on value hover
// ─────────────────────────────────────────────────────────────────────────────
function MetricBlock({ label, value, tier, narrative, valueClass, labelTip, valueTip }: {
  label: string; value: string; tier?: string; narrative?: string; valueClass?: string
  labelTip?: string; valueTip?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[68px]">
      {labelTip
        ? <Tooltip text={labelTip}><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-dotted border-slate-300">{label}</span></Tooltip>
        : <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      }
      {valueTip
        ? <Tooltip text={valueTip}><span className={`text-lg font-black tabular-nums leading-tight ${valueClass ?? 'text-slate-800'}`}>{value}</span></Tooltip>
        : <span className={`text-lg font-black tabular-nums leading-tight ${valueClass ?? 'text-slate-800'}`}>{value}</span>
      }
      {tier      && <span className="text-xs font-semibold text-slate-600 leading-snug">{tier}</span>}
      {narrative && <span className="text-[11px] text-slate-400 leading-snug hidden sm:block">{narrative}</span>}
    </div>
  )
}

function formatExchangeLabel(exchange?: string | null, exchangeName?: string | null) {
  const code = typeof exchange === 'string' ? exchange.trim().toUpperCase() : ''
  const name = typeof exchangeName === 'string' ? exchangeName.trim() : ''
  const raw = `${code} ${name}`.toUpperCase()

  if (raw.includes('NASDAQ') || ['NMS', 'NCM', 'NGM'].includes(code)) return 'NASDAQ'
  if (raw.includes('NYSE') || code === 'NYQ') return 'NYSE'
  if (raw.includes('AMEX') || code === 'ASE') return 'NYSE AM'
  return name || code || null
}

function ExchangeBadge({ exchange, exchangeName }: { exchange?: string | null; exchangeName?: string | null }) {
  const label = formatExchangeLabel(exchange, exchangeName)
  if (!label) return null

  const code = typeof exchange === 'string' ? exchange.trim().toUpperCase() : ''
  const name = typeof exchangeName === 'string' ? exchangeName.trim() : ''
  const tip = name || code ? `Exchange: ${name || label}${code ? ` (${code})` : ''}` : `Exchange: ${label}`

  return (
    <Tooltip text={tip}>
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric implementations
// ─────────────────────────────────────────────────────────────────────────────
function RsiBlock({ rsi }: { rsi: number | null }) {
  const labelTip = 'RSI (Relative Strength Index) — measures momentum on a 0–100 scale. Above 70 = overbought, below 30 = oversold. Best used to spot exhaustion or bounce setups, not as a standalone buy/sell signal.'
  if (rsi == null) return <MetricBlock label="RSI" value="—" labelTip={labelTip} />
  const { tier, cls, narrative } =
    rsi > 85 ? { tier: '🔥 Extremely OB',    cls: 'text-red-700',     narrative: 'Reversal risk very high' } :
    rsi > 75 ? { tier: '⚠️ Overbought',      cls: 'text-orange-600',  narrative: 'Caution on new longs' } :
    rsi > 65 ? { tier: '🚀 Strong Momentum',  cls: 'text-blue-600',   narrative: 'Trend established' } :
    rsi < 25 ? { tier: '💀 Deeply Oversold',  cls: 'text-purple-700', narrative: 'Bounce candidate' } :
    rsi < 35 ? { tier: '💚 Oversold',         cls: 'text-emerald-600',narrative: 'Mean reversion likely' } :
    rsi < 45 ? { tier: '🔻 Weakening',        cls: 'text-slate-600',  narrative: 'Momentum fading' } :
               { tier: 'Neutral',              cls: 'text-slate-700',  narrative: 'No extreme reading' }
  const valueTip =
    rsi > 85 ? `RSI ${rsi.toFixed(1)} — extremely overbought. The stock has surged too far, too fast. High probability of at least a short-term pullback. Avoid new longs; watch for reversal candles.` :
    rsi > 75 ? `RSI ${rsi.toFixed(1)} — overbought. Momentum is strong but stretched. Fine to hold existing positions, but entering here increases risk of buying the top.` :
    rsi > 65 ? `RSI ${rsi.toFixed(1)} — strong uptrend momentum. Not yet overextended. A pullback to 50–60 RSI would be a cleaner entry.` :
    rsi < 25 ? `RSI ${rsi.toFixed(1)} — deeply oversold. Extreme selling pressure. A technical bounce is likely but direction risk remains high — wait for a stabilization candle before entering.` :
    rsi < 35 ? `RSI ${rsi.toFixed(1)} — oversold. Mean reversion setup is forming. Watch for volume pickup and a higher close to confirm the turn.` :
    rsi < 45 ? `RSI ${rsi.toFixed(1)} — weakening momentum. Below 45 often signals sellers have control short-term. Not a buy signal on its own.` :
               `RSI ${rsi.toFixed(1)} — neutral range (45–65). No extreme reading. Look to other signals (volume, MA distance) for directional conviction.`
  return <MetricBlock label="RSI" value={rsi.toFixed(1)} tier={tier} narrative={narrative} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
}

function AtrBlock({ atrPct, atrDollar }: { atrPct: number | null; atrDollar?: number | null }) {
  const labelTip = 'ATR% (Average True Range %) — the average daily price swing as a percentage of price, measured over 14 days. Higher ATR = bigger moves = more risk per share. Use this to size your position and set stop-losses.'
  if (atrPct == null) return <MetricBlock label="ATR%" value="—" labelTip={labelTip} />
  const dollar = atrDollar != null ? ` ($${atrDollar.toFixed(2)})` : ''
  const { tier, cls, narrative } =
    atrPct >= 7   ? { tier: '💀 Extreme',   cls: 'text-red-700',    narrative: `Dangerous swings${dollar}` } :
    atrPct >= 5   ? { tier: '🔥 Very High', cls: 'text-red-600',    narrative: `Options-grade vol${dollar}` } :
    atrPct >= 3   ? { tier: '⚡ High',      cls: 'text-orange-500', narrative: `Elevated swings${dollar}` } :
    atrPct >= 1.5 ? { tier: 'Moderate',     cls: 'text-yellow-600', narrative: `Normal range${dollar}` } :
                    { tier: '🛡️ Low',        cls: 'text-green-600',  narrative: `Stable — cheap options${dollar}` }
  const valueTip =
    atrPct >= 7   ? `ATR ${atrPct.toFixed(1)}%/day${dollar} — extreme volatility. This stock can gap ${(atrPct*5).toFixed(0)}%+ in a single week. Use 25% of normal position size. Options premiums will be expensive.` :
    atrPct >= 5   ? `ATR ${atrPct.toFixed(1)}%/day${dollar} — very high volatility. Expect ${(atrPct*5).toFixed(0)}%+ weekly swings. Great for options plays but dangerous for unleveraged longs without tight stops.` :
    atrPct >= 3   ? `ATR ${atrPct.toFixed(1)}%/day${dollar} — elevated daily range. Normal weekly swing is ~${(atrPct*5).toFixed(0)}%. Size down to half normal if playing a breakout.` :
    atrPct >= 1.5 ? `ATR ${atrPct.toFixed(1)}%/day${dollar} — moderate volatility. Typical for mid-cap stocks. Weekly range around ${(atrPct*5).toFixed(0)}% — manageable with standard position sizing.` :
                    `ATR ${atrPct.toFixed(1)}%/day${dollar} — low volatility. Stable mover. Options will be cheap. Good for covered calls or longer-term trend holds.`
  return <MetricBlock label="ATR%" value={`${atrPct.toFixed(1)}%`} tier={tier} narrative={narrative} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
}

function EarningsBlock({ date, days }: { date?: string | null; days?: number | null }) {
  const labelTip = 'Upcoming earnings date — near-term earnings can create gap risk and post-event IV crush. Directional options are riskier inside the final week before the report.'
  if (!date || days == null) return <MetricBlock label="Earnings" value="—" labelTip={labelTip} />
  const soon = days >= 0 && days <= 7
  const tier = days < 0 ? 'Reported' : days === 0 ? 'Today' : days <= 7 ? 'This week' : days <= 21 ? 'Soon' : 'Later'
  const cls = soon ? 'text-orange-600' : days >= 0 && days <= 21 ? 'text-amber-600' : 'text-slate-700'
  const value = days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? 'Today' : `${days}d`
  const valueTip = days >= 0
    ? `Next earnings date: ${date}. ${days <= 7 ? 'Event risk is high; consider defined-risk or volatility-aware options structures.' : 'Watch for implied volatility to rise as the date approaches.'}`
    : `Most recent earnings date: ${date}.`
  return <MetricBlock label="Earnings" value={value} tier={tier} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
}

function InstitutionBlock({ delta, trend }: { delta?: number | null; trend?: string | null }) {
  const labelTip = 'Institutional ownership change — quarter-over-quarter change from parsed 13F ownership snapshots. Positive values suggest accumulation; negative values suggest distribution.'
  if (delta == null) return <MetricBlock label="Inst" value="—" labelTip={labelTip} />
  const sign = delta > 0 ? '+' : ''
  const cls = delta >= 2 ? 'text-emerald-600' : delta <= -2 ? 'text-red-600' : 'text-slate-700'
  const valueTip = `${sign}${delta.toFixed(1)}% institutional ownership change. ${trend || 'Stable'} based on the configured ownership data source.`
  return <MetricBlock label="Inst" value={`${sign}${delta.toFixed(1)}%`} tier={trend || 'Stable'} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
}

function GovernmentTradeBlock({ signal, buyCount, sellCount, netAmount, members }: {
  signal?: string | null
  buyCount?: number | null
  sellCount?: number | null
  netAmount?: number | null
  members?: string[] | null
}) {
  const labelTip = 'Government trade disclosures — recent STOCK Act or senior-official disclosures normalized from the configured provider/cache. These filings are delayed, so this is a confirmation signal, not a primary thesis.'
  const buys = buyCount ?? 0
  const sells = sellCount ?? 0
  if (!signal && buys === 0 && sells === 0) return <MetricBlock label="Gov" value="—" labelTip={labelTip} />
  const net = netAmount ?? 0
  const amount = Math.abs(net) >= 1_000_000 ? `$${(Math.abs(net) / 1_000_000).toFixed(1)}M` : `$${Math.abs(net).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const cls = signal === 'Government Cluster Buy' ? 'text-cyan-700' : signal === 'Government Buying' ? 'text-emerald-600' : signal === 'Government Selling' ? 'text-red-600' : 'text-slate-700'
  const tier = signal === 'Government Cluster Buy' ? 'Cluster buy' : signal === 'Government Buying' ? 'Net buy' : signal === 'Government Selling' ? 'Net sell' : `${buys}B/${sells}S`
  const value = net < 0 ? `-${amount}` : amount
  const memberText = members?.length ? ` Members: ${members.slice(0, 3).join(', ')}.` : ''
  const valueTip = `${signal || 'Government disclosure activity'}: ${buys} buys, ${sells} sells, net ${value}.${memberText} Use lightly because disclosures can lag the actual trade.`
  return <MetricBlock label="Gov" value={value} tier={tier} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
}

function MADistBlock({ pct, label }: { pct: number | null; label: string | null }) {
  const labelTip = 'vs MA20 — how far the current price is above or below the 20-day moving average. Stocks extended far above MA20 are vulnerable to pullbacks; stocks far below may be oversold bounce candidates.'
  if (pct == null) return <MetricBlock label="vs MA20" value="—" labelTip={labelTip} />
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
  const valueTip =
    pct > 20  ? `${sign}${pct.toFixed(1)}% above MA20 — parabolic extension. Historical mean reversion from this level is very likely. Only hold if already in the position; do not chase entries here.` :
    pct > 12  ? `${sign}${pct.toFixed(1)}% above MA20 — euphoric extension. The trend is strong but buying here means you're paying up significantly above fair value on this timeframe.` :
    pct > 8   ? `${sign}${pct.toFixed(1)}% above MA20 — extended. A healthy pullback to the MA would be ~${pct.toFixed(0)}% lower. Wait for consolidation before adding.` :
    pct > 5   ? `${sign}${pct.toFixed(1)}% above MA20 — moderately extended but trend is intact. Fine for momentum plays; use a tighter stop.` :
    pct > 2   ? `${sign}${pct.toFixed(1)}% above MA20 — healthy. Slightly above average — price is in the sweet spot, not chasing, not lagging.` :
    pct > -2  ? `${pct.toFixed(1)}% from MA20 — right at the moving average. This is a key decision point — a bounce here is bullish, a failure is bearish.` :
    pct > -5  ? `${pct.toFixed(1)}% below MA20 — minor pullback into potential support. Watch for a reversal candle here as a re-entry signal.` :
    pct > -10 ? `${pct.toFixed(1)}% below MA20 — meaningful pullback. Could be a mean reversion setup if RSI is also oversold. Risk remains to the downside until price recovers MA20.` :
                `${pct.toFixed(1)}% below MA20 — deep selloff. The stock is in clear downtrend territory on this timeframe. Only for contrarian bounce traders with tight stops.`
  return (
    <MetricBlock
      label="vs MA20"
      value={`${sign}${pct.toFixed(1)}%`}
      tier={label ?? undefined}
      narrative={narrative}
      valueClass={cls}
      labelTip={labelTip}
      valueTip={valueTip}
    />
  )
}

function VolBlock({ v }: { v?: number | null }) {
  const labelTip = 'Volume Ratio — today\'s volume divided by the 20-day average volume. 1.0x = normal day. Above 1.5x signals institutional participation. Below 0.7x means low conviction — moves on thin volume often reverse.'
  if (v == null) return <MetricBlock label="Volume" value="—" labelTip={labelTip} />
  const { tier, cls, narrative } =
    v >= 3.0 ? { tier: '🔊 Massive',  cls: 'text-violet-800', narrative: 'Major institutional flow' } :
    v >= 2.0 ? { tier: '📢 Heavy',    cls: 'text-violet-700', narrative: 'Strong conviction' } :
    v >= 1.5 ? { tier: '📈 Elevated', cls: 'text-violet-600', narrative: 'Above-avg participation' } :
    v < 0.7  ? { tier: '🔇 Thin',     cls: 'text-gray-400',   narrative: 'Low conviction — caution' } :
               { tier: 'Normal',       cls: 'text-slate-600',  narrative: 'Average activity' }
  const valueTip =
    v >= 3.0 ? `${v.toFixed(2)}x average volume — massive institutional flow. When a stock moves on 3x+ volume, the big money is clearly involved. This signal has the highest follow-through rate.` :
    v >= 2.0 ? `${v.toFixed(2)}x average volume — heavy participation. Strong confirmation of the price move. Significantly more reliable than a low-volume move in the same direction.` :
    v >= 1.5 ? `${v.toFixed(2)}x average volume — elevated, above-average activity. Adds credibility to the signal. Not a slam dunk, but meaningfully better than baseline.` :
    v < 0.7  ? `${v.toFixed(2)}x average volume — well below normal. Low-conviction move. Price changes on thin volume are far more likely to fade when full participation returns.` :
               `${v.toFixed(2)}x average volume — normal participation. Neither confirms nor denies the signal strength. Look to RSI and MA distance for directional conviction.`
  return <MetricBlock label="Volume" value={`${v.toFixed(2)}x`} tier={tier} narrative={narrative} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
}

function RSBlock({ rs }: { rs?: number | null }) {
  const labelTip = 'vs SPY — this stock\'s 20-day return minus SPY\'s 20-day return. Positive = outperforming the market. Negative = underperforming. Strong positive relative strength is one of the most reliable filters for sustained momentum.'
  if (rs == null) return <MetricBlock label="vs SPY" value="—" labelTip={labelTip} />
  const sign = rs > 0 ? '+' : ''
  const { tier, cls } =
    rs > 15  ? { tier: '🏆 Market Leader',   cls: 'text-green-700' } :
    rs > 5   ? { tier: '↗️ Outperforming',   cls: 'text-green-600' } :
    rs > -5  ? { tier: '↔️ Inline',          cls: 'text-slate-600' } :
    rs > -15 ? { tier: '↘️ Underperforming', cls: 'text-red-500' } :
               { tier: '🐢 Laggard',         cls: 'text-red-700' }
  const valueTip =
    rs > 15  ? `${sign}${rs.toFixed(1)}% vs SPY — market leader. This stock is crushing the index by ${rs.toFixed(1)}% over 20 days. Institutions are clearly rotating money into this name.` :
    rs > 5   ? `${sign}${rs.toFixed(1)}% vs SPY — outperforming. Beating the market by ${rs.toFixed(1)}% over the past month. A good sign that sector or stock-specific tailwinds are present.` :
    rs > -5  ? `${rs.toFixed(1)}% vs SPY — roughly inline with the market. Neither a tailwind nor a headwind. Other signals matter more for this stock.` :
    rs > -15 ? `${rs.toFixed(1)}% vs SPY — underperforming the market by ${Math.abs(rs).toFixed(1)}%. Money is rotating away from this stock. Requires a strong catalyst to reverse.` :
               `${rs.toFixed(1)}% vs SPY — significant laggard. Trailing the market by ${Math.abs(rs).toFixed(1)}% in 20 days. Be very cautious — only consider on extreme oversold bounce setups.`
  return <MetricBlock label="vs SPY" value={`${sign}${rs.toFixed(1)}%`} tier={tier} valueClass={cls} labelTip={labelTip} valueTip={valueTip} />
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
  const { atr_pct, atr_dollar, expected_move_pct, price, rsi, squeeze, trade_type, categories, ma_distance_pct, days_to_earnings, institutional_ownership_delta_pct, gov_trade_signal } = row
  const cats: string[]  = categories ?? []
  const isHighVol       = atr_pct != null && atr_pct >= 5
  const isLowVol        = atr_pct != null && atr_pct < 2
  const isOversold      = cats.includes('Oversold') || (rsi != null && rsi < 35)
  const isMomentum      = cats.includes('Momentum')
  const hasSqueeze      = squeeze === true || cats.includes('🌀 Volatility Compression')
  const isParabolic     = (ma_distance_pct ?? 0) > 20
  const isEuphoric      = !isParabolic && (ma_distance_pct ?? 0) > 12
  const earningsSoon    = days_to_earnings != null && days_to_earnings >= 0 && days_to_earnings <= 7
  const instAccum       = institutional_ownership_delta_pct != null && institutional_ownership_delta_pct >= 2
  const govBuying       = gov_trade_signal === 'Government Buying' || gov_trade_signal === 'Government Cluster Buy'
  const govSelling      = gov_trade_signal === 'Government Selling'

  const bias      = earningsSoon ? 'Event Risk' : govBuying && isMomentum ? 'Bullish + Alt Data' : govSelling ? 'Caution — Selling' : isMomentum && !isParabolic ? 'Bullish' : isOversold ? 'Neutral-to-Bullish' : isParabolic ? 'Caution — Extended' : 'Neutral'
  const biasColor = bias === 'Bullish' ? 'text-green-700' : bias === 'Neutral-to-Bullish' ? 'text-blue-700' : 'text-orange-700'
  const volEnv    = earningsSoon ? 'Earnings IV — crush risk' : isHighVol ? 'High IV — expensive options' : isLowVol ? 'Low IV — cheap options' : hasSqueeze ? 'Compressed IV — pre-expansion' : 'Moderate IV'

  let strategy = '', rationale = '', strikeHint = ''
  if (earningsSoon) {
    strategy  = instAccum && isMomentum ? 'Defined-Risk Bull Call Spread' : 'Defined-Risk Earnings Straddle / Iron Condor'
    rationale = instAccum && isMomentum
      ? 'Earnings are close, so avoid naked directional premium. Institutional accumulation and momentum support a bullish thesis, but a call spread keeps risk defined through the event and limits IV-crush damage.'
      : 'The earnings event can overwhelm technical signals. Use defined-risk volatility structures only if the expected move is mispriced; otherwise wait for the report and trade the reaction.'
    strikeHint = expected_move_pct != null && price != null ? `Anchor strikes around the expected move: ±${expected_move_pct.toFixed(1)}% from $${price.toFixed(2)}` : ''
  } else if (govBuying && isMomentum) {
    strategy  = 'Bull Call Spread / LEAPS Call Spread'
    rationale = 'Government buying is delayed, but when it aligns with price momentum it can act as alternative-data confirmation. Prefer defined-risk upside exposure or longer-dated spreads so the thesis has time to develop.'
    strikeHint = price != null && atr_dollar != null ? `Buy near ATM, sell ~$${(price + atr_dollar * 2).toFixed(2)}; use longer expirations if liquidity allows` : ''
  } else if (govBuying && isLowVol) {
    strategy  = 'Long Call / LEAPS'
    rationale = 'Political buying plus low volatility favors longer-dated optionality. Cheap premium gives time for any policy or procurement tailwind to be recognized without overpaying for near-term IV.'
    strikeHint = price != null ? `Consider 3-8% OTM longer-dated calls around $${(price * 1.05).toFixed(2)}` : ''
  } else if (govSelling && (isParabolic || isEuphoric)) {
    strategy  = 'Bear Put Spread / Call Credit Spread'
    rationale = 'Government selling is only a light warning, but when it coincides with an extended chart, defined-risk bearish premium structures become more attractive than chasing upside.'
    strikeHint = price != null && atr_dollar != null ? `Use defined-risk spreads beyond ~$${(price + atr_dollar).toFixed(2)} resistance` : ''
  } else if (hasSqueeze) {
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

function formatMoney(value: any) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n === 0) return '—'
  const sign = n > 0 ? '+' : '-'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

function InstitutionalNotesPanel({ row }: { row: any }) {
  const delta = row.institutional_ownership_delta_pct
  const notable: string[] = row.institutional_13f_notable ?? []
  const managers: string[] = row.institutional_13f_top_managers ?? []
  const newManagers: string[] = row.institutional_13f_new_managers ?? []
  if (delta == null && notable.length === 0 && managers.length === 0 && newManagers.length === 0) return null

  const sign = Number(delta || 0) > 0 ? '+' : ''
  const deltaText = delta == null ? '—' : `${sign}${Number(delta).toFixed(1)}%`
  const trendClass = Number(delta || 0) >= 2
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : Number(delta || 0) <= -2
      ? 'text-red-700 bg-red-50 border-red-200'
      : 'text-slate-700 bg-slate-50 border-slate-200'

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🏦 13F Institutional Notes</p>
        <span className={`rounded border px-2 py-0.5 text-xs font-black ${trendClass}`}>
          {deltaText} {row.institutional_ownership_trend || '13F'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">Value Δ</div>
          <div className="font-black text-slate-700">{formatMoney(row.institutional_13f_value_delta)}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">Managers</div>
          <div className="font-black text-slate-700">{row.institutional_13f_manager_count ?? '—'}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">Period</div>
          <div className="font-black text-slate-700">{row.institutional_13f_latest_period || 'latest'}</div>
        </div>
      </div>
      {notable.length > 0 && (
        <div className="space-y-1 text-xs text-slate-700">
          {notable.slice(0, 3).map(note => <div key={note}>{note}</div>)}
        </div>
      )}
      {newManagers.length > 0 && <div className="text-xs text-slate-600"><span className="font-bold">New holders:</span> {newManagers.slice(0, 5).join(', ')}</div>}
      {managers.length > 0 && <div className="text-xs text-slate-600"><span className="font-bold">Top managers:</span> {managers.slice(0, 5).join(', ')}</div>}
      <p className="text-[11px] leading-relaxed text-slate-400">13F data can lag up to 45 days, so this is conviction context rather than a live trade signal.</p>
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
  const [tab, setTab] = React.useState<'chart' | 'news' | 'zones' | 'options' | 'analysis'>('chart')
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const inWatchlist = isInWatchlist(row.ticker)

  const cats: string[] = row.categories ?? []
  const companyName    = COMPANY_NAMES[row.ticker] ?? row.company_name ?? null
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
              <ExchangeBadge exchange={row.exchange} exchangeName={row.exchange_name} />
            </div>
            {companyName && (
              <div className="text-sm font-semibold text-slate-600 leading-snug truncate max-w-full">
                {companyName}
              </div>
            )}
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
              {row.news_catalyst && (
                <Tooltip text={row.news_headline ? `"${row.news_headline}"` : row.news_catalyst}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm cursor-default
                    ${(row.news_boost ?? 0) >= 2 ? 'bg-amber-400 text-amber-900' : (row.news_boost ?? 0) <= -2 ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                    {row.news_catalyst}
                  </span>
                </Tooltip>
              )}
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
            <button
              onClick={() => inWatchlist ? removeFromWatchlist(row.ticker) : addToWatchlist(row)}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`text-xl leading-none transition-transform hover:scale-125 active:scale-95 ${inWatchlist ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'}`}
            >
              {inWatchlist ? '★' : '☆'}
            </button>
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
          <EarningsBlock date={row.next_earnings_date} days={row.days_to_earnings} />
          <InstitutionBlock delta={row.institutional_ownership_delta_pct} trend={row.institutional_ownership_trend} />
          <GovernmentTradeBlock
            signal={row.gov_trade_signal}
            buyCount={row.gov_trade_buy_count_90d}
            sellCount={row.gov_trade_sell_count_90d}
            netAmount={row.gov_trade_net_amount_90d}
            members={row.gov_trade_members}
          />
          <MADistBlock pct={row.ma_distance_pct} label={row.ma_distance_label} />
          <VolBlock v={row.volume_ratio} />
          <RSBlock rs={row.relative_strength_20d} />
          {row.expected_move_pct != null && (
            <MetricBlock
              label="Exp Move"
              value={`±${row.expected_move_pct.toFixed(1)}%`}
              tier="Daily range"
              valueClass="text-slate-600"
              labelTip="Expected Move — estimated daily price range based on ATR and implied volatility. This is the ±% the market is pricing in for a typical day."
              valueTip={`±${row.expected_move_pct.toFixed(1)}% expected daily move. A $${row.price != null ? (row.price * row.expected_move_pct / 100).toFixed(2) : '?'} swing on a $${row.price != null ? row.price.toFixed(2) : '?'} stock. Use this to set realistic intraday targets and stop-loss distances.`}
            />
          )}
          {row.dividend_yield_percent != null && row.dividend_yield_percent > 0 && (
            <MetricBlock
              label="Dividend"
              value={`${Number(row.dividend_yield_percent).toFixed(2)}%`}
              tier="💰 Income"
              valueClass="text-yellow-700"
              labelTip="Dividend Yield — annual dividend as a percentage of the current stock price. Higher yield = more income, but very high yields can signal distress. Best used alongside trend signals."
              valueTip={`${Number(row.dividend_yield_percent).toFixed(2)}% annual yield. ${row.dividend_yield_percent >= 6 ? 'Unusually high — verify the dividend is sustainable and not at risk of being cut.' : row.dividend_yield_percent >= 3 ? 'Solid income yield. Attractive for income-focused strategies like covered calls or buy-and-hold.' : 'Modest yield. Adds a small income cushion but the main thesis should be price appreciation.'}`}
            />
          )}
        </div>
      </div>

      {/* ── Signals row ── */}
      {sortedCats.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
          {sortedCats.map(c => <CategoryBadge key={c} label={c} />)}
        </div>
      )}

      {/* ── Detail tabs ── */}
      <div className="flex bg-slate-50 border-t border-slate-100 overflow-x-auto">
        {(['chart', 'news', 'zones', 'options', 'analysis'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setExpanded(true) }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap px-3
              ${expanded && tab === t ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-blue-50'}`}>
            {t === 'chart' ? '📈 Chart' : t === 'news' ? '📰 News' : t === 'zones' ? '🎯 Zones' : t === 'options' ? '⚡ Options' : '📚 Analysis'}
          </button>
        ))}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-slate-600"
          >
            Hide
          </button>
        )}
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t border-slate-100">
          <div className="px-4 py-4 space-y-4">
            {tab === 'chart'    && <TradingViewChart ticker={row.ticker} />}
            {tab === 'news'     && <NewsPanel row={row} />}
            {tab === 'zones'    && <ActionZonesPanel row={row} />}
            {tab === 'options'  && <OptionsInterpretationCard row={row} />}
            {tab === 'analysis' && <><NarrativePanel row={row} /><InstitutionalNotesPanel row={row} /><EducationalPanel row={row} /></>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// News panel — fetches on mount, shows headlines with publisher + age
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8001'
const DEMO_MODE = (import.meta as any).env?.VITE_DEMO_MODE === 'true'

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function staticArticlesForRow(row: any): any[] {
  const articles = row.news_articles ?? row.news ?? row.articles
  if (Array.isArray(articles) && articles.length) return articles
  if (row.news_headline) {
    return [{
      title: row.news_headline,
      publisher: row.news_catalyst || 'Scanner news signal',
      url: '',
      published_at: null,
      snippet: row.news_catalyst ? `Detected catalyst: ${row.news_catalyst}` : '',
    }]
  }
  return []
}

function NewsPanel({ row }: { row: any }) {
  const ticker = row.ticker
  const [articles, setArticles] = React.useState<any[] | null>(null)
  const [error, setError]       = React.useState<string | null>(null)

  React.useEffect(() => {
    if (DEMO_MODE) {
      setArticles(staticArticlesForRow(row))
      setError(null)
      return
    }
    setArticles(null); setError(null)
    fetch(`${API_BASE}/news/${ticker}?max=6`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => setArticles(d.articles || []))
      .catch(e => setError(`Failed to load news (${e})`))
  }, [ticker, row])

  if (error) return <p className="text-xs text-red-500">{error}</p>
  if (!articles) return (
    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
      <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Loading news…
    </div>
  )
  if (!articles.length) return (
    <p className="text-xs text-slate-400 italic">
      No recent news found.
    </p>
  )

  return (
    <div className="space-y-2.5">
      {articles.map((a, i) => {
        const hasUrl = Boolean(a.url)
        const CardTag = hasUrl ? 'a' : 'div'
        return (
        <CardTag key={i} href={hasUrl ? a.url : undefined} target={hasUrl ? '_blank' : undefined} rel={hasUrl ? 'noopener noreferrer' : undefined}
          className={`flex flex-col gap-0.5 p-2.5 rounded-lg border border-slate-200 transition-colors group ${hasUrl ? 'hover:border-blue-300 hover:bg-blue-50' : 'bg-slate-50'}`}>
          <span className={`text-sm font-semibold leading-snug ${hasUrl ? 'text-slate-800 group-hover:text-blue-700' : 'text-slate-700'}`}>{a.title}</span>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            {a.publisher && <span className="font-medium text-slate-500">{a.publisher}</span>}
            {a.publisher && a.published_at && <span>·</span>}
            {a.published_at && <span>{timeAgo(a.published_at)}</span>}
          </div>
          {a.snippet && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5">{a.snippet}</p>
          )}
        </CardTag>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TradingView embedded chart
// ─────────────────────────────────────────────────────────────────────────────
function TradingViewChart({ ticker }: { ticker: string }) {
  const containerId = `tv_${ticker}_${Math.random().toString(36).slice(2, 7)}`
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (!(window as any).TradingView) return
      new (window as any).TradingView.widget({
        container_id: containerId,
        symbol: ticker,
        interval: 'D',
        timezone: 'America/New_York',
        theme: 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        height: 400,
        width: '100%',
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
      })
    }
    ref.current.appendChild(script)

    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [ticker])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">📈 {ticker} — Daily Chart (TradingView)</span>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${ticker}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline"
        >
          Open full screen ↗
        </a>
      </div>
      <div id={containerId} ref={ref} className="rounded-lg overflow-hidden border border-slate-200" />
    </div>
  )
}


export default function StockTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>('featured_rank')
  const [filter, setFilter]   = React.useState<FilterId>('all')
  const [sortDir, setSortDir] = React.useState<'desc' | 'asc'>('desc')

  const filtered = React.useMemo(() => applyFilter(data, filter), [data, filter])
  const sorted   = React.useMemo(() => {
    if (sortKey === 'featured_rank') {
      return [...filtered].sort((a, b) => {
        const aRank = a.featured_rank ?? data.indexOf(a) + 1
        const bRank = b.featured_rank ?? data.indexOf(b) + 1
        return sortDir === 'desc' ? aRank - bRank : bRank - aRank
      })
    }
    return [...filtered].sort((a, b) => {
      const diff    = (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
      const ordered = sortDir === 'desc' ? diff : -diff
      return ordered !== 0 ? ordered : (b.score ?? 0) - (a.score ?? 0)
    })
  }, [data, filtered, sortKey, sortDir])

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-6xl mb-4">📭</span>
        <p className="text-sm font-medium">No scan results available from the latest nightly run</p>
      </div>
    )
  }

  const SORT_OPTIONS = [
    { key: 'featured_rank',         label: 'Featured' },
    { key: 'score',                 label: 'Score' },
    { key: 'confidence',            label: 'Confidence' },
    { key: 'rsi',                   label: 'RSI' },
    { key: 'atr_pct',               label: 'ATR%' },
    { key: 'volume_ratio',          label: 'Volume' },
    { key: 'relative_strength_20d', label: 'vs SPY' },
    { key: 'days_to_earnings',      label: 'Earnings' },
    { key: 'institutional_ownership_delta_pct', label: 'Inst' },
    { key: 'gov_trade_net_amount_90d', label: 'Gov' },
    { key: 'dividend_yield_percent', label: 'Dividend' },
    { key: 'ma_distance_pct',       label: 'MA Dist' },
    { key: 'price',                 label: 'Price' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter + sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <Tooltip key={f.id} text={f.tip}>
              <button onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all
                  ${filter === f.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>
                {f.icon} {f.label}
                {filter === f.id && filtered.length !== data.length &&
                  <span className="ml-0.5 bg-blue-500 text-white rounded-full px-1.5 text-[10px]">{filtered.length}</span>}
              </button>
            </Tooltip>
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
