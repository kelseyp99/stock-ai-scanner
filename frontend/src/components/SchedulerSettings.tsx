import React, { useEffect, useState } from 'react'

// Universes the user can tick — IDs must match backend UNIVERSES list
const UNIVERSE_OPTIONS = [
  { id: 'sp500',     label: 'S&P 500'      },
  { id: 'nasdaq100', label: 'Nasdaq 100'   },
  { id: 'russell2000', label: 'Russell 2000' },
  { id: 'custom',    label: 'Custom Watchlist (CUSTOM1)' },
]

export default function SchedulerSettings(){
  const [enabled, setEnabled] = useState(true)
  const [scanTime, setScanTime] = useState('02:00')
  const [timezone, setTimezone] = useState('America/New_York')
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>(['sp500'])
  const [weekdaysOnly, setWeekdaysOnly] = useState(true)
  const [maxTickers, setMaxTickers] = useState<number | ''>(500)
  const [fetchNews, setFetchNews] = useState(false)
  const [generateAi, setGenerateAi] = useState(false)
  const [aiModels, setAiModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [nextRun, setNextRun] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<any>(null)
  const [settingId, setSettingId] = useState<number | null>(null)

  useEffect(()=>{
    fetch('/scheduler/ai/models').then(r=>r.json()).then(setAiModels).catch(()=>{})
    loadSettings()
  },[])

  async function loadSettings(){
    try {
      const res = await fetch('/scheduler/settings?user_id=local-user')
      if(!res.ok) return
      const arr = await res.json()
      if(arr && arr.length){
        const s = arr[0]
        setSettingId(s.id)
        setEnabled(!!s.enabled)
        setScanTime(s.scan_time || '02:00')
        setTimezone(s.timezone || 'America/New_York')
        // Prefer universe_ids list; fall back to single universe_id
        const ids: string[] = s.universe_ids?.length ? s.universe_ids : (s.universe_id ? [s.universe_id] : ['sp500'])
        setSelectedUniverses(ids)
        setWeekdaysOnly(s.weekdays_only !== false && s.weekdays_only !== 0)
        setMaxTickers(s.max_tickers || 500)
        setFetchNews(!!s.fetch_news)
        setGenerateAi(!!s.generate_ai_summary)
        setSelectedModel(s.ai_model_id || null)
        setNextRun(s.next_run)
        setLastRun(s.last_run)
      }
    } catch(e) { /* backend offline */ }
  }

  const toggleUniverse = (id: string) => {
    setSelectedUniverses(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const totalLabel = () => {
    const approx: Record<string,number> = { sp500: 500, nasdaq100: 100, russell2000: 2000, custom: 50 }
    const total = selectedUniverses.reduce((sum, id) => sum + (approx[id] ?? 0), 0)
    return total ? `~${total.toLocaleString()} tickers` : 'none selected'
  }

  const save = async ()=>{
    if (selectedUniverses.length === 0) { setStatusMsg('Select at least one universe'); return }
    const body = {
      id: settingId,
      user_id: 'local-user',
      enabled,
      scan_time: scanTime,
      timezone,
      universe_ids: selectedUniverses,
      universe_id: selectedUniverses[0] || null,  // keep legacy field for compat
      weekdays_only: weekdaysOnly,
      max_tickers: maxTickers || null,
      fetch_news: fetchNews,
      generate_ai_summary: generateAi,
      ai_provider: 'openrouter',
      ai_model_id: selectedModel,
    }
    const res = await fetch('/scheduler/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
    if(res.ok){
      setStatusMsg('✅ Saved')
      await loadSettings()
    }else{
      setStatusMsg('❌ Error saving')
    }
  }

  const runNow = async ()=>{
    setStatusMsg('Starting...')
    if(!settingId){ setStatusMsg('Save settings first'); return }
    const res = await fetch('/scheduler/run-now', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({setting_id: settingId})})
    if(res.ok){
      const data = await res.json()
      setStatusMsg('🚀 Scan started')
      pollRunStatus(data.scheduled_scan_run_id)
    }else{
      const text = await res.text()
      setStatusMsg('❌ Error: '+text)
    }
  }

  async function pollRunStatus(runId: number){
    setStatusMsg('⏳ Running...')
    const start = Date.now()
    while(Date.now() - start < 1000 * 60 * 30){
      const r = await fetch(`/scheduler/runs/${runId}`)
      if(!r.ok) break
      const json = await r.json()
      setLastRun({
        id: json.id,
        status: json.status,
        started_at: json.started_at,
        completed_at: json.completed_at,
        tickers_scanned: json.tickers_scanned,
      })
      if(json.status === 'completed' || json.status === 'failed' || json.status === 'skipped'){
        setStatusMsg(json.status === 'completed' ? `✅ Completed — ${json.tickers_scanned ?? 0} tickers scanned` : json.status === 'skipped' ? '⏭ Skipped (weekend)' : '❌ Failed')
        await loadSettings()
        return
      }
      await new Promise(r=>setTimeout(r, 3000))
    }
    setStatusMsg('⏱ Timed out waiting for run')
  }

  return (
    <div className="p-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-5">Scheduler Settings</h2>

      {/* Enable */}
      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} className="w-4 h-4" />
        <span className="font-medium">Enable scheduled scan</span>
      </label>

      {/* Scan time + timezone */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Scan time</label>
          <input type="time" value={scanTime} onChange={e=>setScanTime(e.target.value)} className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Timezone</label>
          <select value={timezone} onChange={e=>setTimezone(e.target.value)} className="border rounded px-2 py-1 w-full">
            <option value="America/New_York">America/New_York (ET)</option>
            <option value="America/Chicago">America/Chicago (CT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>

      {/* Weekdays only */}
      <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={weekdaysOnly} onChange={e=>setWeekdaysOnly(e.target.checked)} className="w-4 h-4" />
          <span className="font-medium">Run weekdays only (Mon – Fri, when US market is open)</span>
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          When checked the scheduler skips Saturday and Sunday automatically.
          US markets are open Mon–Fri 9:30 AM – 4:00 PM ET (excluding holidays).
        </p>
      </div>

      {/* Universe multi-select */}
      <div className="mb-5">
        <div className="text-sm font-medium mb-2">Universes to scan <span className="text-gray-400 font-normal">({totalLabel()})</span></div>
        <div className="grid grid-cols-2 gap-2">
          {UNIVERSE_OPTIONS.map(u => (
            <label key={u.id} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${selectedUniverses.includes(u.id) ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
              <input
                type="checkbox"
                checked={selectedUniverses.includes(u.id)}
                onChange={() => toggleUniverse(u.id)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{u.label}</span>
            </label>
          ))}
        </div>
        {selectedUniverses.length === 0 && (
          <p className="text-xs text-red-500 mt-1">Select at least one universe.</p>
        )}
      </div>

      {/* Max tickers */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Max tickers per run <span className="text-gray-400 font-normal">(leave blank for all)</span></label>
        <input
          type="number"
          value={maxTickers === '' ? '' : maxTickers}
          onChange={e=>setMaxTickers(e.target.value ? parseInt(e.target.value) : '')}
          placeholder="e.g. 500"
          className="border rounded px-2 py-1 w-40"
        />
      </div>

      {/* News + AI */}
      <div className="flex gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={fetchNews} onChange={e=>setFetchNews(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm">Fetch news for top 10</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={generateAi} onChange={e=>setGenerateAi(e.target.checked)} className="w-4 h-4" />
          <span className="text-sm">Generate AI market summary</span>
        </label>
      </div>

      {generateAi && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">AI model</label>
          <select value={selectedModel ?? ''} onChange={e=>setSelectedModel(e.target.value)} className="border rounded px-2 py-1">
            <option value="">Default</option>
            {aiModels.map(m=> <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Settings</button>
        <button onClick={runNow} disabled={!settingId} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">Run Scan Now</button>
      </div>

      {statusMsg && <div className="mb-3 text-sm font-medium">{statusMsg}</div>}

      {/* Status */}
      <div className="text-sm text-gray-600 space-y-1">
        <div>Next scheduled run: <strong>{nextRun ? new Date(nextRun).toLocaleString() : '—'}</strong></div>
        <div>Last run: <strong>{lastRun ? `${lastRun.status} — ${lastRun.tickers_scanned ?? 0} tickers — ${lastRun.completed_at ? new Date(lastRun.completed_at).toLocaleString() : ''}` : '—'}</strong></div>
      </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
        ⚠️ Scheduled scans only run while the backend server is running.
      </div>
    </div>
  )
}
