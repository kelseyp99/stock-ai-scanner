import React, {useState, useEffect} from 'react'
import OptionChainViewer from '../components/OptionChainViewer'
import IvHvChart from '../components/IvHvChart'
import demoOptionsData from '../data/demoOptionsData'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_TICKERS = Object.keys(demoOptionsData)

export default function OptionsLab(){
  const [ticker, setTicker] = useState('AAPL')
  const [chain, setChain] = useState<any>(null)
  const [strategies, setStrategies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [aiSummary, setAiSummary] = useState<any>(null)

  function loadDemoData(t: string) {
    const data = demoOptionsData[t] || demoOptionsData['AAPL']
    setChain(data)
    setStrategies(data.strategies || [])
    setAiSummary(data.ai_summary || null)
    setError(null)
  }

  async function fetchAll(t: string){
    if (DEMO_MODE) { loadDemoData(t); return }
    setLoading(true)
    setError(null)
    try{
      const [chainRes, stratRes] = await Promise.all([
        fetch(`/options/${t}`),
        fetch(`/options/${t}/strategies`)
      ])
      if(!chainRes.ok) throw new Error(`Chain fetch failed: ${chainRes.status}`)
      const chainData = await chainRes.json()
      setChain(chainData)
      if(stratRes.ok){
        const sj = await stratRes.json()
        setStrategies(sj.strategies || [])
      }
    }catch(e:any){
      setError(e?.message || 'Failed to load options data. Is the backend running?')
      setChain(null)
    }finally{
      setLoading(false)
    }
  }

  async function analyze(){
    if (DEMO_MODE) return
    setLoading(true)
    setError(null)
    try{
      const res = await fetch('/options/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ticker})})
      if(!res.ok) throw new Error(`${res.status}`)
      const j = await res.json()
      setStrategies(j.strategies || [])
      setAiSummary(j.ai_summary)
    }catch(e:any){
      setError(e?.message || 'AI analyze failed')
    }finally{setLoading(false)}
  }

  useEffect(() => {
    if (!ticker || ticker.length < 1) return
    if (DEMO_MODE) {
      loadDemoData(ticker)
      return
    }
    const id = window.setTimeout(() => fetchAll(ticker), 600)
    return () => window.clearTimeout(id)
  }, [ticker])

  const expectedMove = chain && chain.current_price && chain.iv_atm
    ? (chain.current_price * (chain.iv_atm || 0) * Math.sqrt(30/365))
    : null

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Options Lab</h2>
      {DEMO_MODE && (
        <div className="mb-3 text-xs text-gray-500 italic bg-gray-50 border rounded px-3 py-1">
          Demo mode — showing static data for {DEMO_TICKERS.join(', ')}
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        {DEMO_MODE ? (
          DEMO_TICKERS.map(t => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              className={`px-3 py-1 rounded border text-sm ${ticker === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
            >{t}</button>
          ))
        ) : (
          <>
            <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} className="border px-2 py-1 mr-2" placeholder="Ticker" />
            <button className="bg-blue-600 text-white px-3 py-1 mr-2" onClick={()=>fetchAll(ticker)}>Load Chain</button>
            <button className="bg-indigo-600 text-white px-3 py-1" onClick={analyze}>Analyze (AI)</button>
          </>
        )}
      </div>
      {loading && <div className="text-blue-600 font-medium mb-2">⏳ Loading options data…</div>}
      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2">⚠️ {error}</div>}
      <OptionChainViewer chain={chain} />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <IvHvChart price={chain?.current_price} iv={chain?.iv_atm} hv30={chain?.historical_volatility?.hv30} hv90={chain?.historical_volatility?.hv90} expectedMove={expectedMove} />
        <div className="p-2 bg-white rounded border">
          <div className="text-sm font-medium mb-1">Expected Move (30d)</div>
          <div className="text-lg font-semibold">{expectedMove ? `$${(Math.round(expectedMove*100)/100).toFixed(2)}` : '—'}</div>
          <div className="text-xs text-gray-500">(approx, based on ATM IV)</div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Suggested Strategies</h3>
        {strategies.length ? strategies.map((s:any, idx:number)=> (
          <div key={idx} className="p-3 border rounded mb-2 bg-white">
            <div className="font-semibold">{s.strategy} <span className="text-gray-500 font-normal text-sm">— {s.direction || 'neutral'}</span></div>
            <div className="text-sm text-gray-700 mt-1">{s.description}</div>
            <div className="text-xs text-gray-400 mt-1">Score: {Number((s.score||0).toFixed(3))}</div>
          </div>
        )) : <div className="text-sm text-gray-500">No strategies loaded</div>}
      </div>
      <div className="mt-4">
        <h3 className="font-semibold mb-1">AI Summary</h3>
        <div className="text-sm bg-blue-50 border border-blue-100 rounded p-3 text-blue-900">{aiSummary?.summary || '—'}</div>
      </div>
      <div className="mt-4 text-xs text-gray-400">For educational and research purposes only. Not financial advice.</div>
    </div>
  )
}
