import React from 'react'
import { useWatchlist, type WatchlistItem } from '../context/WatchlistContext'
import { useAuth } from '../context/AuthContext'
import StockTable from '../components/StockTable'

function WatchlistNotes({ item }: { item: WatchlistItem }) {
  const { updateNotes } = useWatchlist()
  const [draft, setDraft] = React.useState(item.notes || '')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setDraft(item.notes || '')
  }, [item.notes])

  const save = async () => {
    setSaving(true)
    try {
      await updateNotes(item.ticker, draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative -mt-2 rounded-b-lg border border-t-0 border-blue-100 bg-blue-50/70 px-3 pb-3 pt-5 shadow-sm">
      <div className="absolute left-6 top-0 h-3 w-px -translate-y-full bg-blue-200" />
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-[11px] font-black uppercase tracking-wide text-blue-700">
          User note for {item.ticker}
        </label>
        {item.updatedAt && (
          <span className="text-[10px] font-semibold text-blue-300">
            Updated {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        rows={3}
        placeholder="Add your thesis, target, stop, earnings concern, or follow-up reminder..."
        className="w-full resize-y rounded-md border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <div className="mt-1 flex items-center justify-between text-[11px] text-blue-400">
        <span>{saving ? 'Saving...' : 'Saved when you leave the notes box'}</span>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Save notes
        </button>
      </div>
    </div>
  )
}

function SavedAssetSummary({ item }: { item: WatchlistItem }) {
  const row = item.snapshot || {}
  const assetType = String(row.asset_type || '').toLowerCase()
  const name = row.company_name || row.etf_name || row.name
  const price = row.price ?? row.current_price
  const score = row.score
  const isSpecialAsset = assetType === 'etf' || assetType === 'crypto'

  if (!isSpecialAsset) return <StockTable data={[row]} />

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-black text-slate-900">{item.ticker}</span>
            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-500">{assetType}</span>
            {row.market_cap_rank && <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">Rank #{row.market_cap_rank}</span>}
            {row.etf_theme && <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{row.etf_theme}</span>}
          </div>
          {name && <div className="text-sm font-semibold text-slate-600 truncate">{name}</div>}
          {row.categories?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {row.categories.slice(0, 5).map((cat: string) => (
                <span key={cat} className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{cat}</span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          {score != null && <div className="text-2xl font-black text-slate-800">{score}</div>}
          <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
          {price != null && <div className="mt-1 text-sm font-bold text-slate-600">${Number(price).toFixed(Number(price) >= 100 ? 2 : 4)}</div>}
        </div>
      </div>
      {(row.explanation || row.reason || row.rationale) && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{row.explanation || row.reason || row.rationale}</p>
      )}
    </div>
  )
}

export default function Watchlist() {
  const { items, loading, error, storageMode, clearWatchlist, removeFromWatchlist } = useWatchlist()
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <span className="text-4xl mb-4">☆</span>
        <p className="text-lg font-semibold text-slate-500">Loading your watchlist...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <span className="text-6xl mb-4">☆</span>
        <p className="text-lg font-semibold text-slate-500">Your watchlist is empty</p>
        <p className="text-sm mt-1 text-slate-400">Hit the ★ star on any stock card on the Dashboard to save it here.</p>
        <p className="text-xs mt-3 text-slate-400">
          {storageMode === 'firebase' && user?.email ? `Synced to Firebase for ${user.email}` : 'Sign in with Google to sync your watchlist and notes.'}
        </p>
        {error && <p className="text-xs mt-2 text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">⭐ Watchlist</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {items.length} stock{items.length !== 1 ? 's' : ''} · Metrics saved at time of adding · {storageMode === 'firebase' && user?.email ? `Synced to ${user.email}` : 'Stored locally until you sign in'}
          </p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
        <button
          onClick={() => { if (confirm('Clear entire watchlist?')) clearWatchlist() }}
          className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          🗑 Clear all
        </button>
      </div>

      {/* Saved date column above each card */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.ticker} className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-400">
                Added {new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => removeFromWatchlist(item.ticker)}
                className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
              >
                ✕ Remove
              </button>
            </div>
            <SavedAssetSummary item={item} />
            <WatchlistNotes item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
