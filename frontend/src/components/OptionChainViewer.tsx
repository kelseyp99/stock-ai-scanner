import React, {useState} from 'react'

function fmt(v: any, decimals = 2) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  return n.toFixed(decimals)
}

function ChainTable({rows, currentPrice}: {rows: any[], currentPrice: number|null}) {
  if (!rows || rows.length === 0) return <div className="text-sm text-gray-500 p-2">No data</div>
  return (
    <div style={{overflowX:'auto'}}>
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="px-2 py-1 border">Strike</th>
            <th className="px-2 py-1 border">Last</th>
            <th className="px-2 py-1 border">Bid</th>
            <th className="px-2 py-1 border">Ask</th>
            <th className="px-2 py-1 border">IV %</th>
            <th className="px-2 py-1 border">OI</th>
            <th className="px-2 py-1 border">Vol</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => {
            const strike = Number(r.strike)
            const isAtm = currentPrice !== null && Math.abs(strike - currentPrice) / currentPrice < 0.03
            const iv = r.impliedVolatility != null ? Number(r.impliedVolatility) : null
            const ivDisplay = iv != null ? (iv > 3 ? iv.toFixed(1) : (iv * 100).toFixed(1)) : '—'
            return (
              <tr key={i} className={isAtm ? 'bg-yellow-50 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 border">{fmt(r.strike)}</td>
                <td className="px-2 py-1 border">{fmt(r.lastPrice)}</td>
                <td className="px-2 py-1 border">{fmt(r.bid)}</td>
                <td className="px-2 py-1 border">{fmt(r.ask)}</td>
                <td className="px-2 py-1 border">{ivDisplay !== '—' ? ivDisplay + '%' : '—'}</td>
                <td className="px-2 py-1 border">{r.openInterest ?? '—'}</td>
                <td className="px-2 py-1 border">{r.volume ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function OptionChainViewer({chain}:{chain:any}){
  const [selectedExp, setSelectedExp] = useState<string|null>(null)
  const [side, setSide] = useState<'calls'|'puts'>('calls')

  if(!chain) return <div className="text-sm text-gray-500 p-2">No chain data — enter a ticker and click Load Chain.</div>

  const {current_price, expirations, chains} = chain
  const activeExp = selectedExp || (expirations && expirations[0]) || null

  return (
    <div className="mb-4">
      <div className="mb-2 text-sm">
        Current price: <strong>${fmt(current_price)}</strong>
        <span className="ml-4 text-gray-400 text-xs">(ATM rows highlighted)</span>
      </div>

      {/* Expiration selector */}
      <div className="flex gap-2 flex-wrap mb-3">
        {expirations && expirations.length ? expirations.map((e:string) => (
          <button
            key={e}
            onClick={() => setSelectedExp(e)}
            className={`px-2 py-1 rounded text-xs border ${activeExp === e ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 border-gray-300'}`}
          >{e}</button>
        )) : <div className="text-sm text-gray-500">No expirations available</div>}
      </div>

      {/* Calls / Puts toggle */}
      {activeExp && (
        <>
          <div className="flex gap-2 mb-2">
            <button onClick={()=>setSide('calls')} className={`px-3 py-1 text-xs rounded border ${side==='calls' ? 'bg-green-600 text-white' : 'bg-white'}`}>Calls ({chains[activeExp]?.calls?.length ?? 0})</button>
            <button onClick={()=>setSide('puts')} className={`px-3 py-1 text-xs rounded border ${side==='puts' ? 'bg-red-600 text-white' : 'bg-white'}`}>Puts ({chains[activeExp]?.puts?.length ?? 0})</button>
          </div>
          <ChainTable rows={chains[activeExp]?.[side] ?? []} currentPrice={current_price} />
        </>
      )}
    </div>
  )
}
