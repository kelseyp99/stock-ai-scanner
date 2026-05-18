import React from 'react'
import api from '../services/api'
import FavoriteStar from '../components/FavoriteStar'
import RunDate from '../components/RunDate'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

type CommodityFilterId = 'all' | 'momentum' | 'oversold' | 'energy' | 'metals' | 'agriculture' | 'high-vol' | 'outperforming'
type CommoditySortId = 'score' | 'relative' | 'volume' | 'volatility' | 'rsi' | 'group'

const FILTERS: { id: CommodityFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'momentum', label: 'Momentum' },
  { id: 'oversold', label: 'Oversold' },
  { id: 'energy', label: 'Energy' },
  { id: 'metals', label: 'Metals' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'high-vol', label: 'High Vol' },
  { id: 'outperforming', label: 'Outperforming' },
]

const SORTS: { id: CommoditySortId; label: string }[] = [
  { id: 'score', label: 'Score' },
  { id: 'relative', label: 'vs SPY' },
  { id: 'volume', label: 'Volume' },
  { id: 'volatility', label: 'ATR%' },
  { id: 'rsi', label: 'RSI' },
  { id: 'group', label: 'Group' },
]

function applyFilter(rows: any[], filter: CommodityFilterId) {
  const cats = (row: any) => row.categories ?? []
  const group = (row: any) => String(row.commodity_group || '').toLowerCase()
  switch (filter) {
    case 'momentum': return rows.filter(row => cats(row).includes('Momentum') || Number(row.rsi) >= 65)
    case 'oversold': return rows.filter(row => cats(row).includes('Oversold') || Number(row.rsi) <= 35)
    case 'energy': return rows.filter(row => group(row).includes('energy'))
    case 'metals': return rows.filter(row => group(row).includes('metal') || group(row).includes('mining'))
    case 'agriculture': return rows.filter(row => group(row).includes('agriculture'))
    case 'high-vol': return rows.filter(row => Number(row.atr_pct) >= 3)
    case 'outperforming': return rows.filter(row => Number(row.relative_strength_20d) >= 5)
    default: return rows
  }
}

function sortRows(rows: any[], sort: CommoditySortId) {
  const copy = [...rows]
  copy.sort((a, b) => {
    if (sort === 'group') return String(a.commodity_group || '').localeCompare(String(b.commodity_group || '')) || String(a.ticker || '').localeCompare(String(b.ticker || ''))
    const key = sort === 'relative' ? 'relative_strength_20d' : sort === 'volume' ? 'volume_ratio' : sort === 'volatility' ? 'atr_pct' : sort === 'rsi' ? 'rsi' : 'score'
    return Number(b[key] || 0) - Number(a[key] || 0)
  })
  return copy
}

function fmt(value: any, digits = 1) {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(digits) : '—'
}

function pct(value: any, digits = 1) {
  const n = Number(value)
  return Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(digits)}%` : '—'
}

function money(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : '—'
}

function MetricBlock({ label, value, tier, narrative, valueClass }: {
  label: string
  value: string
  tier?: string
  narrative?: string
  valueClass?: string
}) {
  return (
    <div className="flex min-w-[74px] flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-lg font-black tabular-nums leading-tight ${valueClass ?? 'text-slate-800'}`}>{value}</span>
      {tier && <span className="text-xs font-semibold leading-snug text-slate-600">{tier}</span>}
      {narrative && <span className="hidden text-[11px] leading-snug text-slate-400 sm:block">{narrative}</span>}
    </div>
  )
}

function ScoreBadge({ row }: { row: any }) {
  const score = Number(row.score || 0)
  const cls = score >= 10 ? 'bg-orange-500 text-white ring-2 ring-orange-300' : score >= 7 ? 'bg-green-500 text-white ring-2 ring-green-300' : score >= 4 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
  return (
    <div title={`Score: ${score}`} className={`flex min-w-[52px] flex-col items-center justify-center rounded-xl px-3 py-1.5 shadow-sm ${cls}`}>
      <span className="text-2xl font-black leading-none tabular-nums">{score}</span>
      {row.percentile_label && <span className="mt-0.5 whitespace-nowrap text-[10px] font-semibold leading-tight opacity-90">{row.percentile_label}</span>}
    </div>
  )
}

function rsiTier(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return {}
  if (n > 75) return { tier: 'Overbought', narrative: 'Stretched commodity trend', cls: 'text-orange-600' }
  if (n > 65) return { tier: 'Strong Momentum', narrative: 'Trend established', cls: 'text-blue-600' }
  if (n < 30) return { tier: 'Oversold', narrative: 'Reversal candidate', cls: 'text-emerald-600' }
  return { tier: 'Neutral', narrative: 'No extreme reading', cls: 'text-slate-700' }
}

function atrTier(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return {}
  if (n >= 5) return { tier: 'Very High', narrative: 'Headline-sensitive swings', cls: 'text-red-600' }
  if (n >= 3) return { tier: 'High', narrative: 'Elevated swings', cls: 'text-orange-500' }
  if (n < 1.5) return { tier: 'Low', narrative: 'Compressed range', cls: 'text-green-600' }
  return { tier: 'Moderate', narrative: 'Normal range', cls: 'text-yellow-600' }
}

function MetricStrip({ row }: { row: any }) {
  const rsi = rsiTier(row.rsi)
  const atr = atrTier(row.atr_pct)
  return (
    <div className="mt-3 border-t border-slate-100 bg-slate-50 px-4 py-3 -mx-4">
      <div className="flex min-w-max gap-5 overflow-x-auto sm:min-w-0 sm:flex-wrap">
        <MetricBlock label="RSI" value={fmt(row.rsi)} tier={rsi.tier} narrative={rsi.narrative} valueClass={rsi.cls} />
        <MetricBlock label="ATR%" value={row.atr_pct != null ? `${fmt(row.atr_pct)}%` : '—'} tier={atr.tier} narrative={atr.narrative} valueClass={atr.cls} />
        <MetricBlock label="Group" value={row.commodity_group || '—'} />
        <MetricBlock label="vs MA20" value={pct(row.ma_distance_pct)} />
        <MetricBlock label="Volume" value={row.volume_ratio != null ? `${fmt(row.volume_ratio, 2)}x` : '—'} />
        <MetricBlock label="vs SPY" value={pct(row.relative_strength_20d)} />
        <MetricBlock label="Exp Move" value={row.expected_move_pct != null ? `±${fmt(row.expected_move_pct)}%` : `±${fmt(row.atr_pct)}%`} tier="Daily range" />
      </div>
    </div>
  )
}

function articlesForRow(row: any): any[] {
  const articles = row.news_articles ?? row.news ?? row.articles
  if (Array.isArray(articles) && articles.length) return articles
  if (row.news_headline) return [{ title: row.news_headline, publisher: row.news_catalyst || 'Scanner news signal', url: '', snippet: row.news_catalyst || '' }]
  return []
}

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return ''
  const h = Math.floor((Date.now() - new Date(isoStr).getTime()) / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Chart({ ticker }: { ticker: string }) {
  const containerId = React.useMemo(() => `tv_commodity_${ticker}_${Math.random().toString(36).slice(2, 7)}`, [ticker])
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
        height: 360,
        width: '100%',
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
      })
    }
    ref.current.appendChild(script)
    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [containerId, ticker])
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{ticker} Daily Chart</span>
        <a href={`https://www.tradingview.com/chart/?symbol=${ticker}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Open full screen</a>
      </div>
      <div id={containerId} ref={ref} className="overflow-hidden rounded-lg border border-slate-200" />
    </div>
  )
}

function Zone({ row }: { row: any }) {
  const price = Number(row.price)
  const atr = Number(row.atr_dollar)
  const ma20 = Number(row.ma20)
  const base = Number.isFinite(ma20) ? ma20 : price
  if (!Number.isFinite(base) || !Number.isFinite(atr) || atr <= 0) return <p className="text-xs italic text-slate-400">Zone data unavailable for this commodity snapshot.</p>
  const buyLow = base - atr * 0.6
  const buyHigh = base + atr * 0.2
  const chase = base + atr * 1.3
  const danger = base - atr * 1.6
  return (
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
      <div className={`rounded-lg border px-3 py-2 ${price >= buyLow && price <= buyHigh ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-green-700">Accumulation Zone</div>
        <div className="font-mono font-bold text-green-800">{money(buyLow)} - {money(buyHigh)}</div>
      </div>
      <div className={`rounded-lg border px-3 py-2 ${price > chase ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Chase Zone</div>
        <div className="font-mono font-bold text-orange-700">Above {money(chase)}</div>
      </div>
      <div className={`rounded-lg border px-3 py-2 ${price < danger ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Trend Risk</div>
        <div className="font-mono font-bold text-red-700">Below {money(danger)}</div>
      </div>
    </div>
  )
}

function News({ row }: { row: any }) {
  const [articles, setArticles] = React.useState<any[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (DEMO_MODE) {
      setArticles(articlesForRow(row))
      setError(null)
      return
    }
    setArticles(null)
    setError(null)
    api.get(`/news/${row.ticker}?max=6`).then(res => setArticles(res.data.articles || [])).catch(e => setError(e?.message || 'Failed to load news'))
  }, [row])
  if (error) return <p className="text-xs text-red-500">{error}</p>
  if (!articles) return <p className="text-xs text-slate-400">Loading news...</p>
  if (!articles.length) return <p className="text-xs italic text-slate-400">No recent commodity news found in this snapshot.</p>
  return (
    <div className="space-y-2.5">
      {articles.map((a, i) => {
        const Tag = a.url ? 'a' : 'div'
        return (
          <Tag key={i} href={a.url || undefined} target={a.url ? '_blank' : undefined} rel={a.url ? 'noopener noreferrer' : undefined} className={`block rounded-lg border border-slate-200 p-2.5 ${a.url ? 'hover:border-blue-300 hover:bg-blue-50' : 'bg-slate-50'}`}>
            <span className="text-sm font-semibold leading-snug text-slate-800">{a.title}</span>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
              {a.publisher && <span className="font-medium text-slate-500">{a.publisher}</span>}
              {a.published_at && <span>{timeAgo(a.published_at)}</span>}
            </div>
            {a.snippet && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{a.snippet}</p>}
          </Tag>
        )
      })}
    </div>
  )
}

function Strategy({ row }: { row: any }) {
  const s = row.commodity_strategy ?? { strategy: 'Defined-risk spread', rationale: 'Use liquid commodity proxies and keep headline risk defined.' }
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Commodity Strategy</div>
        <div className="mt-1 text-sm font-black text-amber-950">{s.strategy}</div>
        <p className="mt-1 text-xs leading-relaxed text-amber-900">{s.rationale}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">ATR</div><div className="font-black text-slate-700">{fmt(row.atr_pct)}%</div></div>
        <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">RSI</div><div className="font-black text-slate-700">{fmt(row.rsi)}</div></div>
        <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">Volume</div><div className="font-black text-slate-700">{fmt(row.volume_ratio, 2)}x</div></div>
        <div className="rounded bg-slate-50 px-2 py-2"><div className="font-bold uppercase text-slate-400">Group</div><div className="font-black text-slate-700">{row.commodity_group || '—'}</div></div>
      </div>
    </div>
  )
}

function Analysis({ row }: { row: any }) {
  const cats = row.categories ?? []
  return (
    <div className="space-y-3">
      {row.explanation && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Why This Commodity Appeared</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{row.explanation}</p>
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-relaxed text-slate-700">
        <div><span className="font-bold text-slate-800">Theme:</span> {row.commodity_theme || 'Commodity proxy'}</div>
        <div><span className="font-bold text-slate-800">Group:</span> {row.commodity_group || 'Commodity'}</div>
        <div><span className="font-bold text-slate-800">Relative strength:</span> {pct(row.relative_strength_20d)} versus SPY over the scanner window.</div>
        <div><span className="font-bold text-slate-800">Trend state:</span> {cats.includes('Momentum') ? 'Momentum is constructive.' : cats.includes('Oversold') ? 'Oversold/mean-reversion setup.' : 'Mixed or neutral technical setup.'}</div>
        <div><span className="font-bold text-slate-800">Risk note:</span> Commodity proxies can gap on macro reports, rates, currency moves, weather, inventory data, and geopolitical headlines.</div>
      </div>
    </div>
  )
}

function CommodityCard({ row }: { row: any }) {
  const [expanded, setExpanded] = React.useState(false)
  const [tab, setTab] = React.useState<'chart' | 'zone' | 'news' | 'strategy' | 'analysis'>('chart')
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{row.ticker}</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-500">Commodity</span>
              {row.commodity_theme && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{row.commodity_theme}</span>}
            </div>
            <div className="truncate text-sm font-semibold text-slate-600">{row.commodity_name || row.company_name}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
            <FavoriteStar row={row} snapshot={{ asset_type: 'commodity' }} />
            <ScoreBadge row={row} />
          </div>
        </div>
        <MetricStrip row={row} />
      </div>

      <div className="flex overflow-x-auto border-t border-slate-100 bg-slate-50">
        {(['chart', 'zone', 'news', 'strategy', 'analysis'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setExpanded(true) }} className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${expanded && tab === t ? 'border-b-2 border-blue-600 bg-white text-blue-600' : 'text-slate-400 hover:bg-blue-50 hover:text-slate-600'}`}>
            {t === 'strategy' ? 'Options' : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        {expanded && <button onClick={() => setExpanded(false)} className="shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-slate-600">Hide</button>}
      </div>

      {expanded && (
        <div className="border-t border-slate-100">
          <div className="space-y-4 p-4">
            {tab === 'chart' && <Chart ticker={row.ticker} />}
            {tab === 'zone' && <Zone row={row} />}
            {tab === 'news' && <News row={row} />}
            {tab === 'strategy' && <Strategy row={row} />}
            {tab === 'analysis' && <Analysis row={row} />}
          </div>
        </div>
      )}
    </article>
  )
}

export default function CommodityDashboard() {
  const [rows, setRows] = React.useState<any[]>([])
  const [summary, setSummary] = React.useState('')
  const [runDate, setRunDate] = React.useState('')
  const [filter, setFilter] = React.useState<CommodityFilterId>('all')
  const [sort, setSort] = React.useState<CommoditySortId>('score')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const visibleRows = React.useMemo(() => sortRows(applyFilter(rows, filter), sort), [rows, filter, sort])

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (DEMO_MODE) {
          const mod = await import('../data/demoScanResults')
          const commodities = mod.default.commodity_analysis ?? {}
          setRows(commodities.top_ranked ?? [])
          setSummary(commodities.summary ?? '')
          setRunDate(commodities.scan_finished_at || mod.default.scan_finished_at || mod.default.generated_at || '')
        } else {
          const res = await api.get('/scan/commodities/latest')
          setRows(res.data.top_ranked ?? [])
          setSummary(res.data.summary ?? '')
          setRunDate(res.data.scan_finished_at || res.data.generated_at || '')
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load commodity scan')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Commodity Analysis</h2>
          <p className="text-sm text-slate-500">Nightly commodity proxy scan across metals, energy, agriculture, and broad baskets.</p>
        </div>
        <RunDate value={runDate} />
      </div>
      {summary && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{summary}</div>}
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(item => (
              <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${filter === item.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold uppercase text-slate-400">Rank by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as CommoditySortId)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-bold text-slate-700">
              {SORTS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <span className="text-slate-400">{visibleRows.length}/{rows.length}</span>
          </div>
        </div>
      </div>
      {loading && <div className="text-sm text-slate-500">Loading commodity scan...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No commodity scan has been generated yet. Run `scripts/run_commodity_scan.py` before the static deploy.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibleRows.map((row) => <CommodityCard key={row.ticker} row={row} />)}
      </div>
    </div>
  )
}
