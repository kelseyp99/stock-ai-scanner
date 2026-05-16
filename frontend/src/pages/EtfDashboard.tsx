import React from 'react'
import api from '../services/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

function fmt(value: any, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

function strategy(row: any) {
  return row.etf_strategy ?? { strategy: 'Defined-risk spread', rationale: 'Use liquid ETF options and keep risk defined.' }
}

function money(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `$${n.toFixed(2)}`
}

function pct(value: any, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`
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

function rsiMetric(rsi: any) {
  const n = Number(rsi)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n > 75) return { value: n.toFixed(1), tier: '⚠️ Overbought', narrative: 'Stretched trend', cls: 'text-orange-600' }
  if (n > 65) return { value: n.toFixed(1), tier: '🚀 Strong Momentum', narrative: 'Trend established', cls: 'text-blue-600' }
  if (n < 30) return { value: n.toFixed(1), tier: '💚 Oversold', narrative: 'Bounce candidate', cls: 'text-emerald-600' }
  if (n < 45) return { value: n.toFixed(1), tier: '🔻 Weakening', narrative: 'Momentum fading', cls: 'text-slate-600' }
  return { value: n.toFixed(1), tier: 'Neutral', narrative: 'No extreme reading', cls: 'text-slate-700' }
}

function atrMetric(atrPct: any, atrDollar: any) {
  const n = Number(atrPct)
  const dollar = Number(atrDollar)
  const suffix = Number.isFinite(dollar) ? ` (${money(dollar)})` : ''
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 5) return { value: `${n.toFixed(1)}%`, tier: '🔥 Very High', narrative: `Options-grade vol${suffix}`, cls: 'text-red-600' }
  if (n >= 3) return { value: `${n.toFixed(1)}%`, tier: '⚡ High', narrative: `Elevated swings${suffix}`, cls: 'text-orange-500' }
  if (n >= 1.5) return { value: `${n.toFixed(1)}%`, tier: 'Moderate', narrative: `Normal range${suffix}`, cls: 'text-yellow-600' }
  return { value: `${n.toFixed(1)}%`, tier: '🛡️ Low', narrative: `Stable ETF range${suffix}`, cls: 'text-green-600' }
}

function maMetric(row: any) {
  const n = Number(row.ma_distance_pct)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 12) return { value: pct(n), tier: 'Stretched', narrative: 'Pullback risk', cls: 'text-orange-600' }
  if (n >= 5) return { value: pct(n), tier: 'Extended', narrative: 'Extended but intact', cls: 'text-amber-600' }
  if (n <= -8) return { value: pct(n), tier: 'Discount', narrative: 'Below trend', cls: 'text-emerald-600' }
  return { value: pct(n), tier: 'Near trend', narrative: 'Close to MA20', cls: 'text-slate-700' }
}

function volumeMetric(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 2) return { value: `${n.toFixed(2)}x`, tier: '🔥 Heavy', narrative: 'Strong participation', cls: 'text-red-600' }
  if (n >= 1.25) return { value: `${n.toFixed(2)}x`, tier: '📈 Elevated', narrative: 'Above-avg participation', cls: 'text-blue-600' }
  if (n < 0.75) return { value: `${n.toFixed(2)}x`, tier: 'Quiet', narrative: 'Below average volume', cls: 'text-slate-500' }
  return { value: `${n.toFixed(2)}x`, tier: 'Normal', narrative: 'Typical volume', cls: 'text-slate-700' }
}

function relativeMetric(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 5) return { value: pct(n), tier: '↗️ Outperforming', narrative: 'Beating SPY', cls: 'text-emerald-700' }
  if (n <= -5) return { value: pct(n), tier: '↘️ Lagging', narrative: 'Trailing SPY', cls: 'text-red-600' }
  return { value: pct(n), tier: 'In line', narrative: 'Near SPY', cls: 'text-slate-700' }
}

function EtfMetricStrip({ row }: { row: any }) {
  const rsi = rsiMetric(row.rsi)
  const atr = atrMetric(row.atr_pct, row.atr_dollar)
  const ma = maMetric(row)
  const vol = volumeMetric(row.volume_ratio)
  const rs = relativeMetric(row.relative_strength_20d)
  return (
    <div className="mt-3 border-t border-slate-100 bg-slate-50 px-4 py-3 -mx-4">
      <div className="flex min-w-max gap-5 overflow-x-auto sm:min-w-0 sm:flex-wrap">
        <MetricBlock label="RSI" value={rsi.value} tier={rsi.tier} narrative={rsi.narrative} valueClass={rsi.cls} />
        <MetricBlock label="ATR%" value={atr.value} tier={atr.tier} narrative={atr.narrative} valueClass={atr.cls} />
        <MetricBlock label="Earnings" value="—" />
        <MetricBlock label="Inst" value="—" />
        <MetricBlock label="Gov" value="—" />
        <MetricBlock label="vs MA20" value={ma.value} tier={ma.tier} narrative={ma.narrative} valueClass={ma.cls} />
        <MetricBlock label="Volume" value={vol.value} tier={vol.tier} narrative={vol.narrative} valueClass={vol.cls} />
        <MetricBlock label="vs SPY" value={rs.value} tier={rs.tier} narrative={rs.narrative} valueClass={rs.cls} />
        <MetricBlock label="Exp Move" value={row.expected_move_pct != null ? `±${fmt(row.expected_move_pct)}%` : `±${fmt(row.atr_pct)}%`} tier="Daily range" />
      </div>
    </div>
  )
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

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return ''
  const diff = Date.now() - new Date(isoStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function EtfChart({ ticker }: { ticker: string }) {
  const containerId = React.useMemo(() => `tv_etf_${ticker}_${Math.random().toString(36).slice(2, 7)}`, [ticker])
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
        <a href={`https://www.tradingview.com/chart/?symbol=${ticker}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
          Open full screen
        </a>
      </div>
      <div id={containerId} ref={ref} className="overflow-hidden rounded-lg border border-slate-200" />
    </div>
  )
}

function EtfNews({ row }: { row: any }) {
  const [articles, setArticles] = React.useState<any[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (DEMO_MODE) {
      setArticles(staticArticlesForRow(row))
      setError(null)
      return
    }
    setArticles(null)
    setError(null)
    api.get(`/news/${row.ticker}?max=6`)
      .then(res => setArticles(res.data.articles || []))
      .catch(e => setError(e?.message || 'Failed to load news'))
  }, [row])

  if (error) return <p className="text-xs text-red-500">{error}</p>
  if (!articles) return <p className="text-xs text-slate-400">Loading news...</p>
  if (!articles.length) return <p className="text-xs italic text-slate-400">No recent ETF news found in this snapshot.</p>

  return (
    <div className="space-y-2.5">
      {articles.map((a, i) => {
        const hasUrl = Boolean(a.url)
        const CardTag = hasUrl ? 'a' : 'div'
        return (
          <CardTag
            key={i}
            href={hasUrl ? a.url : undefined}
            target={hasUrl ? '_blank' : undefined}
            rel={hasUrl ? 'noopener noreferrer' : undefined}
            className={`block rounded-lg border border-slate-200 p-2.5 ${hasUrl ? 'hover:border-blue-300 hover:bg-blue-50' : 'bg-slate-50'}`}
          >
            <span className="text-sm font-semibold leading-snug text-slate-800">{a.title}</span>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
              {a.publisher && <span className="font-medium text-slate-500">{a.publisher}</span>}
              {a.publisher && a.published_at && <span>·</span>}
              {a.published_at && <span>{timeAgo(a.published_at)}</span>}
            </div>
            {a.snippet && <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{a.snippet}</p>}
          </CardTag>
        )
      })}
    </div>
  )
}

function EtfZone({ row }: { row: any }) {
  const price = Number(row.price)
  const atr = Number(row.atr_dollar)
  const ma20 = Number(row.ma20)
  const base = Number.isFinite(ma20) ? ma20 : price
  const hasAtr = Number.isFinite(base) && Number.isFinite(atr) && atr > 0
  if (!hasAtr) return <p className="text-xs italic text-slate-400">Zone data unavailable for this ETF snapshot.</p>

  const buyLow = base - atr * 0.5
  const buyHigh = base + atr * 0.25
  const chase = base + atr * 1.25
  const danger = base - atr * 1.5
  const inBuy = Number.isFinite(price) && price >= buyLow && price <= buyHigh
  const inChase = Number.isFinite(price) && price > chase
  const inDanger = Number.isFinite(price) && price < danger

  return (
    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
      <div className={`rounded-lg border px-3 py-2 ${inBuy ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-green-700">Buy Zone</div>
        <div className="font-mono font-bold text-green-800">{money(buyLow)} - {money(buyHigh)}</div>
        {inBuy && <div className="mt-1 text-xs font-semibold text-green-700">Price is here</div>}
      </div>
      <div className={`rounded-lg border px-3 py-2 ${inChase ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Chase Zone</div>
        <div className="font-mono font-bold text-orange-700">Above {money(chase)}</div>
        {inChase && <div className="mt-1 text-xs font-semibold text-orange-600">Extended entry</div>}
      </div>
      <div className={`rounded-lg border px-3 py-2 ${inDanger ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Danger Zone</div>
        <div className="font-mono font-bold text-red-700">Below {money(danger)}</div>
        {inDanger && <div className="mt-1 text-xs font-semibold text-red-600">Trend risk</div>}
      </div>
    </div>
  )
}

function EtfOptions({ row }: { row: any }) {
  const s = strategy(row)
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Options Strategy</div>
        <div className="mt-1 text-sm font-black text-indigo-900">{s.strategy}</div>
        <p className="mt-1 text-xs leading-relaxed text-indigo-800">{s.rationale}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">ATR</div>
          <div className="font-black text-slate-700">{fmt(row.atr_pct)}%</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">Exp Move</div>
          <div className="font-black text-slate-700">{row.expected_move_pct != null ? `±${fmt(row.expected_move_pct)}%` : '—'}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">RSI</div>
          <div className="font-black text-slate-700">{fmt(row.rsi)}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">Vol</div>
          <div className="font-black text-slate-700">{fmt(row.volume_ratio)}x</div>
        </div>
      </div>
    </div>
  )
}

function EtfAnalysis({ row }: { row: any }) {
  const cats = row.categories ?? []
  return (
    <div className="space-y-3">
      {row.explanation && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Why This ETF Appeared</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{row.explanation}</p>
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-relaxed text-slate-700">
        <div><span className="font-bold text-slate-800">Theme:</span> {row.etf_theme || 'ETF basket'}</div>
        <div><span className="font-bold text-slate-800">Relative strength:</span> {pct(row.relative_strength_20d)} versus SPY over the scanner window.</div>
        <div><span className="font-bold text-slate-800">Trend state:</span> {cats.includes('Momentum') ? 'Momentum is constructive.' : cats.includes('Oversold') ? 'Oversold/mean-reversion setup.' : 'Mixed or neutral technical setup.'}</div>
        <div><span className="font-bold text-slate-800">Risk note:</span> ETF diversification reduces single-name gap risk, but sector/theme ETFs can still move sharply around macro data and earnings concentration.</div>
      </div>
    </div>
  )
}

function EtfCard({ row }: { row: any }) {
  const [expanded, setExpanded] = React.useState(false)
  const [tab, setTab] = React.useState<'chart' | 'zone' | 'news' | 'options' | 'analysis'>('chart')

  return (
    <article className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-black text-slate-900">{row.ticker}</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-500">ETF</span>
              {row.etf_theme && <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{row.etf_theme}</span>}
            </div>
            <div className="text-sm font-semibold text-slate-600 truncate">{row.etf_name || row.company_name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-black text-slate-800">{fmt(row.score, 0)}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
          </div>
        </div>

        <EtfMetricStrip row={row} />
      </div>

      <div className="flex overflow-x-auto border-t border-slate-100 bg-slate-50">
        {(['chart', 'zone', 'news', 'options', 'analysis'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpanded(true) }}
            className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
              expanded && tab === t ? 'border-b-2 border-blue-600 bg-white text-blue-600' : 'text-slate-400 hover:bg-blue-50 hover:text-slate-600'
            }`}
          >
            {t === 'chart' ? 'Chart' : t === 'zone' ? 'Zone' : t === 'news' ? 'News' : t === 'options' ? 'Options' : 'Analysis'}
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

      {expanded && (
        <div className="border-t border-slate-100">
          <div className="space-y-4 p-4">
            {tab === 'chart' && <EtfChart ticker={row.ticker} />}
            {tab === 'zone' && <EtfZone row={row} />}
            {tab === 'news' && <EtfNews row={row} />}
            {tab === 'options' && <EtfOptions row={row} />}
            {tab === 'analysis' && <EtfAnalysis row={row} />}
          </div>
        </div>
      )}
    </article>
  )
}

export default function EtfDashboard() {
  const [rows, setRows] = React.useState<any[]>([])
  const [summary, setSummary] = React.useState('')
  const [runDate, setRunDate] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (DEMO_MODE) {
          const mod = await import('../data/demoScanResults')
          const etfs = mod.default.etf_recommendations ?? {}
          setRows(etfs.top_ranked ?? [])
          setSummary(etfs.summary ?? '')
          setRunDate(etfs.scan_finished_at ?? '')
        } else {
          const res = await api.get('/scan/etfs/latest')
          setRows(res.data.top_ranked ?? [])
          setSummary(res.data.summary ?? '')
          setRunDate(res.data.scan_finished_at ?? '')
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load ETF scan')
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
          <h2 className="text-xl font-bold text-slate-800">ETF Recommendations</h2>
          <p className="text-sm text-slate-500">Nightly ETF scan with ETF-aware options strategy notes.</p>
        </div>
        {runDate && <div className="text-xs text-slate-400">Run {new Date(runDate).toLocaleString()}</div>}
      </div>

      {summary && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{summary}</div>}
      {loading && <div className="text-sm text-slate-500">Loading ETF scan...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No ETF scan has been generated yet. Run `scripts/run_etf_scan.py` before the static deploy.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {rows.map((row) => <EtfCard key={row.ticker} row={row} />)}
      </div>
    </div>
  )
}
