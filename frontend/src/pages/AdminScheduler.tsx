import React from 'react'
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { getFirebaseApp } from '../firebase/firebaseApp'
import { isFirebaseConfigured } from '../firebase/firebaseConfig'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from '../auth/admins'

const AVAILABLE_INDEXES = ['SP500','NASDAQ100','RUSSELL2000','CUSTOM1']

// Map frontend labels to backend universe IDs
const INDEX_TO_UNIVERSE: Record<string,string> = {
  SP500: 'sp500', NASDAQ100: 'nasdaq100', RUSSELL2000: 'russell2000', CUSTOM1: 'custom'
}

const APPROX_COUNTS: Record<string,number> = { SP500: 500, NASDAQ100: 100, RUSSELL2000: 2000, CUSTOM1: 50 }

export default function AdminScheduler(){
  const { user } = useAuth()
  const db = React.useMemo(() => {
    const app = getFirebaseApp()
    return app ? getFirestore(app) : null
  }, [])
  const [selected, setSelected] = React.useState<string[]>([])
  const [time, setTime] = React.useState('02:00')
  const [tz, setTz] = React.useState('America/New_York')
  const [weekdaysOnly, setWeekdaysOnly] = React.useState(true)
  const [schedules, setSchedules] = React.useState<any[]>([])
  const isAdmin = isAdminEmail(user?.email)

  React.useEffect(()=>{
    if (!db || !isAdmin) return undefined
    const q = query(collection(db, 'scan_schedules'), orderBy('updatedAt','desc'))
    return onSnapshot(q, snap => {
      const out: any[] = []
      snap.forEach(d => out.push({ id: d.id, ...d.data() }))
      setSchedules(out)
    })
  },[db, isAdmin])

  const toggleIndex = (idx: string)=>{
    setSelected(prev => prev.includes(idx) ? prev.filter(x=>x!==idx) : [...prev, idx])
  }

  const save = async ()=>{
    if (!db || !isAdmin || selected.length === 0) return
    const universeIds = selected.map(idx => INDEX_TO_UNIVERSE[idx])
    const approxTotal = selected.reduce((sum, idx) => sum + (APPROX_COUNTS[idx] ?? 0), 0)
    await addDoc(collection(db, 'scan_schedules'), {
      indexes: selected,
      universe_ids: universeIds,
      approx_tickers: approxTotal,
      time,
      timezone: tz,
      weekdays_only: weekdaysOnly,
      enabled: true,
      createdBy: user?.email || 'admin',
      updatedAt: serverTimestamp()
    })
    setSelected([])
    setWeekdaysOnly(true)
  }

  const toggleEnabled = async (id: string, enabled: boolean)=>{
    if (!db || !isAdmin) return
    await updateDoc(doc(db,'scan_schedules',id), { enabled: !enabled, updatedAt: serverTimestamp() })
  }

  const remove = async (id: string)=>{
    if (!db || !isAdmin) return
    await deleteDoc(doc(db,'scan_schedules',id))
  }

  if (!isFirebaseConfigured || !db) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Scheduler</h2>
        <div className="bg-white p-4 rounded shadow text-sm text-gray-600">
          Firebase is not configured yet. Add the `VITE_FIREBASE_*` values to the frontend environment and enable Google sign-in in Firebase.
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Admin Scheduler</h2>
        <div className="bg-white p-4 rounded shadow text-sm text-gray-600">
          Sign in with an admin account to manage scan schedules.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Admin Scheduler</h2>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="mb-2 font-medium">Select universes to scan:</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {AVAILABLE_INDEXES.map(i => (
            <label key={i} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${selected.includes(i) ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-200'}`}>
              <input type="checkbox" checked={selected.includes(i)} onChange={()=>toggleIndex(i)} />
              <span>{i}</span>
              <span className="ml-auto text-xs text-gray-400">~{APPROX_COUNTS[i].toLocaleString()}</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="text-xs text-blue-700 mb-3">
            Total: ~{selected.reduce((s,i)=>s+(APPROX_COUNTS[i]??0),0).toLocaleString()} tickers
          </div>
        )}

        {/* Weekdays only */}
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={weekdaysOnly} onChange={e=>setWeekdaysOnly(e.target.checked)} />
            <span className="font-medium text-sm">Run weekdays only (Mon – Fri, when US market is open)</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-5">Skips Saturday and Sunday automatically.</p>
        </div>

        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">Time (HH:MM):</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div className="mb-3">
          <label className="block mb-1 text-sm font-medium">Timezone:</label>
          <select value={tz} onChange={e=>setTz(e.target.value)} className="border px-2 py-1 rounded">
            <option value="America/New_York">America/New_York (ET)</option>
            <option value="America/Chicago">America/Chicago (CT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <button onClick={save} disabled={selected.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            Save Schedule
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Existing Schedules</h3>
        <div className="space-y-2">
          {schedules.map(s=> (
            <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded shadow">
              <div>
                <div className="font-semibold">{s.indexes?.join(', ')}</div>
                <div className="text-sm text-gray-500">
                  {s.time} {s.timezone}
                  {s.weekdays_only ? ' · Mon–Fri only' : ' · every day'}
                  {s.approx_tickers ? ` · ~${s.approx_tickers.toLocaleString()} tickers` : ''}
                  {' — '}{s.enabled ? '✅ enabled' : '⏸ disabled'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>toggleEnabled(s.id, s.enabled)} className="px-3 py-1 rounded border text-sm">
                  {s.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={()=>remove(s.id)} className="px-3 py-1 rounded border text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
          {schedules.length === 0 && <div className="text-sm text-gray-400">No schedules yet.</div>}
        </div>
      </div>
    </div>
  )
}
