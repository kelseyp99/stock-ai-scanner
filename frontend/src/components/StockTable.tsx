import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FilterId = 'all' | 'momentum' | 'oversold' | 'low-vol' | 'dividend' | 'options' | 'extreme' | 'mean-reversion' | 'squeeze'

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip cursor-help">
      {children}
      <span className="pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 text-xs text-white bg-slate-800 rounded-lg px-2.5 py-1.5 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-normal text-center">
        {text}
      </span>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Category config
// ─────────────────────────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: string; cls: string }> = {
  'Momentum':                    { icon: '🚀', cls: 'bg-blue-500 text-white' },
  'Pullback Risk':               { icon: '⚠️', cls: 'bg-orange-400 text-white' },
  'Oversold':                    { icon: '🔻', cls: 'bg-emerald-500 text-white' },
  'Breakout Volume':             { icon: '📈', cls: 'bg-violet-500 text-white' },
  'Dividend':                    { icon: '💰', cls: 'bg-yellow-400 text-gray-900' },
  'High Volatility':             { icon: '⚡', cls: 'bg-red-400 text-white' },
  'Extreme Volatility':          { icon: '🔥', cls: 'bg-red-600 text-white font-bold' },
  'Weak Trend':                  { icon: '😴', cls: 'bg-gray-300 text-gray-700' },
  'Speculative / High Risk':     { icon: '🎲', cls: 'bg-pink-500 text-white font-bold' },
  'Market Leader':               { icon: '🏆', cls: 'bg-green-500 text-white font-bold' },
  'Market Laggard':              { icon: '🐢', cls: 'bg-slate-400 text-white' },
  'Bullish Crossover Setup':     { icon: '🔀', cls: 'bg-teal-500 text-white font-bold' },
  'Bearish Crossover Risk':      { icon: '🔁', cls: 'bg-amber-600 text-white font-bold' },
  'MA Converging':               { icon: '〰️', cls: 'bg-sky-400 text-white' },
  '🌀 Volatility Compression':   { icon: '🌀', cls: 'bg-indigo-500 text-white font-bold' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk profile config
// ─────────────────────────────────────────────────────────────────────────────
const RISK_PROFILE_CONFIG: Record<string, { icon: string; cls: string }> = {
  'Conservative Income': { icon: '🛡️', cls: 'bg-green-100 text-green-800' },
  'Defensive Dividend':  { icon: '💵', cls: 'bg-yellow-100 text-yellow-800' },
  'Momentum Growth':     { icon: '🚀', cls: 'bg-blue-100 text-blue-800' },
  'High Volatility':     { icon: '⚡', cls: 'bg-red-100 text-red-700' },
  'Speculative':         { icon: '🎲', cls: 'bg-pink-100 text-pink-800' },
  'Mean Reversion':      { icon: '🔄', cls: 'bg-purple-100 text-purple-800' },
  'Balanced':            { icon: '⚖️', cls: 'bg-slate-100 text-slate-700' },
}

// Trade type badge config
const TRADE_TYPE_CONFIG: Record<string, { cls: string }> = {
  'Momentum Swing':         { cls: 'bg-blue-100 text-blue-800' },
  'Breakout Trade':         { cls: 'bg-orange-100 text-orange-800' },
  'Mean Reversion Setup':   { cls: 'bg-purple-100 text-purple-800' },
  'Covered Call Income':    { cls: 'bg-green-100 text-green-800' },
  'Dividend Trend':         { cls: 'bg-yellow-100 text-yellow-900' },
  'Speculative Breakout':   { cls: 'bg-pink-100 text-pink-800' },
  'Volatility Expansion':   { cls: 'bg-red-100 text-red-800' },
  'Low Volatility Trend':   { cls: 'bg-teal-100 text-teal-800' },
}

// Setup quality badge
const SETUP_QUALITY_CONFIG: Record<string, { cls: string }> = {
  'A+': { cls: 'bg-amber-400 text-white font-black' },
  'A':  { cls: 'bg-green-500 text-white font-bold' },
  'B':  { cls: 'bg-blue-400 text-white font-semibold' },
  'C':  { cls: 'bg-gray-300 text-gray-700' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS: { id: FilterId; label: string; icon: string }[] = [
  { id: 'all',            label: 'All',              icon: '🔍' },
  { id: 'momentum',       label: 'Momentum',          icon: '🚀' },
  { id: 'oversold',       label: 'Oversold',          icon: '💚' },
  { id: 'mean-reversion', label: 'Mean Reversion',    icon: '🔄' },
  { id: 'low-vol',        label: 'Low Volatility',    icon: '🛡️' },
  { id: 'squeeze',        label: 'Vol Squeeze',       icon: '🌀' },
  { id: 'dividend',       label: 'Dividend',          icon: '💰' },
  { id: 'options',        label: 'Options Swing',     icon: '⚡' },
  { id: 'extreme',        label: 'Extreme',           icon: '🔥' },
]

function applyFilter(data: any[], filter: FilterId): any[] {
  const cats = (r: any): string[] => r.categories ?? []
  switch (filter) {
    case 'momentum':       return data.filter(r => cats(r).includes('Momentum'))
    case 'oversold':       return data.filter(r => cats(r).includes('Oversold'))
    case 'mean-reversion': return data.filter(r => r.risk_profile === 'Mean Reversion' || cats(r).includes('Oversold'))
    case 'low-vol':        return data.filter(r => r.atr_pct != null && r.atr_pct < 3.0)
    case 'squeeze':        return data.filter(r => r.squeeze === true || cats(r).includes('🌀 Volatility Compression'))
    case 'dividend':       return data.filter(r => cats(r).includes('Dividend'))
    case 'options':        return data.filter(r => r.atr_pct != null && r.atr_pct >= 3.0)
    case 'extreme':        return data.filter(r => r.score >= 8)
    default:               return data
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function CategoryBadge({ label }: { label: string }) {
  const cfg = CAT_CONFIG[label] ?? { icon: '📌', cls: 'bg-gray-200 text-gray-700' }
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs mr-1 mb-0.5 shadow-sm ${cfg.cls}`}>
      {cfg.icon} {label}
    </span>
  )
}

function RiskProfileBadge({ profile }: { profile?: string | null }) {
  if (!profile) return null
  const cfg = RISK_PROFILE_CONFIG[profile] ?? { icon: '📊', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${cfg.cls}`} title="Risk Profile">
      {cfg.icon} {profile}
    </span>
  )
}

function TradeTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null
  const cfg = TRADE_TYPE_CONFIG[type] ?? { cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`} title="Trade type suggested by scanner">
      {type}
    </span>
  )
}

function SetupQualityBadge({ grade }: { grade?: string | null }) {
  if (!grade) return null
  const cfg = SETUP_QUALITY_CONFIG[grade] ?? { cls: 'bg-gray-200 text-gray-600' }
  return (
    <Tooltip text={`Setup Quality: ${grade}${grade === 'A+' ? ' — Elite setup' : grade === 'A' ? ' — Strong setup' : grade === 'B' ? ' — Moderate setup' : ' — Weak setup'}`}>
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${cfg.cls}`}>
        {grade}
      </span>
    </Tooltip>
  )
}

function ScoreBadge({ score, bullish, risk, percentileLabel }: { score: number; bullish?: number; risk?: number; percentileLabel?: string | null }) {
  const tip = [
    bullish != null ? `Bullish: ${bullish}  Risk: ${risk}  Composite: ${score}` : `Score: ${score}`,
    percentileLabel ? `Rank: ${percentileLabel}` : ''
  ].filter(Boolean).join(' | ')

  const badge =
    score >= 8 ? <span className="text-base font-black text-orange-500">🔥 {score}</span> :
    score >= 5 ? <span className="text-base font-black text-green-600">🟢 {score}</span> :
    score >= 3 ? <span className="font-semibold text-blue-600">🔵 {score}</span> :
    score < 0  ? <span className="font-semibold text-red-500">🔴 {score}</span> :
                 <span className="text-gray-500">{score}</span>

  return (
    <Tooltip text={tip}>
      <span className="flex flex-col items-end gap-0.5">
        {badge}
        {percentileLabel && (
          <span className="text-xs text-slate-400">{percentileLabel}</span>
        )}
      </span>
    </Tooltip>
  )
}

function RsiBadge({ rsi }: { rsi: number | null }) {
  if (rsi == null) return <span className="text-gray-400">—</span>
  if (rsi > 80) return <Tooltip text="Extremely overbought — momentum may stall or reverse soon"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-xs">{rsi.toFixed(1)} 🌡️</span></Tooltip>
  if (rsi > 70) return <Tooltip text="Overbought — use caution on new longs"><span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-xs">{rsi.toFixed(1)}</span></Tooltip>
  if (rsi < 30) return <Tooltip text="Oversold — potential bounce candidate"><span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-xs">{rsi.toFixed(1)} 💚</span></Tooltip>
  if (rsi < 40) return <Tooltip text="Mildly oversold — watch for reversal signals"><span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-xs">{rsi.toFixed(1)}</span></Tooltip>
  return <span className="text-gray-700 text-xs">{rsi.toFixed(1)}</span>
}

function AtrCell({ atrPct, atrDollar, label }: { atrPct?: number | null; atrDollar?: number | null; label?: string | null }) {
  if (atrPct == null) return <span className="text-gray-400">—</span>
  const cls =
    atrPct >= 7   ? 'text-red-700 font-black' :
    atrPct >= 5   ? 'text-red-600 font-bold' :
    atrPct >= 3   ? 'text-orange-500 font-semibold' :
    atrPct >= 1.5 ? 'text-yellow-600' :
                    'text-green-600'
  const tip = [atrDollar != null ? `Daily range ≈ $${atrDollar.toFixed(2)}` : '', label ?? ''].filter(Boolean).join(' | ')
  return (
    <Tooltip text={tip || 'ATR as % of price — measures daily volatility'}>
      <span className={`tabular-nums text-xs ${cls}`}>{atrPct.toFixed(1)}%</span>
    </Tooltip>
  )
}

function ExpMoveCell({ pct }: { pct?: number | null }) {
  if (pct == null) return <span className="text-gray-400">—</span>
  return (
    <Tooltip text="Expected normal daily move based on recent ATR — useful for option strike selection">
      <span className="tabular-nums text-xs text-slate-600 font-medium">±{pct.toFixed(1)}%</span>
    </Tooltip>
  )
}

function MADistanceCell({ pct, label }: { pct?: number | null; label?: string | null }) {
  if (pct == null) return <span className="text-gray-400">—</span>
  const sign = pct > 0 ? '+' : ''
  const cls =
    pct > 15  ? 'text-red-800 font-black' :     // 🚀 Parabolic
    pct > 10  ? 'text-red-700 font-bold' :       // 🔥 Euphoric
    pct > 8   ? 'text-red-600 font-bold' :       // Very Extended
    pct > 3   ? 'text-orange-500' :              // Extended/Slightly Extended
    pct > -3  ? 'text-gray-500' :               // Neutral
    pct > -8  ? 'text-blue-500' :               // Pulling Back
    pct > -15 ? 'text-purple-500 font-semibold' : // Oversold
                'text-purple-800 font-bold'       // 💀 Deep Oversold
  return (
    <Tooltip text={label ?? 'Distance from 20-day moving average'}>
      <span className={`tabular-nums text-xs ${cls}`}>{sign}{pct.toFixed(1)}%</span>
    </Tooltip>
  )
}

function VolRatio({ v }: { v?: number }) {
  if (v == null) return <span className="text-gray-400">—</span>
  const hot = v >= 2.0
  const elevated = v >= 1.5
  const tip = hot ? 'Heavy volume — strong conviction move' : elevated ? 'Above-average volume — watch for follow-through' : 'Normal volume'
  return (
    <Tooltip text={tip}>
      <span className={`tabular-nums text-xs font-medium ${hot ? 'text-violet-700 font-black' : elevated ? 'text-violet-600 font-semibold' : 'text-gray-600'}`}>
        {hot ? '🔊 ' : elevated ? '📢 ' : ''}{v.toFixed(2)}x
      </span>
    </Tooltip>
  )
}

function RSCell({ rs }: { rs?: number | null }) {
  if (rs == null) return <span className="text-gray-300 text-xs">—</span>
  const sign = rs > 0 ? '+' : ''
  const cls = rs > 10 ? 'text-green-600 font-bold' : rs < -10 ? 'text-red-500 font-semibold' : 'text-gray-600'
  const icon = rs > 10 ? '🏆 ' : rs < -10 ? '🐢 ' : ''
  return (
    <Tooltip text="20-day return vs SPY — positive means outperforming the market">
      <span className={`tabular-nums text-xs ${cls}`}>{icon}{sign}{rs.toFixed(1)}%</span>
    </Tooltip>
  )
}

function SqueezeBadge({ squeeze }: { squeeze?: boolean | null }) {
  if (!squeeze) return null
  return (
    <Tooltip text="Volatility Compression detected — price coiling before potential breakout or breakdown">
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
        🌀 Squeeze
      </span>
    </Tooltip>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Options interpretation panel
// ─────────────────────────────────────────────────────────────────────────────
function OptionsPanel({ row }: { row: any }) {
  const { atr_pct, atr_dollar, expected_move_pct, price, rsi, squeeze, trade_type, ma_distance_label, categories } = row
  const cats: string[] = categories ?? []
  const isHighVol = atr_pct != null && atr_pct >= 5
  const isLowVol  = atr_pct != null && atr_pct < 2
  const isOversold = cats.includes('Oversold') || (rsi != null && rsi < 35)
  const isMomentum = cats.includes('Momentum')
  const hasSqueeze = squeeze === true || cats.includes('🌀 Volatility Compression')

  let strategy = ''
  let strategyReason = ''
  let strikeHint = ''

  if (hasSqueeze) {
    strategy = 'Long Straddle / Strangle'
    strategyReason = 'Volatility compression often precedes a sharp directional move. A straddle profits if the stock breaks out in either direction.'
    strikeHint = price != null && expected_move_pct != null ? `ATM straddle near $${price.toFixed(2)} — wings at ±${expected_move_pct.toFixed(1)}%` : ''
  } else if (isHighVol && isMomentum) {
    strategy = 'Bull Call Spread'
    strategyReason = 'High IV + momentum = expensive options. A debit spread reduces cost while staying directionally bullish.'
    strikeHint = price != null && atr_dollar != null ? `Buy ATM call, sell call ~$${(price + atr_dollar * 2).toFixed(2)}` : ''
  } else if (isHighVol && !isMomentum) {
    strategy = 'Short Strangle / Iron Condor'
    strategyReason = 'Elevated IV with no clear trend — sell premium by placing short strikes outside the expected move range.'
    strikeHint = expected_move_pct != null && price != null ? `Short strikes ≈ ±${(expected_move_pct * 1.5).toFixed(1)}% from current price` : ''
  } else if (isOversold) {
    strategy = 'Cash-Secured Put / Bull Put Spread'
    strategyReason = 'Oversold conditions with mean-reversion potential. Selling a put collects premium while positioning for a bounce.'
    strikeHint = price != null && atr_dollar != null ? `Sell put ~$${(price - atr_dollar).toFixed(2)} (1 ATR below)` : ''
  } else if (isLowVol) {
    strategy = 'Long Call / LEAPS'
    strategyReason = 'Low IV = cheap options. Buying calls or LEAPS provides leveraged upside at low cost when volatility is compressed.'
    strikeHint = price != null ? `Slight OTM call — strike around $${(price * 1.03).toFixed(2)}` : ''
  } else if (trade_type === 'Covered Call Income') {
    strategy = 'Covered Call'
    strategyReason = 'Stock shows dividend/income characteristics. Writing covered calls against a long stock position generates extra yield.'
    strikeHint = expected_move_pct != null && price != null ? `Sell call ~${expected_move_pct.toFixed(1)}% OTM = $${(price * (1 + expected_move_pct / 100)).toFixed(2)}` : ''
  } else {
    strategy = 'Vertical Call Spread'
    strategyReason = 'Balanced setup — a debit spread gives defined risk with upside exposure.'
    strikeHint = atr_dollar != null && price != null ? `Buy ATM, sell ~$${(price + atr_dollar * 1.5).toFixed(2)}` : ''
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 space-y-1.5">
      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">⚡ Options Interpretation</p>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-bold text-indigo-900">{strategy}</span>
        {isHighVol && <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 font-semibold">High IV</span>}
        {isLowVol  && <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 font-semibold">Low IV</span>}
        {hasSqueeze && <span className="px-1.5 py-0.5 text-xs rounded bg-indigo-200 text-indigo-800 font-semibold">🌀 Pre-Breakout</span>}
      </div>
      <p className="text-xs text-indigo-800">{strategyReason}</p>
      {strikeHint && <p className="text-xs text-indigo-600 font-mono">💡 {strikeHint}</p>}
      {expected_move_pct != null && (
        <p className="text-xs text-slate-500">Expected daily move: <span className="font-semibold text-slate-700">±{expected_move_pct.toFixed(1)}%</span>
          {atr_dollar != null ? ` (≈ $${atr_dollar.toFixed(2)})` : ''}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// "What This Means" educational panel
// ─────────────────────────────────────────────────────────────────────────────
function EducationalPanel({ row }: { row: any }) {
  const { rsi, atr_pct, ma_distance_label, volume_ratio, score, setup_quality, trade_type } = row
  const insights: { label: string; text: string }[] = []

  if (rsi != null) {
    if (rsi > 75) insights.push({ label: 'RSI', text: `RSI of ${rsi.toFixed(1)} signals the stock is very overbought. This doesn't mean "sell immediately" — momentum stocks can stay overbought — but entering new longs here carries higher reversal risk.` })
    else if (rsi < 30) insights.push({ label: 'RSI', text: `RSI of ${rsi.toFixed(1)} signals the stock is deeply oversold. This often precedes a bounce, but watch for a catalyst — oversold can get more oversold without one.` })
    else insights.push({ label: 'RSI', text: `RSI of ${rsi.toFixed(1)} is in a neutral zone — no extreme reading. This is generally healthy for trend continuation.` })
  }
  if (atr_pct != null) {
    if (atr_pct >= 5) insights.push({ label: 'Volatility', text: `ATR of ${atr_pct.toFixed(1)}% means this stock moves ~${atr_pct.toFixed(1)}% per day on average. High volatility = larger potential gains AND larger potential losses. Size positions accordingly.` })
    else if (atr_pct < 2) insights.push({ label: 'Volatility', text: `ATR of ${atr_pct.toFixed(1)}% is low — this stock makes small daily moves. Great for premium sellers and income strategies. Options are relatively cheap here.` })
  }
  if (volume_ratio != null && volume_ratio >= 1.5) {
    insights.push({ label: 'Volume', text: `Volume is ${volume_ratio.toFixed(1)}x the 20-day average. Elevated volume on a move is institutional confirmation — the "smart money" is participating.` })
  }
  if (ma_distance_label) {
    insights.push({ label: 'MA Distance', text: `Price is "${ma_distance_label}" from its 20-day moving average. Stocks that are very extended often revert toward the mean before the next leg up.` })
  }
  if (trade_type) {
    insights.push({ label: 'Trade Type', text: `This is classified as a "${trade_type}". Each trade type has a different risk/reward profile and requires a different entry/exit strategy.` })
  }
  if (setup_quality) {
    const desc = setup_quality === 'A+' ? 'multiple confluent bullish signals — rare, high-conviction setup' :
                 setup_quality === 'A'  ? 'several aligned signals — solid setup for active traders' :
                 setup_quality === 'B'  ? 'moderate signals — valid but needs confirmation' :
                                          'few signals aligned — lower conviction, proceed with caution'
    insights.push({ label: 'Setup Quality', text: `Grade ${setup_quality}: ${desc}.` })
  }

  if (!insights.length) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 space-y-2">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">📚 What This Means</p>
      <div className="space-y-1.5">
        {insights.map(ins => (
          <div key={ins.label} className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-800">{ins.label}: </span>{ins.text}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Zones panel
// ─────────────────────────────────────────────────────────────────────────────
function ActionZones({ row }: { row: any }) {
  const { buy_zone_low, buy_zone_high, chase_zone, danger_zone, price, in_buy_zone, in_chase_zone } = row
  if (buy_zone_low == null) return <span className="text-gray-400 text-xs">Action zones unavailable (need MA20 + ATR)</span>

  const fmt = (v: number) => `$${v.toFixed(2)}`
  return (
    <div className="flex flex-wrap gap-3 items-start">
      <div className={`flex flex-col px-3 py-2 rounded-lg border ${in_buy_zone ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
        <span className="text-xs font-bold text-green-700">🟢 Buy Zone</span>
        <span className="text-sm font-mono font-semibold text-green-800">{fmt(buy_zone_low)} – {fmt(buy_zone_high)}</span>
        {in_buy_zone && <span className="text-xs text-green-600 font-semibold">← Price is here</span>}
      </div>
      <div className={`flex flex-col px-3 py-2 rounded-lg border ${in_chase_zone ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-200'}`}>
        <span className="text-xs font-bold text-orange-600">🟡 Chase Zone</span>
        <span className="text-sm font-mono font-semibold text-orange-700">Above {fmt(chase_zone)}</span>
        {in_chase_zone && <span className="text-xs text-orange-500 font-semibold">← Price is chasing</span>}
      </div>
      <div className="flex flex-col px-3 py-2 rounded-lg border bg-white border-gray-200">
        <span className="text-xs font-bold text-red-600">🔴 Danger Zone</span>
        <span className="text-sm font-mono font-semibold text-red-700">Below {fmt(danger_zone)}</span>
        {price != null && price < danger_zone && <span className="text-xs text-red-500 font-semibold">⚠️ In danger zone</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sortable header
// ─────────────────────────────────────────────────────────────────────────────
function TH({ label, k, sortKey, onSort, tooltip }: { label: string; k: string; sortKey: string; onSort: (k: string) => void; tooltip?: string }) {
  const el = (
    <th onClick={() => onSort(k)}
        className={`px-3 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors
          ${sortKey === k ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>
      {label}{sortKey === k ? ' ▾' : ''}
    </th>
  )
  if (tooltip) {
    return (
      <th onClick={() => onSort(k)}
          title={tooltip}
          className={`px-3 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors
            ${sortKey === k ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>
        {label}{sortKey === k ? ' ▾' : ''}
      </th>
    )
  }
  return el
}

// ─────────────────────────────────────────────────────────────────────────────
// Static company name lookup
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_NAMES: Record<string, string> = {
  AAPL:'Apple',MSFT:'Microsoft',GOOGL:'Alphabet',AMZN:'Amazon',NVDA:'NVIDIA',META:'Meta',
  TSLA:'Tesla',AMD:'Advanced Micro Devices',INTC:'Intel',CSCO:'Cisco',ORCL:'Oracle',
  QCOM:'Qualcomm',TXN:'Texas Instruments',AVGO:'Broadcom',NFLX:'Netflix',
  DIS:'Walt Disney',JPM:'JPMorgan Chase',BAC:'Bank of America',GS:'Goldman Sachs',
  XOM:'Exxon Mobil',CVX:'Chevron',JNJ:'Johnson & Johnson',PFE:'Pfizer',
  UNH:'UnitedHealth',LLY:'Eli Lilly',WMT:'Walmart',COST:'Costco',HD:'Home Depot',
  SPY:'SPDR S&P 500 ETF',QQQ:'Invesco QQQ Trust',IWM:'iShares Russell 2000',
  PLTR:'Palantir',SOFI:'SoFi',MSTR:'MicroStrategy',COIN:'Coinbase',
  F:'Ford',GM:'General Motors',BA:'Boeing',LMT:'Lockheed Martin',
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function StockTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey]   = React.useState<string>('score')
  const [filter, setFilter]     = React.useState<FilterId>('all')
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  const filtered = React.useMemo(() => applyFilter(data, filter), [data, filter])

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
      return diff !== 0 ? diff : (b.score ?? 0) - (a.score ?? 0)
    })
  }, [filtered, sortKey])

  const toggle = (ticker: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(ticker) ? next.delete(ticker) : next.add(ticker)
    return next
  })

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-5xl mb-3">📭</span>
        <p className="text-sm">No results yet — hit Refresh to scan</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-2 px-1">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
              ${filter === f.id
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}>
            {f.icon} {f.label}
            {filter === f.id && filtered.length !== data.length &&
              <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">{filtered.length}</span>}
          </button>
        ))}
        {filter !== 'all' && (
          <button onClick={() => setFilter('all')}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 underline">
            Clear filter
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl shadow-lg border border-slate-200" style={{ overflow: 'auto', maxHeight: 560 }}>
        <table className="min-w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead className="bg-slate-800" style={{ position: 'sticky', top: 0, zIndex: 9 }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Ticker</th>
              <TH label="Price"      k="price"                  sortKey={sortKey} onSort={setSortKey} />
              <TH label="RSI"        k="rsi"                    sortKey={sortKey} onSort={setSortKey} tooltip="Relative Strength Index — above 70 = overbought, below 30 = oversold" />
              <TH label="ATR%"       k="atr_pct"                sortKey={sortKey} onSort={setSortKey} tooltip="Average True Range as % of price — daily volatility measure" />
              <TH label="Exp Move"   k="expected_move_pct"      sortKey={sortKey} onSort={setSortKey} tooltip="Estimated normal daily move — useful for option strike selection" />
              <TH label="MA Dist%"   k="ma_distance_pct"        sortKey={sortKey} onSort={setSortKey} tooltip="Price distance from 20-day moving average — extension or pullback" />
              <TH label="Vol Ratio"  k="volume_ratio"           sortKey={sortKey} onSort={setSortKey} tooltip="Today's volume vs 20-day average — above 1.5x signals conviction" />
              <TH label="Div %"      k="dividend_yield_percent" sortKey={sortKey} onSort={setSortKey} tooltip="Annual dividend yield" />
              <TH label="Score"      k="score"                  sortKey={sortKey} onSort={setSortKey} tooltip="Composite score = Bullish signals − Risk signals + percentile rank" />
              <TH label="RS vs SPY"  k="relative_strength_20d"  sortKey={sortKey} onSort={setSortKey} tooltip="20-day return relative to SPY — positive = outperforming market" />
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Trade Type</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Signals</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row: any, i: number) => {
              const isExpanded   = expanded.has(row.ticker)
              const cats: string[] = row.categories ?? []
              const isHot        = row.score >= 5
              const isSpec       = cats.includes('Speculative / High Risk')
              const inBuy        = row.in_buy_zone
              const hasSqueeze   = row.squeeze === true || cats.includes('🌀 Volatility Compression')
              const rowBg        = inBuy     ? 'bg-green-50' :
                                   hasSqueeze ? 'bg-indigo-50' :
                                   i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              const leftBorder   = isHot     ? 'border-l-4 border-green-400'
                                 : hasSqueeze ? 'border-l-4 border-indigo-400'
                                 : isSpec     ? 'border-l-4 border-pink-400'
                                 :              'border-l-4 border-transparent'

              return (
                <React.Fragment key={`${row.ticker}-${i}`}>
                  <tr className={`${rowBg} ${leftBorder} hover:bg-blue-50 transition-colors duration-100 group`}>

                    {/* Ticker + risk profile + setup quality */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span title={COMPANY_NAMES[row.ticker] ?? row.ticker}
                            className="font-extrabold text-slate-800 group-hover:text-blue-700 transition-colors cursor-help">
                            {row.ticker}
                          </span>
                          {isSpec && <span className="text-pink-500 text-xs">🎲</span>}
                          {isHot  && <span className="text-xs">🔥</span>}
                          {inBuy  && <span className="text-xs text-green-600" title="In buy zone">🟢</span>}
                          {hasSqueeze && <span className="text-xs" title="Volatility Compression">🌀</span>}
                          {row.setup_quality && <SetupQualityBadge grade={row.setup_quality} />}
                        </div>
                        {row.risk_profile && <RiskProfileBadge profile={row.risk_profile} />}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-700">
                      {row.price != null ? `$${Number(row.price).toFixed(2)}` : '—'}
                    </td>

                    {/* RSI */}
                    <td className="px-3 py-2.5 text-right"><RsiBadge rsi={row.rsi} /></td>

                    {/* ATR% */}
                    <td className="px-3 py-2.5 text-right">
                      <AtrCell atrPct={row.atr_pct} atrDollar={row.atr_dollar} label={row.volatility_label} />
                    </td>

                    {/* Expected move */}
                    <td className="px-3 py-2.5 text-right">
                      <ExpMoveCell pct={row.expected_move_pct} />
                    </td>

                    {/* MA distance */}
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex flex-col items-end">
                        <MADistanceCell pct={row.ma_distance_pct} label={row.ma_distance_label} />
                        {row.ma_distance_label && (
                          <span className="text-xs text-gray-400 leading-none">{row.ma_distance_label}</span>
                        )}
                      </div>
                    </td>

                    {/* Volume ratio */}
                    <td className="px-3 py-2.5 text-right"><VolRatio v={row.volume_ratio} /></td>

                    {/* Dividend */}
                    <td className="px-3 py-2.5 text-right tabular-nums text-xs">
                      {row.dividend_yield_percent != null && row.dividend_yield_percent > 0
                        ? <span className="text-yellow-700 font-semibold">💰 {Number(row.dividend_yield_percent).toFixed(2)}%</span>
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Score + percentile */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <ScoreBadge score={row.score} bullish={row.bullish_score} risk={row.risk_score} percentileLabel={row.percentile_label} />
                    </td>

                    {/* RS vs SPY */}
                    <td className="px-3 py-2.5 text-right"><RSCell rs={row.relative_strength_20d} /></td>

                    {/* Trade type */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <TradeTypeBadge type={row.trade_type} />
                        <SqueezeBadge squeeze={row.squeeze} />
                      </div>
                    </td>

                    {/* Category signals */}
                    <td className="px-3 py-2.5 max-w-[240px]">
                      <div className="flex flex-wrap gap-0.5">
                        {cats.map(c => <CategoryBadge key={c} label={c} />)}
                      </div>
                    </td>

                    {/* Expand toggle */}
                    <td className="px-3 py-2.5">
                      <button onClick={() => toggle(row.ticker)}
                        className="text-xs text-blue-400 hover:text-blue-600 underline whitespace-nowrap">
                        {isExpanded ? 'less ▲' : 'more ▼'}
                      </button>
                    </td>
                  </tr>

                  {/* ── Expanded detail row ── */}
                  {isExpanded && (
                    <tr className="bg-blue-50 border-t border-blue-100">
                      <td colSpan={13} className="px-6 py-4">
                        <div className="space-y-4">

                          {/* MA / market details */}
                          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                            <span><span className="font-semibold text-slate-700">MA20:</span> {row.ma20 != null ? `$${row.ma20.toFixed(2)}` : '—'}</span>
                            <span><span className="font-semibold text-slate-700">MA50:</span> {row.ma50 != null ? `$${row.ma50.toFixed(2)}` : '—'}</span>
                            <span><span className="font-semibold text-slate-700">MA Spread:</span> {row.ma_spread_percent != null ? `${row.ma_spread_percent > 0 ? '+' : ''}${row.ma_spread_percent.toFixed(2)}%` : '—'}</span>
                            <span><span className="font-semibold text-slate-700">MA Conv:</span> {row.ma_convergence_label ?? row.ma_convergence_direction ?? '—'}</span>
                            <span><span className="font-semibold text-slate-700">ATR $:</span> {row.atr_dollar != null ? `$${row.atr_dollar.toFixed(2)}` : '—'}</span>
                            {row.market_cap != null && (
                              <span><span className="font-semibold text-slate-700">Mkt Cap:</span> {row.market_cap >= 1e9 ? `$${(row.market_cap / 1e9).toFixed(1)}B` : `$${(row.market_cap / 1e6).toFixed(0)}M`}</span>
                            )}
                            {row.setup_quality && <span><span className="font-semibold text-slate-700">Setup:</span> <span className="font-bold">{row.setup_quality}</span></span>}
                            {row.percentile_label && <span><span className="font-semibold text-slate-700">Rank:</span> {row.percentile_label}</span>}
                          </div>

                          {/* Action zones */}
                          <div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">🎯 Action Zones</p>
                            <ActionZones row={row} />
                          </div>

                          {/* Why this appeared */}
                          <div>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">💡 Why This Appeared</p>
                            <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                              {row.explanation || row.reasons || 'No explanation available.'}
                            </p>
                          </div>

                          {/* Scoring breakdown */}
                          {(row.bullish_score != null || row.risk_score != null) && (
                            <div className="flex gap-3 text-xs flex-wrap">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                                📈 Bullish: {row.bullish_score ?? '—'}
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                                ⚠️ Risk: {row.risk_score ?? '—'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                                🎯 Composite: {row.score}
                              </span>
                              {row.percentile_label && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                                  🏅 {row.percentile_label}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Options interpretation */}
                          <OptionsPanel row={row} />

                          {/* Educational "What This Means" */}
                          <EducationalPanel row={row} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-right pr-1">
        Showing {sorted.length} of {data.length} results
        {filter !== 'all' && ` — filtered by "${FILTERS.find(f => f.id === filter)?.label}"`}
      </p>
    </div>
  )
}
