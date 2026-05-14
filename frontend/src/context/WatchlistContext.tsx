import React from 'react'

const STORAGE_KEY = 'thetaforge_watchlist_v1'

export interface WatchlistItem {
  ticker: string
  addedAt: string          // ISO timestamp
  snapshot: any            // full row object at time of adding
}

interface WatchlistCtx {
  items: WatchlistItem[]
  isInWatchlist: (ticker: string) => boolean
  addToWatchlist: (row: any) => void
  removeFromWatchlist: (ticker: string) => void
  clearWatchlist: () => void
}

const WatchlistContext = React.createContext<WatchlistCtx>({
  items: [],
  isInWatchlist: () => false,
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  clearWatchlist: () => {},
})

function loadFromStorage(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(items: WatchlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<WatchlistItem[]>(loadFromStorage)

  const persist = (next: WatchlistItem[]) => {
    setItems(next)
    saveToStorage(next)
  }

  const isInWatchlist = (ticker: string) =>
    items.some(i => i.ticker === ticker)

  const addToWatchlist = (row: any) => {
    if (isInWatchlist(row.ticker)) return
    const entry: WatchlistItem = {
      ticker: row.ticker,
      addedAt: new Date().toISOString(),
      snapshot: { ...row },
    }
    persist([entry, ...items])
  }

  const removeFromWatchlist = (ticker: string) =>
    persist(items.filter(i => i.ticker !== ticker))

  const clearWatchlist = () => persist([])

  return (
    <WatchlistContext.Provider value={{ items, isInWatchlist, addToWatchlist, removeFromWatchlist, clearWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  return React.useContext(WatchlistContext)
}
