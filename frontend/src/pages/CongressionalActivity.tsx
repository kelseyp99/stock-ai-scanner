import React from 'react'
import api from '../services/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

function money(value: any) {
  const n = Number(value || 0)
  if (!Number.isFinite(n) || n === 0) return '—'
  const sign = n > 0 ? '+' : '-'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(0)}`
}

function tradeClass(type: string) {
  const t = type.toLowerCase()
  if (t.includes('purchase') || t.includes('buy')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (t.includes('sale') || t.includes('sell')) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function CongressionalActivity() {
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
          setRows(mod.default.government_activity ?? [])
        } else {
          const res = await api.get('/scan/latest')
          setRows(res.data.government_activity ?? [])
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load congressional activity')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Congressional Trading Activity</h2>
        <p className="text-sm text-slate-500 mt-1">
          STOCK Act disclosure context from configured public disclosure extracts. Disclosures are delayed and should be treated as supporting context.
        </p>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading congressional activity...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No congressional trading file is configured yet. Generate one with `scripts/ingest_government_trades.py`.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {rows.map((row) => {
          const trades = row.gov_trade_recent_trades ?? []
          const members = row.gov_trade_members ?? []
          return (
            <article key={row.ticker} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl font-black text-slate-900">{row.ticker}</span>
                    {row.exchange_name && <span className="text-[10px] font-bold text-slate-500 border border-slate-200 rounded px-1.5 py-0.5">{row.exchange_name}</span>}
                    {row.gov_trade_signal && <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-1.5 py-0.5">{row.gov_trade_signal}</span>}
                  </div>
                  {row.company_name && <div className="text-sm font-semibold text-slate-600 truncate">{row.company_name}</div>}
                  <div className="text-xs text-slate-400 mt-1">
                    Latest disclosure {row.gov_trade_latest_disclosure_date || 'unknown'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-slate-800">{money(row.gov_trade_net_amount_90d)}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Net 90d</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-1 font-bold">Buys {row.gov_trade_buy_count_90d ?? 0}</span>
                <span className="rounded bg-red-50 text-red-700 px-2 py-1 font-bold">Sells {row.gov_trade_sell_count_90d ?? 0}</span>
                {members.slice(0, 4).map((member: string) => (
                  <span key={member} className="rounded bg-slate-50 text-slate-600 px-2 py-1">{member}</span>
                ))}
              </div>

              {trades.length > 0 && (
                <div className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded">
                  {trades.slice(0, 5).map((trade: any, idx: number) => (
                    <div key={`${trade.member}-${trade.trade_date}-${idx}`} className="p-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-700 truncate">{trade.member || 'Unknown filer'}</span>
                        <span className={`border rounded px-1.5 py-0.5 font-bold ${tradeClass(trade.transaction_type || '')}`}>
                          {trade.transaction_type || 'Trade'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-500">
                        <span>{money(trade.amount_midpoint)}</span>
                        {trade.trade_date && <span>Trade {trade.trade_date}</span>}
                        {trade.disclosure_date && <span>Filed {trade.disclosure_date}</span>}
                        {trade.source_url && <a href={trade.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">source</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
