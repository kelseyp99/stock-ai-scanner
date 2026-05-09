import React, {useState} from 'react'
import OptionChainViewer from '../components/OptionChainViewer'
import IvHvChart from '../components/IvHvChart'

export default function OptionsLab(){
  const [ticker, setTicker] = useState('AAPL')
  const [chain, setChain] = useState<any>(null)
  const [strategies, setStrategies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState<any>(null)

  async function fetchChain(){
    setLoading(true)
    try{
      const res = await fetch(`/options/${ticker}`)
      if(!res.ok) throw new Error('failed')
      const data = await res.json()
      setChain(data)
    }catch(e){
      setChain(null)
      console.error(e)
    }finally{setLoading(false)}
  }

  async function loadStrategies(){
    setLoading(true)
    try{
      const res = await fetch(`/options/${ticker}/strategies`)
      if(!res.ok) throw new Error('failed')
      const j = await res.json()
      setStrategies(j.strategies || [])
    }catch(e){
      setStrategies([])
    }finally{setLoading(false)}
  }

  async function analyze(){
    setLoading(true)
    try{
      const res = await fetch('/options/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ticker})})
      if(!res.ok) throw new Error('failed')
      const j = await res.json()
      setStrategies(j.strategies || [])
      setAiSummary(j.ai_summary)
    }catch(e){
      console.error(e)
    }finally{setLoading(false)}
  }

  const expectedMove = chain && chain.current_price && chain.iv_atm ? (chain.current_price * (chain.iv_atm || 0) * Math.sqrt(30/365)) : null

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Options Lab</h2>
      <div className="mb-4">
        <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} className="border px-2 py-1 mr-2" />
        <button className="bg-blue-600 text-white px-3 py-1 mr-2" onClick={fetchChain}>Load Chain</button>
        <button className="bg-green-600 text-white px-3 py-1 mr-2" onClick={loadStrategies}>Load Strategies</button>
        <button className="bg-indigo-600 text-white px-3 py-1" onClick={analyze}>Analyze (AI)</button>
      </div>
      <OptionChainViewer chain={chain} />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <IvHvChart price={chain?.current_price} iv={chain?.iv_atm} hv30={chain?.historical_volatility?.hv30} hv90={chain?.historical_volatility?.hv90} expectedMove={expectedMove} />
        <div className="p-2 bg-white rounded border">
          <div className="text-sm font-medium mb-1">Expected Move</div>
          <div className="text-lg font-semibold">{expectedMove ? ((Math.round(expectedMove*100)/100)+'') : '—'}</div>
          <div className="text-xs text-gray-500">(approx, 30d, based on ATM IV)</div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">Suggested strategies</h3>
        {strategies.length ? strategies.map((s:any, idx:number)=> (
          <div key={idx} className="p-3 border rounded mb-2">
            <div className="font-semibold">{s.strategy} — {s.direction || 'neutral'}</div>
            <div className="text-sm text-gray-700">{s.description}</div>
            <div className="text-sm text-gray-600">Score: {Number((s.score||0).toFixed(3))}</div>
          </div>
        )) : <div className="text-sm text-gray-500">No strategies loaded</div>}
      </div>
      <div className="mt-4">
        <h3 className="font-semibold">AI Summary</h3>
        <pre className="text-sm bg-gray-50 p-3 rounded">{aiSummary?.summary || '—'}</pre>
      </div>
      <div className="mt-4 text-xs text-gray-500">This tool is for educational and research purposes only and does not provide financial advice.</div>
    </div>
  )
}
