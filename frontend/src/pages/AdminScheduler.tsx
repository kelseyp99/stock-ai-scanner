import React from 'react'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { firebaseConfig } from '../firebase/firebaseConfig'
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'

if (!getApps().length) initializeApp(firebaseConfig)
const db = getFirestore()

const AVAILABLE_INDEXES = ['SP500','NASDAQ100','RUSSELL2000','CUSTOM1']

export default function AdminScheduler(){
  const [selected, setSelected] = React.useState<string[]>([])
  const [time, setTime] = React.useState('02:00')
  const [tz, setTz] = React.useState('UTC')
  const [schedules, setSchedules] = React.useState<any[]>([])

  React.useEffect(()=>{
    const q = query(collection(db, 'scan_schedules'), orderBy('updatedAt','desc'))
    return onSnapshot(q, snap => {
      const out: any[] = []
      snap.forEach(d => out.push({ id: d.id, ...d.data() }))
      setSchedules(out)
    })
  },[])

  const toggleIndex = (idx: string)=>{
    setSelected(prev => prev.includes(idx) ? prev.filter(x=>x!==idx) : [...prev, idx])
  }

  const save = async ()=>{
    await addDoc(collection(db, 'scan_schedules'), {
      indexes: selected,
      time,
      timezone: tz,
      enabled: true,
      createdBy: 'admin',
      updatedAt: serverTimestamp()
    })
    setSelected([])
  }

  const toggleEnabled = async (id: string, enabled: boolean)=>{
    await updateDoc(doc(db,'scan_schedules',id), { enabled: !enabled, updatedAt: serverTimestamp() })
  }

  const remove = async (id: string)=>{
    await deleteDoc(doc(db,'scan_schedules',id))
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Admin Scheduler</h2>
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="mb-2">Select indexes to scan:</div>
        <div className="flex gap-3 mb-3">
          {AVAILABLE_INDEXES.map(i=> (
            <label key={i} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={selected.includes(i)} onChange={()=>toggleIndex(i)} />
              <span>{i}</span>
            </label>
          ))}
        </div>
        <div className="mb-3">
          <label className="block mb-1">Time (HH:MM):</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Timezone (IANA):</label>
          <input value={tz} onChange={e=>setTz(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save Schedule</button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Existing Schedules</h3>
        <div className="space-y-2">
          {schedules.map(s=> (
            <div key={s.id} className="flex items-center justify-between bg-white p-3 rounded shadow">
              <div>
                <div className="font-semibold">{s.indexes?.join(', ')}</div>
                <div className="text-sm text-gray-500">{s.time} {s.timezone} — {s.enabled ? 'enabled' : 'disabled'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>toggleEnabled(s.id, s.enabled)} className="px-3 py-1 rounded border">{s.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={()=>remove(s.id)} className="px-3 py-1 rounded border text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
