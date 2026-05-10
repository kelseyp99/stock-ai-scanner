import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type FilterId = 'all' | 'momentum' | 'oversold' | 'low-vol' | 'dividend' | 'options' | 'extreme' | 'mean-reversion'

// ─────────────────────────────────────────────────────────────────────────────
// Category config
// ─────────────────────────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: string; cls: string }> = {
  'Momentum':                { icon: '��', cls: 'bg-blue-500 text-white' },
  'Pullback Risk':           { icon: '⚠️', cls: 'bg-orange-400 text-white' },
  'Oversold':                { icon: '🔻', cls: 'bg-emerald-500 text-white' },
  'Breakout Volume':         { icon: '📈', cls: 'bg-violet-500 text-white' },
  'Dividend':                { icon: '💰', cls: 'bg-yellow-400 text-gray-900' },
  'High Volatility':         { icon: '⚡', cls: 'bg-red-400 text-white' },
  'Extreme Volatility':      { icon: '🔥', cls: 'bg-red-600 text-white font-bold' },
  'Weak Trend':              { icon: '😴', cls: 'bg-gray-300 text-gray-700' },
  'Speculative / High Risk': { icon: '🎲', cls: 'bg-pink-500 text-white font-bold' },
  'Market Leader':           { icon: '🏆', cls: 'bg-green-500 text-white font-bold' },
  'Market Laggard':          { icon: '🐢', cls: 'bg-slate-400 text-white' },
  'Bullish Crossover Setup': { icon: '🔀', cls: 'bg-teal-500 text-white font-bold' },
  'Bearish Crossover Risk':  { icon: '🔁', cls: 'bg-amber-600 text-white font-bold' },
  'MA Converging':           { icon: '〰️', cls: 'bg-sky-400 text-white' },
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

// ─────────────────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS: { id: FilterId; label: string; icon: string }[] = [
  { id: 'all',           label: 'All',            icon: '🔍' },
  { id: 'momentum',      label: 'Momentum',        icon: '🚀' },
  { id: 'oversold',      label: 'Oversold',        icon: '💚' },
  { id: 'mean-reversion',label: 'Mean Reversion',  icon: '🔄' },
  { id: 'low-vol',       label: 'Low Volatility',  icon: '��️' },
  { id: 'dividend',      label: 'Dividend',        icon: '💰' },
  { id: 'options',       label: 'Options Swing',   icon: '⚡' },
  { id: 'extreme',       label: 'Extreme',         icon: '🔥' },
]

function applyFilter(data: any[], filter: FilterId): any[] {
  const cats = (r: any): string[] => r.categories ?? []
  switch (filter) {
    case 'momentum':       return data.filter(r => cats(r).includes('Momentum'))
    case 'oversold':       return data.filter(r => cats(r).includes('Oversold'))
    case 'mean-reversion': return data.filter(r => r.risk_profile === 'Mean Reversion' || cats(r).includes('Oversold'))
    case 'low-vol':        return data.filter(r => r.atr_pct != null && r.atr_pct < 3.0)
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

function ScoreBadge({ score, bullish, risk }: { score: number; bullish?: number; risk?: number }) {
  const tip = bullish != null ? `Bullish: ${bullish}  Risk: ${risk}  Composite: ${score}` : `Score: ${score}`
  if (score >= 8) return <span className="text-base font-black text-orange-500" title={tip}>🔥 {score}</span>
  if (score >= 5) return <span className="text-base font-black text-green-600" title={tip}>🟢 {score}</span>
  if (score >= 3) return <span className="font-semibold text-blue-600" title={tip}>🔵 {score}</span>
  if (score < 0)  return <span className="font-semibold text-red-500" title={tip}>🔴 {score}</span>
  return <span className="text-gray-500" title={tip}>{score}</span>
}

function RsiBadge({ rsi }: { rsi: number | null }) {
  if (rsi == null) return <span className="text-gray-400">—</span>
  if (rsi > 80) return <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold text-xs">{rsi.toFixed(1)} 🌡️</span>
  if (rsi > 70) return <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-xs">{rsi.toFixed(1)}</span>
  if (rsi < 30) return <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-xs">{rsi.toFixed(1)} 💚</span>
  if (rsi < 40) return <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-xs">{rsi.toFixed(1)}</span>
  return <span className="text-gray-700 text-xs">{rsi.toFixed(1)}</span>
}

function AtrCell({ atrPct, atrDollar, label }: { atrPct?: number | null; atrDollar?: number | null; label?: string | null }) {
  if (atrPct == null) return <span className="text-gray-400">—</span>
  const cls =
    atrPct >= 5   ? 'text-red-600 font-bold' :
    atrPct >= 3   ? 'text-orange-500 font-semibold' :
    atrPct >= 1.5 ? 'text-yellow-600' :
                    'text-green-600'
  const tip = atrDollar != null ? `ATR: $${atrDollar.toFixed(2)} | ${label ?? ''}` : label ?? ''
  return (
    <span className={`tabular-nums text-xs ${cls}`} title={tip}>
      {atrPct.toFixed(1)}%
    </span>
  )
}

function ExpMoveCell({ pct }: { pct?: number | null }) {
  if (pct == null) return <span className="text-gray-400">—</span>
  return (
    <span className="tabular-nums text-xs text-slate-600 font-medium"
          title="Estimated normal daily move based on implied volatility or ATR">
      ±{pct.toFixed(1)}%
    </span>
  )
}

function MADistanceCell({ pct, label }: { pct?: number | null; label?: string | null }) {
  if (pct == null) return <span className="text-gray-400">—</span>
  const sign = pct > 0 ? '+' : ''
  const cls =
    pct > 8   ? 'text-red-600 font-bold' :
    pct > 3   ? 'text-orange-500' :
    pct > -3  ? 'text-gray-500' :
    pct > -8  ? 'text-blue-500' :
                'text-purple-600 font-bold'
  return (
    <span className={`tabular-nums text-xs ${cls}`} title={label ?? ''}>
      {sign}{pct.toFixed(1)}%
    </span>
  )
}

function VolRatio({ v }: { v?: number }) {
  if (v == null) return <span className="text-gray-400">—</span>
  const hot = v >= 1.5
  return (
    <span className={`tabular-nums text-xs font-medium ${hot ? 'text-violet-700 font-bold' : 'text-gray-600'}`}>
      {hot ? '🔊 ' : ''}{v.toFixed(2)}x
    </span>
  )
}

function RSCell({ rs }: { rs?: number | null }) {
  if (rs == null) return <span className="text-gray-300 text-xs">—</span>
  const sign = rs > 0 ? '+' : ''
  const cls = rs > 10 ? 'text-green-600 font-bold' : rs < -10 ? 'text-red-500 font-semibold' : 'text-gray-600'
  const icon = rs > 10 ? '🏆 ' : rs < -10 ? '🐢 ' : ''
  return <span className={`tabular-nums text-xs ${cls}`} title="20-day return vs SPY">{icon}{sign}{rs.toFixed(1)}%</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Zones panel (shown in expanded row)
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
function TH({ label, k, sortKey, onSort, title }: { label: string; k: string; sortKey: string; onSort: (k: string) => void; title?: string }) {
  return (
    <th onClick={() => onSort(k)} title={title}
        className={`px-3 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors
          ${sortKey === k ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}>
      {label}{sortKey === k ? ' ▾' : ''}
    </th>
  )
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
      <div className="rounded-xl shadow-lg border border-slate-200" style={{ overflow: 'auto', maxHeight: 520 }}>
        <table className="min-w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead className="bg-slate-800" style={{ position: 'sticky', top: 0, zIndex: 9 }}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Ticker</th>
              <TH label="Price"      k="price"                  sortKey={sortKey} onSort={setSortKey} />
              <TH label="RSI"        k="rsi"                    sortKey={sortKey} onSort={setSortKey} />
              <TH label="ATR%"       k="atr_pct"                sortKey={sortKey} onSort={setSortKey} title="ATR14 as % of price — volatility tier" />
              <TH label="Exp Move"   k="expected_move_pct"      sortKey={sortKey} onSort={setSortKey} title="Expected daily move %" />
              <TH label="MA Dist%"   k="ma_distance_pct"        sortKey={sortKey} onSort={setSortKey} title="Price distance from MA20" />
              <TH label="Vol Ratio"  k="volume_ratio"           sortKey={sortKey} onSort={setSortKey} />
              <TH label="Div %"      k="dividend_yield_percent" sortKey={sortKey} onSort={setSortKey} />
              <TH label="Score"      k="score"                  sortKey={sortKey} onSort={setSortKey} title="Composite = Bullish − Risk" />
              <TH label="RS vs SPY"  k="relative_strength_20d"  sortKey={sortKey} onSort={setSortKey} />
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Signals</th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Why</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row: any, i: number) => {
              const isExpanded   = expanded.has(row.ticker)
              const cats: string[] = row.categories ?? []
              const isHot        = row.score >= 5
              const isSpec       = cats.includes('Speculative / High Risk')
              const inBuy        = row.in_buy_zone
              const rowBg        = inBuy ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              const leftBorder   = isHot  ? 'border-l-4 border-green-400'
                                 : isSpec ? 'border-l-4 border-pink-400'
                                 :          'border-l-4 border-transparent'

              return (
                <React.Fragment key={`${row.ticker}-${i}`}>
                  <tr className={`${rowBg} ${leftBorder} hover:bg-blue-50 transition-colors duration-100 group`}>

                    {/* Ticker + risk profile */}
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
                          <span className="text-xs text-gray-400">{row.ma_distance_label}</span>
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

                    {/* Score */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <ScoreBadge score={row.score} bullish={row.bullish_score} risk={row.risk_score} />
                    </td>

                    {/* RS vs SPY */}
                    <td className="px-3 py-2.5 text-right"><RSCell rs={row.relative_strength_20d} /></td>

                    {/* Signals */}
                    <td className="px-3 py-2.5 max-w-[260px]">
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
                      <td colSpan={12} className="px-6 py-4">
                        <div className="space-y-4">

                          {/* MA details */}
                          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                            <span><span className="font-semibold text-slate-700">MA20:</span> {row.ma20 != null ? `$${row.ma20.toFixed(2)}` : '—'}</span>
                            <span><span className="font-semibold text-slate-700">MA50:</span> {row.ma50 != null ? `$${row.ma50.toFixed(2)}` : '—'}</span>
                            <span><span className="font-semibold text-slate-700">MA Spread:</span> {row.ma_spread_percent != null ? `${row.ma_spread_percent > 0 ? '+' : ''}${row.ma_spread_percent.toFixed(2)}%` : '—'}</span>
                            <span><span className="font-semibold text-slate-700">MA Conv:</span> {row.ma_convergence_label ?? row.ma_convergence_direction ?? '—'}</span>
                            <span><span className="font-semibold text-slate-700">ATR $:</span> {row.atr_dollar != null ? `$${row.atr_dollar.toFixed(2)}` : '—'}</span>
                            {row.market_cap != null && (
                              <span><span className="font-semibold text-slate-700">Mkt Cap:</span> {row.market_cap >= 1e9 ? `$${(row.market_cap / 1e9).toFixed(1)}B` : `$${(row.market_cap / 1e6).toFixed(0)}M`}</span>
                            )}
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
                            <div className="flex gap-3 text-xs">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                                📈 Bullish: {row.bullish_score ?? '—'}
                              </span>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-semibold">
                                ⚠️ Risk: {row.risk_score ?? '—'}
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                                🎯 Composite: {row.score}
                              </span>
                            </div>
                          )}
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
