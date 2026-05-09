import React from 'react'

export default function OptionChainViewer({chain}:{chain:any}){
  if(!chain) return <div>No chain data</div>
  const {current_price, expirations, chains} = chain
  return (
    <div className="mb-4">
      <div className="mb-2">Current price: <strong>{current_price ?? '—'}</strong></div>
      <div className="mb-2">Expirations:</div>
      <div className="flex gap-2 flex-wrap">
        {expirations && expirations.length ? expirations.map((e:string)=> (
          <div key={e} className="px-2 py-1 bg-gray-100 rounded text-sm">{e}</div>
        )) : <div className="text-sm text-gray-500">No expirations</div>}
      </div>
      <div className="mt-3">
        {expirations && expirations.slice(0,3).map((e:string)=> (
          <div key={e} className="mb-2">
            <div className="font-semibold">{e}</div>
            <div className="text-sm text-gray-700">Calls: {(chains[e]?.calls?.length||0)}  Puts: {(chains[e]?.puts?.length||0)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
