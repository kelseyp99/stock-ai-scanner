import React from 'react'
import { useWatchlist } from '../context/WatchlistContext'
import StockTable from '../components/StockTable'

export default function Watchlist() {
  const { items, clearWatchlist, removeFromWatchlist } = useWatchlist()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <span className="text-6xl mb-4">☆</span>
        <p className="text-lg font-semibold text-slate-500">Your watchlist is empty</p>
        <p className="text-sm mt-1 text-slate-400">Hit the ★ star on any stock card on the Dashboard to save it here.</p>
      </div>
    )
  }

  const rows = items.map(i => i.snapshot)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">⭐ Watchlist</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {items.length} stock{items.length !== 1 ? 's' : ''} · Metrics saved at time of adding · Stored locally
          </p>
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
            {/* Render a mini StockTable with just this one row so it uses the full StockCard */}
            <StockTable data={[item.snapshot]} />
          </div>
        ))}
      </div>
    </div>
  )
}

