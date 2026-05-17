import React from 'react'
import { useWatchlist } from '../context/WatchlistContext'

interface FavoriteStarProps {
  row: any
  ticker?: string
  snapshot?: any
  className?: string
}

export default function FavoriteStar({ row, ticker, snapshot, className = '' }: FavoriteStarProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const resolvedTicker = String(ticker || row?.ticker || row?.symbol || '').toUpperCase()
  const inWatchlist = resolvedTicker ? isInWatchlist(resolvedTicker) : false

  if (!resolvedTicker) return null

  const toggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (inWatchlist) {
      await removeFromWatchlist(resolvedTicker)
      return
    }
    await addToWatchlist({
      ...row,
      ...(snapshot || {}),
      ticker: resolvedTicker,
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      aria-label={inWatchlist ? `Remove ${resolvedTicker} from watchlist` : `Add ${resolvedTicker} to watchlist`}
      className={`text-xl leading-none transition-transform hover:scale-125 active:scale-95 ${inWatchlist ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'} ${className}`}
    >
      {inWatchlist ? '★' : '☆'}
    </button>
  )
}
