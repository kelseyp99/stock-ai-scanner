import React from 'react'
import api from '../services/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

function money(value: any) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n === 0) return '—'
  const sign = n > 0 ? '+' : '-'
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

function formatPct(value: any) {
  if (value == null) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

function trendClass(delta: any) {
  const n = Number(delta || 0)
  if (n >= 2) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (n <= -2) return 'text-red-700 bg-red-50 border-red-200'
  return 'text-slate-700 bg-slate-50 border-slate-200'
}

export default function InstitutionalActivity() {
  const [rows, setRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (DEMO_MODE) {
          const mod = await import('../data/demoScanResults')
          setRows(mod.default.institutional_activity ?? [])
        } else {
          const res = await api.get('/scan/latest')
          setRows(res.data.institutional_activity ?? [])
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load 13F activity')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">13F Institutional Activity</h2>
        <p className="text-sm text-slate-500 mt-1">
          Delayed 13F context from institutional filings. Use this as confirmation, not as a required buy/sell signal.
        </p>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading 13F activity...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No 13F activity file is configured yet. Generate one with `scripts/ingest_13f_filings.py`.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {rows.map((row) => {
          const delta = row.institutional_ownership_delta_pct
          const notable = row.institutional_13f_notable ?? []
          const managers = row.institutional_13f_top_managers ?? []
          const newManagers = row.institutional_13f_new_managers ?? []
          return (
            <article key={row.ticker} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-black text-slate-900">{row.ticker}</span>
                    {row.exchange_name && <span className="text-[10px] font-bold text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">{row.exchange_name}</span>}
                  </div>
                  {row.company_name && <div className="text-sm font-semibold text-slate-600 truncate">{row.company_name}</div>}
                  <div className="text-xs text-slate-400 mt-1">
                    Period {row.institutional_13f_latest_period || 'latest'}
                    {row.institutional_13f_previous_period ? ` vs ${row.institutional_13f_previous_period}` : ''}
                  </div>
                </div>
                <div className={`shrink-0 border rounded-md px-2 py-1 text-right ${trendClass(delta)}`}>
                  <div className="text-lg font-black tabular-nums">{formatPct(delta)}</div>
                  <div className="text-[10px] font-bold uppercase">{row.institutional_ownership_trend || '13F'}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded bg-slate-50 px-2 py-2">
                  <div className="font-bold text-slate-400 uppercase">Value Δ</div>
                  <div className="font-black text-slate-700">{money(row.institutional_13f_value_delta)}</div>
                </div>
                <div className="rounded bg-slate-50 px-2 py-2">
                  <div className="font-bold text-slate-400 uppercase">Managers</div>
                  <div className="font-black text-slate-700">{row.institutional_13f_manager_count ?? '—'}</div>
                </div>
                <div className="rounded bg-slate-50 px-2 py-2">
                  <div className="font-bold text-slate-400 uppercase">Score</div>
                  <div className="font-black text-slate-700">{row.score ?? '—'}</div>
                </div>
              </div>

              {(notable.length > 0 || newManagers.length > 0 || managers.length > 0) && (
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {notable.slice(0, 2).map((note: string) => <div key={note}>{note}</div>)}
                  {newManagers.length > 0 && <div><span className="font-bold">New:</span> {newManagers.slice(0, 4).join(', ')}</div>}
                  {managers.length > 0 && <div><span className="font-bold">Top:</span> {managers.slice(0, 4).join(', ')}</div>}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
