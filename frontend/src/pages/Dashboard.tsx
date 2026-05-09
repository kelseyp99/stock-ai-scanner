import React from 'react'
import api from '../services/api'
import StockTable from '../components/StockTable'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const CATEGORY_ORDER = [
  'Momentum',
  'Breakout Volume',
  'Extreme Volatility',
  'Dividend',
  'Oversold',
  'Pullback Risk',
  'Speculative / High Risk',
]

export default function Dashboard() {
  const [topRanked, setTopRanked] = React.useState<any[]>([])
  const [byCategory, setByCategory] = React.useState<Record<string, any>>({})
  const [summary, setSummary] = React.useState<string>('')
  const [totalScanned, setTotalScanned] = React.useState<number>(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadDemo = async () => {
    try {
      const mod = await import('../data/demoScanResults')
      const d = mod.default
      setTopRanked(d.top_ranked)
      setByCategory(d.by_category)
      setSummary(d.summary)
      setTotalScanned(d.total_scanned)
    } catch (e: any) {
      setError('Failed to load demo data')
    }
  }

  const refresh = async () => {
    if (DEMO_MODE) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/scan/grouped')
      setTopRanked(res.data.top_ranked ?? [])
      setByCategory(res.data.by_category ?? {})
      setSummary(res.data.summary ?? '')
      setTotalScanned(res.data.total_scanned ?? 0)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (DEMO_MODE) loadDemo()
    else refresh()
  }, [])

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Stock Scanner Dashboard</h2>
        <div className="flex items-center gap-3">
          {totalScanned > 0 && (
            <span className="text-sm text-gray-500">{totalScanned} tickers scanned</span>
          )}
          {!DEMO_MODE && (
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Scanning…' : 'Refresh'}
            </button>
          )}
          {DEMO_MODE && (
            <span className="text-xs text-gray-500 italic">Static Demo Mode</span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900">
          <span className="font-semibold mr-2">📊 Scan Summary:</span>{summary}
        </div>
      )}

      {/* Top Ranked Table */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">🏆 Top Ranked</h3>
        <StockTable data={topRanked} />
      </section>

      {/* By Category */}
      {CATEGORY_ORDER.filter(cat => byCategory[cat]?.length > 0).map(cat => (
        <section key={cat}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {categoryIcon(cat)} {cat}
          </h3>
          <StockTable data={byCategory[cat].slice(0, 5)} />
        </section>
      ))}
    </div>
  )
}

function categoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    'Momentum': '🚀',
    'Breakout Volume': '📈',
    'Extreme Volatility': '⚡',
    'Dividend': '💰',
    'Oversold': '🔻',
    'Pullback Risk': '⚠️',
    'Speculative / High Risk': '🎲',
  }
  return icons[cat] ?? '📌'
}
