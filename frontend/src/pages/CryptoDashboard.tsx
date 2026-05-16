import React from 'react'
import api from '../services/api'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

function fmtUsd(value: any, compact = false) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (compact) {
    if (Math.abs(n) >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(1)}T`
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n >= 100 ? 2 : 6,
  }).format(n)
}

function fmtPct(value: any, digits = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`
}

function moveClass(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'text-slate-700'
  if (n > 0) return 'text-emerald-700'
  if (n < 0) return 'text-red-700'
  return 'text-slate-700'
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

function momentumMetric(value: any, windowLabel: string) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 15) return { value: fmtPct(n), tier: '🚀 Strong Momentum', narrative: `${windowLabel} trend established`, cls: 'text-emerald-700' }
  if (n >= 5) return { value: fmtPct(n), tier: '↗️ Positive', narrative: `${windowLabel} outperforming`, cls: 'text-emerald-600' }
  if (n <= -15) return { value: fmtPct(n), tier: '⚠️ Heavy Selloff', narrative: `${windowLabel} risk elevated`, cls: 'text-red-700' }
  if (n <= -5) return { value: fmtPct(n), tier: '↘️ Weak', narrative: `${windowLabel} under pressure`, cls: 'text-red-600' }
  return { value: fmtPct(n), tier: 'Neutral', narrative: `${windowLabel} rangebound`, cls: 'text-slate-700' }
}

function cryptoVolMetric(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 45) return { value: fmtPct(n), tier: '🔥 Extreme', narrative: 'Very wide swings', cls: 'text-red-700' }
  if (n >= 25) return { value: fmtPct(n), tier: '⚡ High', narrative: 'Elevated swings', cls: 'text-orange-600' }
  if (n >= 12) return { value: fmtPct(n), tier: 'Moderate', narrative: 'Active range', cls: 'text-yellow-600' }
  return { value: fmtPct(n), tier: '🛡️ Low', narrative: 'Quiet range', cls: 'text-green-600' }
}

function cryptoVolumeMetric(value: any) {
  const n = Number(value) * 100
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= 10) return { value: fmtPct(n), tier: '🔥 Heavy', narrative: 'High turnover', cls: 'text-red-600' }
  if (n >= 4) return { value: fmtPct(n), tier: '📈 Elevated', narrative: 'Active participation', cls: 'text-blue-600' }
  if (n >= 1) return { value: fmtPct(n), tier: 'Normal', narrative: 'Liquid trading', cls: 'text-slate-700' }
  return { value: fmtPct(n), tier: 'Thin', narrative: 'Lower turnover', cls: 'text-slate-500' }
}

function athMetric(value: any) {
  const n = Number(value)
  if (!Number.isFinite(n)) return { value: '—' }
  if (n >= -10) return { value: fmtPct(n), tier: 'Near highs', narrative: 'Strong structure', cls: 'text-emerald-700' }
  if (n >= -35) return { value: fmtPct(n), tier: 'Below ATH', narrative: 'Room to recover', cls: 'text-blue-600' }
  if (n >= -60) return { value: fmtPct(n), tier: 'Discount', narrative: 'Still impaired', cls: 'text-orange-600' }
  return { value: fmtPct(n), tier: 'Deep discount', narrative: 'High recovery risk', cls: 'text-red-600' }
}

function CryptoMetricStrip({ row }: { row: any }) {
  const oneDay = momentumMetric(row.price_change_percentage_24h, '24h')
  const sevenDay = momentumMetric(row.price_change_percentage_7d, '7d')
  const thirtyDay = momentumMetric(row.price_change_percentage_30d, '30d')
  const vol = cryptoVolMetric(row.sparkline_volatility_7d)
  const turnover = cryptoVolumeMetric(row.volume_to_market_cap)
  const ath = athMetric(row.ath_change_percentage)
  return (
    <div className="mt-3 border-t border-slate-100 bg-slate-50 px-4 py-3 -mx-4">
      <div className="flex min-w-max gap-5 overflow-x-auto sm:min-w-0 sm:flex-wrap">
        <MetricBlock label="Price" value={fmtUsd(row.price)} tier={`Rank #${row.market_cap_rank || '—'}`} narrative="Large-cap rank" />
        <MetricBlock label="24h" value={oneDay.value} tier={oneDay.tier} narrative={oneDay.narrative} valueClass={oneDay.cls} />
        <MetricBlock label="7d" value={sevenDay.value} tier={sevenDay.tier} narrative={sevenDay.narrative} valueClass={sevenDay.cls} />
        <MetricBlock label="30d" value={thirtyDay.value} tier={thirtyDay.tier} narrative={thirtyDay.narrative} valueClass={thirtyDay.cls} />
        <MetricBlock label="7d Vol" value={vol.value} tier={vol.tier} narrative={vol.narrative} valueClass={vol.cls} />
        <MetricBlock label="Volume" value={turnover.value} tier={turnover.tier} narrative={turnover.narrative} valueClass={turnover.cls} />
        <MetricBlock label="ATH" value={ath.value} tier={ath.tier} narrative={ath.narrative} valueClass={ath.cls} />
        <MetricBlock label="Mkt Cap" value={fmtUsd(row.market_cap, true)} tier="Size" narrative="Market value" />
        <MetricBlock label="Exp Move" value={`±${Math.abs(Number(row.price_change_percentage_24h) || 0).toFixed(1)}%`} tier="24h proxy" narrative="Crypto daily range" />
      </div>
    </div>
  )
}

function coingeckoUrl(row: any) {
  return row.id ? `https://www.coingecko.com/en/coins/${row.id}` : 'https://www.coingecko.com/'
}

function tradingViewSymbol(row: any) {
  const symbol = String(row.symbol || '').toUpperCase()
  if (!symbol) return 'CRYPTOCAP:TOTAL'
  if (symbol === 'BTC') return 'BINANCE:BTCUSDT'
  if (symbol === 'ETH') return 'BINANCE:ETHUSDT'
  return `BINANCE:${symbol}USDT`
}

function CryptoChart({ row }: { row: any }) {
  const symbol = tradingViewSymbol(row)
  const containerId = React.useMemo(() => `tv_crypto_${String(row.symbol || 'coin')}_${Math.random().toString(36).slice(2, 7)}`, [row.symbol])
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
        symbol,
        interval: 'D',
        timezone: 'Etc/UTC',
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
  }, [containerId, symbol])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{symbol} Daily Chart</span>
        <a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
          Open full screen
        </a>
      </div>
      <div id={containerId} ref={ref} className="overflow-hidden rounded-lg border border-slate-200" />
    </div>
  )
}

function CryptoZone({ row }: { row: any }) {
  const price = Number(row.price)
  const high = Number(row.high_24h)
  const low = Number(row.low_24h)
  const vol = Math.abs(Number(row.sparkline_volatility_7d) || Number(row.price_change_percentage_24h) || 0)
  if (!Number.isFinite(price) || price <= 0) {
    return <p className="text-xs italic text-slate-400">Zone data unavailable for this crypto snapshot.</p>
  }

  const rangePct = Number.isFinite(high) && Number.isFinite(low) && high > low ? ((high - low) / price) * 100 : Math.max(3, Math.min(12, vol / 2))
  const buyLow = price * (1 - rangePct / 100)
  const buyHigh = price * (1 - rangePct / 300)
  const chase = price * (1 + rangePct / 140)
  const danger = price * (1 - rangePct / 70)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Accumulation Zone</div>
          <div className="font-mono font-bold text-emerald-800">{fmtUsd(buyLow)} - {fmtUsd(buyHigh)}</div>
          <div className="mt-1 text-xs text-emerald-700">Staged entries only</div>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Chase Zone</div>
          <div className="font-mono font-bold text-orange-700">Above {fmtUsd(chase)}</div>
          <div className="mt-1 text-xs text-orange-600">Momentum risk rises</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-red-600">Invalidation Zone</div>
          <div className="font-mono font-bold text-red-700">Below {fmtUsd(danger)}</div>
          <div className="mt-1 text-xs text-red-600">Breakdown risk</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Crypto zones are volatility bands from the latest snapshot, not hard support/resistance. Use them for staged sizing and risk control.
      </p>
    </div>
  )
}

function CryptoNews({ row }: { row: any }) {
  const items = [
    { label: 'CoinGecko profile', value: row.name, url: coingeckoUrl(row), detail: 'Market data source and asset profile.' },
    { label: 'Last updated', value: row.last_updated ? new Date(row.last_updated).toLocaleString() : '—', detail: 'Provider timestamp from the nightly scan.' },
    { label: 'ATH date', value: row.ath_date ? new Date(row.ath_date).toLocaleDateString() : '—', detail: `${fmtPct(row.ath_change_percentage)} from all-time high.` },
  ]
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.url || undefined}
          target={item.url ? '_blank' : undefined}
          rel={item.url ? 'noopener noreferrer' : undefined}
          className={`block rounded-lg border border-slate-200 p-2.5 ${item.url ? 'hover:border-blue-300 hover:bg-blue-50' : 'bg-slate-50'}`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
          <div className="text-sm font-bold text-slate-800">{item.value}</div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.detail}</p>
        </a>
      ))}
      <p className="text-xs italic text-slate-400">Crypto-specific headline ingestion is not enabled yet; this tab shows provider context from the nightly market snapshot.</p>
    </div>
  )
}

function CryptoStrategy({ row }: { row: any }) {
  const strategy = row.crypto_strategy ?? {}
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Strategy Note</div>
        <div className="mt-1 text-sm font-black text-amber-950">{strategy.strategy || 'Watchlist candidate'}</div>
        <p className="mt-1 text-xs leading-relaxed text-amber-900">{strategy.rationale || 'Keep sizing conservative and use this as a market context signal.'}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">1h</div>
          <div className={`font-black ${moveClass(row.price_change_percentage_1h)}`}>{fmtPct(row.price_change_percentage_1h)}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">24h</div>
          <div className={`font-black ${moveClass(row.price_change_percentage_24h)}`}>{fmtPct(row.price_change_percentage_24h)}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">7d Vol</div>
          <div className="font-black text-slate-700">{fmtPct(row.sparkline_volatility_7d)}</div>
        </div>
        <div className="rounded bg-slate-50 px-2 py-2">
          <div className="font-bold uppercase text-slate-400">Volume</div>
          <div className="font-black text-slate-700">{fmtPct((row.volume_to_market_cap || 0) * 100)}</div>
        </div>
      </div>
    </div>
  )
}

function CryptoAnalysis({ row }: { row: any }) {
  return (
    <div className="space-y-3">
      {row.explanation && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Why This Appeared</div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{row.explanation}</p>
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-relaxed text-slate-700">
        <div><span className="font-bold text-slate-800">Market rank:</span> #{row.market_cap_rank || '—'} by market cap.</div>
        <div><span className="font-bold text-slate-800">Momentum:</span> 7d {fmtPct(row.price_change_percentage_7d)}, 30d {fmtPct(row.price_change_percentage_30d)}, 1y {fmtPct(row.price_change_percentage_1y)}.</div>
        <div><span className="font-bold text-slate-800">Liquidity:</span> {fmtUsd(row.total_volume, true)} daily volume, equal to {fmtPct((row.volume_to_market_cap || 0) * 100)} of market cap.</div>
        <div><span className="font-bold text-slate-800">Risk note:</span> crypto trades continuously and can gap through zones during liquidity shocks. Treat these as context, not guarantees.</div>
      </div>
    </div>
  )
}

function CryptoCard({ row }: { row: any }) {
  const [expanded, setExpanded] = React.useState(false)
  const [tab, setTab] = React.useState<'chart' | 'zone' | 'news' | 'strategy' | 'analysis'>('chart')

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {row.image && <img src={row.image} alt="" className="h-7 w-7 rounded-full" />}
              <span className="text-2xl font-black text-slate-900">{row.symbol}</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-500">CRYPTO</span>
              {row.market_cap_rank && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">Rank #{row.market_cap_rank}</span>}
            </div>
            <div className="text-sm font-semibold text-slate-600 truncate">{row.name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-black text-slate-800">{Number(row.score || 0).toFixed(0)}</div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
          </div>
        </div>

        <CryptoMetricStrip row={row} />

        {row.categories?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {row.categories.map((cat: string) => (
              <span key={cat} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{cat}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex overflow-x-auto border-t border-slate-100 bg-slate-50">
        {(['chart', 'zone', 'news', 'strategy', 'analysis'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpanded(true) }}
            className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
              expanded && tab === t ? 'border-b-2 border-blue-600 bg-white text-blue-600' : 'text-slate-400 hover:bg-blue-50 hover:text-slate-600'
            }`}
          >
            {t === 'chart' ? 'Chart' : t === 'zone' ? 'Zone' : t === 'news' ? 'News' : t === 'strategy' ? 'Strategy' : 'Analysis'}
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
            {tab === 'chart' && <CryptoChart row={row} />}
            {tab === 'zone' && <CryptoZone row={row} />}
            {tab === 'news' && <CryptoNews row={row} />}
            {tab === 'strategy' && <CryptoStrategy row={row} />}
            {tab === 'analysis' && <CryptoAnalysis row={row} />}
          </div>
        </div>
      )}
    </article>
  )
}

export default function CryptoDashboard() {
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
          const crypto = mod.default.crypto_analysis ?? {}
          setRows(crypto.top_ranked ?? [])
          setSummary(crypto.summary ?? '')
          setRunDate(crypto.scan_finished_at ?? '')
        } else {
          const res = await api.get('/scan/crypto/latest')
          setRows(res.data.top_ranked ?? [])
          setSummary(res.data.summary ?? '')
          setRunDate(res.data.scan_finished_at ?? '')
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load crypto analysis')
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
          <h2 className="text-xl font-bold text-slate-800">Large-Cap Crypto Analysis</h2>
          <p className="text-sm text-slate-500">Nightly snapshot of liquid crypto assets by market cap, momentum, volume, volatility, and ATH distance.</p>
        </div>
        {runDate && <div className="text-xs text-slate-400">Run {new Date(runDate).toLocaleString()}</div>}
      </div>

      {summary && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{summary}</div>}
      {loading && <div className="text-sm text-slate-500">Loading crypto analysis...</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="rounded border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No crypto scan has been generated yet. Run `scripts/run_crypto_scan.py` before the static deploy.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {rows.map((row) => <CryptoCard key={row.id || row.symbol} row={row} />)}
      </div>
    </div>
  )
}
