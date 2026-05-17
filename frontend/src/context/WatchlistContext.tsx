import React from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { getFirebaseApp } from '../firebase/firebaseApp'
import { isFirebaseConfigured } from '../firebase/firebaseConfig'

const STORAGE_KEY = 'thetaforge_watchlist_v1'

export interface WatchlistItem {
  ticker: string
  addedAt: string          // ISO timestamp
  snapshot: any            // full row object at time of adding
  notes?: string
  updatedAt?: string
}

interface WatchlistCtx {
  items: WatchlistItem[]
  loading: boolean
  error: string | null
  storageMode: 'firebase' | 'local'
  isInWatchlist: (ticker: string) => boolean
  addToWatchlist: (row: any) => Promise<void>
  removeFromWatchlist: (ticker: string) => Promise<void>
  updateNotes: (ticker: string, notes: string) => Promise<void>
  clearWatchlist: () => Promise<void>
}

const WatchlistContext = React.createContext<WatchlistCtx>({
  items: [],
  loading: false,
  error: null,
  storageMode: 'local',
  isInWatchlist: () => false,
  addToWatchlist: async () => {},
  removeFromWatchlist: async () => {},
  updateNotes: async () => {},
  clearWatchlist: async () => {},
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

function docIdForTicker(ticker: string) {
  return ticker.toUpperCase().replace(/\//g, '-')
}

function normalizeFirestoreItem(id: string, data: any): WatchlistItem {
  const addedAt = data.addedAt?.toDate?.()?.toISOString?.() || data.addedAt || new Date().toISOString()
  const updatedAt = data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || addedAt
  return {
    ticker: data.ticker || id,
    addedAt,
    updatedAt,
    notes: data.notes || '',
    snapshot: data.snapshot || { ticker: data.ticker || id },
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = React.useState<WatchlistItem[]>(loadFromStorage)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const db = React.useMemo(() => {
    const app = getFirebaseApp()
    return app ? getFirestore(app) : null
  }, [])

  const useFirebase = Boolean(isFirebaseConfigured && db && user?.uid)

  React.useEffect(() => {
    if (!useFirebase || !db || !user?.uid) {
      setItems(loadFromStorage())
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)
    const watchlistRef = collection(db, 'users', user.uid, 'watchlist')
    const q = query(watchlistRef, orderBy('addedAt', 'desc'))
    return onSnapshot(
      q,
      (snap) => {
        const next: WatchlistItem[] = []
        snap.forEach((entry) => next.push(normalizeFirestoreItem(entry.id, entry.data())))
        setItems(next)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'Failed to load watchlist.')
        setLoading(false)
      },
    )
  }, [db, useFirebase, user?.uid])

  const persist = (next: WatchlistItem[]) => {
    setItems(next)
    saveToStorage(next)
  }

  const isInWatchlist = (ticker: string) =>
    items.some(i => i.ticker.toUpperCase() === ticker.toUpperCase())

  const addToWatchlist = async (row: any) => {
    if (isInWatchlist(row.ticker)) return
    const now = new Date().toISOString()
    const entry: WatchlistItem = {
      ticker: row.ticker,
      addedAt: now,
      updatedAt: now,
      notes: '',
      snapshot: { ...row },
    }
    if (useFirebase && db && user?.uid) {
      await setDoc(doc(db, 'users', user.uid, 'watchlist', docIdForTicker(row.ticker)), {
        ...entry,
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return
    }
    persist([entry, ...items])
  }

  const removeFromWatchlist = async (ticker: string) => {
    if (useFirebase && db && user?.uid) {
      await deleteDoc(doc(db, 'users', user.uid, 'watchlist', docIdForTicker(ticker)))
      return
    }
    persist(items.filter(i => i.ticker.toUpperCase() !== ticker.toUpperCase()))
  }

  const updateNotes = async (ticker: string, notes: string) => {
    if (useFirebase && db && user?.uid) {
      await updateDoc(doc(db, 'users', user.uid, 'watchlist', docIdForTicker(ticker)), {
        notes,
        updatedAt: serverTimestamp(),
      })
      return
    }
    persist(items.map(item => (
      item.ticker.toUpperCase() === ticker.toUpperCase()
        ? { ...item, notes, updatedAt: new Date().toISOString() }
        : item
    )))
  }

  const clearWatchlist = async () => {
    if (useFirebase && db && user?.uid) {
      await Promise.all(items.map(item => deleteDoc(doc(db, 'users', user.uid, 'watchlist', docIdForTicker(item.ticker)))))
      return
    }
    persist([])
  }

  return (
    <WatchlistContext.Provider
      value={{
        items,
        loading,
        error,
        storageMode: useFirebase ? 'firebase' : 'local',
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        updateNotes,
        clearWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  return React.useContext(WatchlistContext)
}
