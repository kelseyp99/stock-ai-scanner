import React from 'react'
import api from '../services/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const SECTION_ORDER = [
  'Current Momentum Leaders',
  'Overbought / Exhaustion Watch',
  'Fibonacci Pullback Watch',
  'Re-Flagged Opportunities',
  'Oversold Reversal Candidates',
]

function fmt(value: any, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

function money(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `$${n.toFixed(2)}`
}

function badgeClass(label: string) {
  const l = label.toLowerCase()
  if (l.includes('bear') || l.includes('exhaust') || l.includes('overbought')) return 'bg-red-50 text-red-700 border-red-200'
  if (l.includes('fib')) return 'bg-indigo-50 text-indigo-700 border-indigo-200'
  if (l.includes('volume')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (l.includes('rsi')) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

function TradingViewMini({ ticker }: { ticker: string }) {
  const containerId = React.useMemo(() => `tv_reflag_${ticker}_${Math.random().toString(36).slice(2, 7)}`, [ticker])
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
        height: 320,
        width: '100%',
        studies: ['RSI@tv-basicstudies'],
      })
    }
    ref.current.appendChild(script)
    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [containerId, ticker])

  return <div id={containerId} ref={ref} className="overflow-hidden rounded-lg border border-slate-200" />
}

function FibPanel({ row }: { row: any }) {
  const fib = row.fib || {}
  const levels = row.fib_levels || {}
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3 text-xs">
      <div className="font-bold uppercase tracking-wide text-indigo-700">Fibonacci Levels</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-indigo-900">
        <div><span className="font-bold">Low:</span> {money(fib.swing_low)}</div>
        <div><span className="font-bold">High:</span> {money(fib.swing_high)}</div>
        <div className={row.fib_hit_level === '38.2' ? 'font-black' : ''}>38.2% {money(levels['38.2'])}</div>
        <div className={row.fib_hit_level === '50.0' ? 'font-black' : ''}>50% {money(levels['50.0'])}</div>
        <div className={row.fib_hit_level === '61.8' ? 'font-black' : ''}>61.8% {money(levels['61.8'])}</div>
        <div><span className="font-bold">Hit:</span> {row.fib_hit_level ? `${row.fib_hit_level}%` : '—'}</div>
      </div>
      <p className="mt-2 leading-relaxed text-indigo-800">
        TradingView widgets cannot be programmatically drawn into from this app, so the Fib overlay is rendered here from the same anchors.
      </p>
    </div>
  )
}

function ReflagCard({ row }: { row: any }) {
  const [expanded, setExpanded] = React.useState(false)
  const labels = [...(row.reversal_labels || []), ...(row.exhaustion_labels || [])]
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{row.ticker}</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-500">{row.asset_type || 'stock'}</span>
              {row.fib_hit_level && <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">Fib {row.fib_hit_level}% Hit</span>}
            </div>
            <div className="mt-1 text-xs text-slate-500">{row.scanner_category || 'Historical scanner candidate'}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-emerald-700">{row.reversal_score ?? 0}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Rev</div>
            <div className="mt-1 text-lg font-black text-red-700">{row.exhaustion_score ?? 0}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Exh</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">Price</div><div className="font-black">{money(row.price)}</div></div>
          <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">RSI</div><div className="font-black">{fmt(row.rsi)}</div></div>
          <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">Volume</div><div className="font-black">{fmt(row.volume_ratio)}x</div></div>
          <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">Trend</div><div className="font-black capitalize">{row.trend_direction || '—'}</div></div>
          <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">ATR%</div><div className="font-black">{fmt(row.atr_pct)}%</div></div>
        </div>

        {labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {labels.slice(0, 8).map((label: string) => (
              <span key={label} className={`rounded border px-2 py-1 text-[11px] font-bold ${badgeClass(label)}`}>{label}</span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded((open) => !open)}
        className="w-full border-t border-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 hover:bg-blue-50 hover:text-blue-600"
      >
        {expanded ? 'Hide chart and Fib' : 'Chart · Fib · Reasons'}
      </button>

      {expanded && (
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-4 xl:grid-cols-2">
          <TradingViewMini ticker={row.ticker} />
          <div className="space-y-3">
            <FibPanel row={row} />
            {[...(row.reversal_reasons || []), ...(row.exhaustion_reasons || [])].map((reason: string) => (
              <p key={reason} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">{reason}</p>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export default function ReflagOpportunities() {
  const [payload, setPayload] = React.useState<any>({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (DEMO_MODE) {
          const mod = await import('../data/demoScanResults')
          setPayload(mod.default.reflag_analysis ?? {})
        } else {
          const res = await api.get('/scan/reflags/latest')
          setPayload(res.data)
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load re-flag analysis')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const sections = payload.sections || {}
  return (
    <div className="p-4 space-y-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Re-Flagged Opportunities</h2>
          <p className="text-sm text-slate-500">Rule-based daily re-check of historical scanner candidates for Fib pullbacks, reversals, and exhaustion.</p>
        </div>
        {payload.scan_finished_at && <div className="text-xs text-slate-400">Run {new Date(payload.scan_finished_at).toLocaleString()}</div>}
      </div>

      {payload.summary && <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{payload.summary}</div>}
      {loading && <div className="text-sm text-slate-500">Loading re-flag analysis...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {payload.alerts?.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-amber-900">Latest Alerts</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
            {payload.alerts.slice(0, 8).map((alert: any, idx: number) => (
              <div key={`${alert.ticker}-${alert.alert_type}-${idx}`} className="rounded border border-amber-200 bg-white px-3 py-2 text-xs text-amber-900">
                <span className="font-black">{alert.ticker}</span> {alert.message}
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && SECTION_ORDER.every((name) => !(sections[name] || []).length) && (
        <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No re-flag scan has been generated yet. Run `scripts/run_reflag_scan.py`.
        </div>
      )}

      {SECTION_ORDER.map((name) => {
        const rows = sections[name] || []
        if (!rows.length) return null
        return (
          <section key={name} className="space-y-3">
            <h3 className="text-lg font-black text-slate-800">{name}</h3>
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
              {rows.slice(0, 12).map((row: any) => <ReflagCard key={`${name}-${row.ticker}`} row={row} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
