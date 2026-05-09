import React from 'react'

// ── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG: Record<string, { icon: string; cls: string }> = {
  'Momentum':                { icon: '🚀', cls: 'bg-blue-500 text-white' },
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

function CategoryBadge({ label }: { label: string }) {
  const cfg = CAT_CONFIG[label] ?? { icon: '📌', cls: 'bg-gray-200 text-gray-700' }
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs mr-1 mb-0.5 shadow-sm ${cfg.cls}`}>
      <span>{cfg.icon}</span>
      <span>{label}</span>
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 7) return <span className="text-base font-black text-orange-500" title={`Score: ${score}`}>🔥🔥 {score}</span>
  if (score >= 5) return <span className="text-base font-black text-green-600" title={`Score: ${score}`}>🟢 {score}</span>
  if (score >= 3) return <span className="font-semibold text-blue-600" title={`Score: ${score}`}>🔵 {score}</span>
  if (score < 0)  return <span className="font-semibold text-red-500" title={`Score: ${score}`}>🔴 {score}</span>
  return <span className="text-gray-500">{score}</span>
}

function RsiBadge({ rsi }: { rsi: number | null }) {
  if (rsi == null) return <span className="text-gray-400">—</span>
  if (rsi > 70) return <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-xs">{rsi.toFixed(1)} 🌡️</span>
  if (rsi < 35) return <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-xs">{rsi.toFixed(1)} 💚</span>
  return <span className="text-gray-700 text-xs">{rsi.toFixed(1)}</span>
}

function VolBar({ label, raw }: { label?: string; raw?: number }) {
  const pct = Math.min((raw ?? 0) * 200, 100)
  const color = !raw ? 'bg-gray-200'
    : raw >= 0.75 ? 'bg-red-500'
    : raw >= 0.45 ? 'bg-orange-400'
    : raw >= 0.25 ? 'bg-yellow-400'
    : 'bg-green-400'
  return (
    <div className="flex items-center gap-1.5 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 whitespace-nowrap">{label ?? '—'}</span>
    </div>
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

// ── Relative Strength vs SPY ──────────────────────────────────────────────────
function RSCell({ rs }: { rs?: number | null }) {
  if (rs == null) return <span className="text-gray-300 text-xs">—</span>
  const isLeader  = rs > 10
  const isLaggard = rs < -10
  const sign = rs > 0 ? '+' : ''
  const cls = isLeader
    ? 'text-green-600 font-bold'
    : isLaggard
    ? 'text-red-500 font-semibold'
    : 'text-gray-600'
  const icon = isLeader ? '🏆 ' : isLaggard ? '🐢 ' : ''
  return (
    <span className={`tabular-nums text-xs ${cls}`} title="20-day return vs SPY">
      {icon}{sign}{rs.toFixed(1)}%
    </span>
  )
}

// ── MA Spread % cell ──────────────────────────────────────────────────────────
function MASpreadCell({ spread }: { spread?: number | null }) {
  if (spread == null) return <span className="text-gray-300 text-xs">—</span>
  const abs = Math.abs(spread)
  const sign = spread > 0 ? '+' : ''
  const cls = spread > 0
    ? abs > 5 ? 'text-green-700 font-bold' : 'text-green-600'
    : abs > 5 ? 'text-red-600 font-bold'   : 'text-red-500'
  return (
    <span className={`tabular-nums text-xs ${cls}`} title="(MA20 − MA50) / MA50 × 100">
      {sign}{spread.toFixed(2)}%
    </span>
  )
}

// ── MA Convergence label cell ─────────────────────────────────────────────────
function MAConvCell({ label, dir }: { label?: string | null; dir?: string | null }) {
  if (!label) {
    const arrow = dir === 'converging' ? '↘ conv' : dir === 'diverging' ? '↗ div' : null
    return arrow
      ? <span className="text-gray-400 text-xs">{arrow}</span>
      : <span className="text-gray-300 text-xs">—</span>
  }
  const styles: Record<string, string> = {
    'Bullish Crossover Setup': 'bg-teal-100 text-teal-800 font-semibold',
    'Bearish Crossover Risk':  'bg-amber-100 text-amber-800 font-semibold',
    'MA Converging':           'bg-sky-100 text-sky-700',
    'MA Spread Wide':          'bg-gray-100 text-gray-500',
  }
  const icons: Record<string, string> = {
    'Bullish Crossover Setup': '🔀',
    'Bearish Crossover Risk':  '🔁',
    'MA Converging':           '〰️',
    'MA Spread Wide':          '↔️',
  }
  const cls = styles[label] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${cls}`}>
      {icons[label] ?? ''} {label}
    </span>
  )
}

function TH({ label, k, sortKey, onSort }: { label: string; k: string; sortKey: string; onSort: (k: string) => void }) {
  return (
    <th
      onClick={() => onSort(k)}
      className={`px-3 py-3 text-right text-xs font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors
        ${sortKey === k ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
    >
      {label}{sortKey === k ? ' ▾' : ''}
    </th>
  )
}

export default function StockTable({ data }: { data: any[] }) {
  const [sortKey, setSortKey] = React.useState<string>('score')
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  const sorted = React.useMemo(() => {
    return [...data].sort((a: any, b: any) => {
      const diff = (b[sortKey] ?? 0) - (a[sortKey] ?? 0)
      if (diff !== 0) return diff
      return (b.score ?? 0) - (a.score ?? 0)
    })
  }, [data, sortKey])

  const toggleExpand = (ticker: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="text-5xl mb-3">📭</span>
        <p className="text-sm">No results yet — hit Refresh to scan</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl shadow-lg border border-slate-200"
      style={{overflow: 'auto', maxHeight: 420}}
    >
      <table className="min-w-full text-sm" style={{borderCollapse:'collapse'}}>
        <thead className="bg-slate-800" style={{position:'sticky', top: 0, zIndex: 9}}>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Ticker</th>
            <TH label="Price"      k="price"                  sortKey={sortKey} onSort={setSortKey} />
            <TH label="RSI"        k="rsi"                    sortKey={sortKey} onSort={setSortKey} />
            <TH label="MA20"       k="ma20"                   sortKey={sortKey} onSort={setSortKey} />
            <TH label="MA50"       k="ma50"                   sortKey={sortKey} onSort={setSortKey} />
            <TH label="Vol Ratio"  k="volume_ratio"           sortKey={sortKey} onSort={setSortKey} />
            <th className="px-3 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Volatility</th>
            <TH label="Div %"      k="dividend_yield_percent" sortKey={sortKey} onSort={setSortKey} />
            <TH label="Score"      k="score"                  sortKey={sortKey} onSort={setSortKey} />
            <TH label="RS vs SPY"  k="relative_strength_20d"  sortKey={sortKey} onSort={setSortKey} />
            <TH label="MA Spread"  k="ma_spread_percent"       sortKey={sortKey} onSort={setSortKey} />
            <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">MA Conv.</th>
            <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Signals</th>
            <th className="px-3 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Reasons</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row: any, i: number) => {
            const isExpanded = expanded.has(row.ticker)
            const cats: string[] = row.categories ?? []
            const isHot = row.score >= 5
            const isSpeculative = cats.includes('Speculative / High Risk')
            const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-slate-50'
            const leftBorder = isHot ? 'border-l-4 border-green-400'
              : isSpeculative ? 'border-l-4 border-pink-400'
              : 'border-l-4 border-transparent'

            return (
              <tr
                key={row.ticker}
                className={`${rowBg} ${leftBorder} hover:bg-blue-50 transition-colors duration-100 group`}
              >
                <td className="px-4 py-2.5 font-extrabold text-slate-800 whitespace-nowrap">
                  <span className="group-hover:text-blue-700 transition-colors">{row.ticker}</span>
                  {isSpeculative && <span className="ml-1 text-xs text-pink-500">🎲</span>}
                  {isHot && <span className="ml-1 text-xs">🔥</span>}
                </td>

                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-700">
                  {row.price != null ? `$${Number(row.price).toFixed(2)}` : '—'}
                </td>

                <td className="px-3 py-2.5 text-right"><RsiBadge rsi={row.rsi} /></td>

                <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 text-xs">
                  {row.ma20?.toFixed(2) ?? '—'}
                </td>

                <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 text-xs">
                  {row.ma50?.toFixed(2) ?? '—'}
                </td>

                <td className="px-3 py-2.5 text-right"><VolRatio v={row.volume_ratio} /></td>

                <td className="px-3 py-2.5"><VolBar label={row.volatility_label} raw={row.volatility} /></td>

                <td className="px-3 py-2.5 text-right tabular-nums text-xs">
                  {row.dividend_yield_percent != null && row.dividend_yield_percent > 0
                    ? <span className="text-yellow-700 font-semibold">💰 {Number(row.dividend_yield_percent).toFixed(2)}%</span>
                    : <span className="text-gray-300">—</span>}
                </td>

                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <ScoreBadge score={row.score} />
                </td>

                <td className="px-3 py-2.5 text-right">
                  <RSCell rs={row.relative_strength_20d} />
                </td>

                <td className="px-3 py-2.5 text-right">
                  <MASpreadCell spread={row.ma_spread_percent} />
                </td>

                <td className="px-3 py-2.5">
                  <MAConvCell label={row.ma_convergence_label} dir={row.ma_convergence_direction} />
                </td>

                <td className="px-3 py-2.5 max-w-[260px]">
                  <div className="flex flex-wrap gap-0.5">
                    {cats.map(c => <CategoryBadge key={c} label={c} />)}
                  </div>
                </td>

                <td className="px-3 py-2.5 max-w-xs text-slate-500 text-xs leading-relaxed">
                  {row.reasons ? (
                    isExpanded || row.reasons.length <= 60 ? (
                      <span>
                        {row.reasons}
                        {row.reasons.length > 60 && (
                          <button onClick={() => toggleExpand(row.ticker)} className="ml-1 text-blue-400 hover:underline">less ▲</button>
                        )}
                      </span>
                    ) : (
                      <span>
                        {row.reasons.slice(0, 60)}…
                        <button onClick={() => toggleExpand(row.ticker)} className="ml-1 text-blue-400 hover:underline">more ▼</button>
                      </span>
                    )
                  ) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
