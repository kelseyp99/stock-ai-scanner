import React, { useEffect, useState } from 'react'

export default function SchedulerSettings(){
  const [enabled, setEnabled] = useState(true)
  const [scanTime, setScanTime] = useState('02:00')
  const [timezone, setTimezone] = useState('America/New_York')
  const [universe, setUniverse] = useState('sp500')
  const [maxTickers, setMaxTickers] = useState<number | ''>(100)
  const [fetchNews, setFetchNews] = useState(false)
  const [generateAi, setGenerateAi] = useState(false)
  const [aiModels, setAiModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [universes, setUniverses] = useState<any[]>([])
  const [statusMsg, setStatusMsg] = useState('')
  const [nextRun, setNextRun] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<any>(null)
  const [settingId, setSettingId] = useState<number | null>(null)

  useEffect(()=>{
    fetch('/scheduler/universes').then(r=>r.json()).then(setUniverses)
    fetch('/scheduler/ai/models').then(r=>r.json()).then(setAiModels)
    loadSettings()
  },[])

  async function loadSettings(){
    const res = await fetch('/scheduler/settings?user_id=local-user')
    if(!res.ok) return
    const arr = await res.json()
    if(arr && arr.length){
      const s = arr[0]
      setSettingId(s.id)
      setEnabled(!!s.enabled)
      setScanTime(s.scan_time || '02:00')
      setTimezone(s.timezone || 'America/New_York')
      setUniverse(s.universe_id || 'sp500')
      setMaxTickers(s.max_tickers || 100)
      setFetchNews(!!s.fetch_news)
      setGenerateAi(!!s.generate_ai_summary)
      setSelectedModel(s.ai_model_id || null)
      setNextRun(s.next_run)
      setLastRun(s.last_run)
    }
  }

  const save = async ()=>{
    const body = {
      id: settingId,
      user_id: 'local-user',
      enabled,
      scan_time: scanTime,
      timezone,
      universe_id: universe,
      max_tickers: maxTickers || null,
      fetch_news: fetchNews,
      generate_ai_summary: generateAi,
      ai_provider: 'openrouter',
      ai_model_id: selectedModel,
    }
    const res = await fetch('/scheduler/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)})
    if(res.ok){
      setStatusMsg('Saved')
      await loadSettings()
    }else{
      setStatusMsg('Error saving')
    }
  }

  const runNow = async ()=>{
    setStatusMsg('Starting...')
    if(!settingId){ setStatusMsg('No setting saved yet'); return }
    const res = await fetch('/scheduler/run-now', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({setting_id: settingId})})
    if(res.ok){
      const data = await res.json()
      setStatusMsg('Scan started')
      const runId = data.scheduled_scan_run_id
      // poll run status
      pollRunStatus(runId)
    }else{
      const text = await res.text()
      setStatusMsg('Error: '+text)
    }
  }

  async function pollRunStatus(runId: number){
    setStatusMsg('Polling run...')
    const start = Date.now()
    while(Date.now() - start < 1000 * 60 * 10){ // 10 min timeout
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
      if(json.status === 'completed' || json.status === 'failed'){
        setStatusMsg(json.status === 'completed' ? 'Completed' : 'Failed')
        // refresh settings to show last_run
        await loadSettings()
        return
      }
      await new Promise(r=>setTimeout(r, 3000))
    }
    setStatusMsg('Timed out waiting for run')
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Scheduler Settings</h2>
      <div className="mb-3">
        <label className="mr-2">Enable scheduled scan</label>
        <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />
      </div>

      <div className="mb-3">
        <label className="mr-2">Scan time</label>
        <input type="time" value={scanTime} onChange={e=>setScanTime(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="mr-2">Time zone</label>
        <select value={timezone} onChange={e=>setTimezone(e.target.value)}>
          <option>America/New_York</option>
          <option>America/Los_Angeles</option>
          <option>UTC</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="mr-2">Scan universe</label>
        <select value={universe} onChange={e=>setUniverse(e.target.value)}>
          {universes.map(u=> <option key={u.id} value={u.universe_id}>{u.name}</option>)}
        </select>
      </div>

      <div className="mb-3">
        <label className="mr-2">Max tickers per run</label>
        <input type="number" value={maxTickers === '' ? '' : maxTickers} onChange={e=>setMaxTickers(e.target.value ? parseInt(e.target.value) : '')} />
      </div>

      <div className="mb-3">
        <label className="mr-2">Fetch news</label>
        <input type="checkbox" checked={fetchNews} onChange={e=>setFetchNews(e.target.checked)} />
      </div>

      <div className="mb-3">
        <label className="mr-2">Generate AI summary</label>
        <input type="checkbox" checked={generateAi} onChange={e=>setGenerateAi(e.target.checked)} />
      </div>

      <div className="mb-3">
        <label className="mr-2">AI model</label>
        <select value={selectedModel ?? ''} onChange={e=>setSelectedModel(e.target.value)}>
          <option value="">Default</option>
          {aiModels.map(m=> <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <button className="bg-blue-600 text-white px-3 py-1 mr-2" onClick={save}>Save Scheduler Settings</button>
        <button className="bg-green-600 text-white px-3 py-1" onClick={runNow}>Run Scan Now</button>
      </div>

      <div className="text-sm text-gray-600">Next scheduled run: {nextRun || '—'}</div>
      <div className="text-sm text-gray-600">Last run: {lastRun ? `${lastRun.status} at ${lastRun.completed_at || lastRun.started_at} — ${lastRun.tickers_scanned || 0} tickers` : '—'}</div>

      <div className="mt-4 p-3 bg-yellow-50 border rounded">⚠️ Scheduled scans only run while the backend server is running. If this is on your MacBook, make sure the Mac is awake overnight.</div>
      <div className="mt-2 text-xs text-gray-500">Scheduler active: TBD</div>
    </div>
  )
}
