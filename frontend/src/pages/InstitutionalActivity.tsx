import React from 'react'
import api from '../services/api'
import FavoriteStar from '../components/FavoriteStar'
import RunDate from '../components/RunDate'

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
  const [runDate, setRunDate] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const summary = React.useMemo(() => {
    const accumulation = rows.filter(row => Number(row.institutional_ownership_delta_pct || 0) >= 2)
    const distribution = rows.filter(row => Number(row.institutional_ownership_delta_pct || 0) <= -2)
    const notable = rows.filter(row => (row.institutional_13f_notable ?? []).length > 0)
    const newHolders = rows.reduce((sum, row) => sum + (row.institutional_13f_new_managers?.length || 0), 0)
    const topAccumulation = [...accumulation]
      .sort((a, b) => Number(b.institutional_ownership_delta_pct || 0) - Number(a.institutional_ownership_delta_pct || 0))
      .slice(0, 5)
    const topDistribution = [...distribution]
      .sort((a, b) => Number(a.institutional_ownership_delta_pct || 0) - Number(b.institutional_ownership_delta_pct || 0))
      .slice(0, 5)
    return { accumulation, distribution, notable, newHolders, topAccumulation, topDistribution }
  }, [rows])

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (DEMO_MODE) {
          const mod = await import('../data/demoScanResults')
          setRows(mod.default.institutional_activity ?? [])
          setRunDate(mod.default.scan_finished_at || mod.default.generated_at || '')
        } else {
          const res = await api.get('/scan/latest')
          setRows(res.data.institutional_activity ?? [])
          setRunDate(res.data.scan_finished_at || res.data.generated_at || '')
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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">13F Institutional Activity</h2>
          <p className="text-sm text-slate-500 mt-1">
            Delayed 13F context from institutional filings. Use this as confirmation, not as a required buy/sell signal.
          </p>
        </div>
        <RunDate value={runDate} />
      </div>

      {loading && <div className="text-sm text-slate-500">Loading 13F activity...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && !error && rows.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <div className="rounded bg-emerald-50 px-3 py-2">
              <div className="font-bold uppercase text-emerald-700">Accumulation</div>
              <div className="text-xl font-black text-emerald-800">{summary.accumulation.length}</div>
            </div>
            <div className="rounded bg-red-50 px-3 py-2">
              <div className="font-bold uppercase text-red-700">Distribution</div>
              <div className="text-xl font-black text-red-800">{summary.distribution.length}</div>
            </div>
            <div className="rounded bg-blue-50 px-3 py-2">
              <div className="font-bold uppercase text-blue-700">Notable Notes</div>
              <div className="text-xl font-black text-blue-800">{summary.notable.length}</div>
            </div>
            <div className="rounded bg-slate-50 px-3 py-2">
              <div className="font-bold uppercase text-slate-500">New Holders</div>
              <div className="text-xl font-black text-slate-800">{summary.newHolders}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-xs lg:grid-cols-2">
            {summary.topAccumulation.length > 0 && (
              <div>
                <div className="font-black uppercase tracking-wide text-emerald-700">Top accumulation</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {summary.topAccumulation.map(row => (
                    <span key={`acc-${row.ticker}`} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-bold text-emerald-800">
                      {row.ticker} {formatPct(row.institutional_ownership_delta_pct)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {summary.topDistribution.length > 0 && (
              <div>
                <div className="font-black uppercase tracking-wide text-red-700">Top distribution</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {summary.topDistribution.map(row => (
                    <span key={`dist-${row.ticker}`} className="rounded border border-red-200 bg-red-50 px-2 py-1 font-bold text-red-800">
                      {row.ticker} {formatPct(row.institutional_ownership_delta_pct)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {summary.notable.length > 0 && (
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              {summary.notable.slice(0, 4).map(row => (
                <div key={`note-${row.ticker}`}>
                  <span className="font-black text-slate-800">{row.ticker}:</span> {(row.institutional_13f_notable ?? []).slice(0, 2).join(' · ')}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
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
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <FavoriteStar row={row} snapshot={{ asset_type: row.asset_type || 'stock' }} />
                  <div className={`border rounded-md px-2 py-1 text-right ${trendClass(delta)}`}>
                    <div className="text-lg font-black tabular-nums">{formatPct(delta)}</div>
                    <div className="text-[10px] font-bold uppercase">{row.institutional_ownership_trend || '13F'}</div>
                  </div>
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
