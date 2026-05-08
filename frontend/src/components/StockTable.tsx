import React from 'react'

export default function StockTable({data}:{data:any[]}){
  const [sortKey, setSortKey] = React.useState<string>('score')
  const sorted = React.useMemo(()=>{
    return [...data].sort((a:any,b:any)=> (b[sortKey] ?? 0) - (a[sortKey] ?? 0))
  },[data,sortKey])

  return (
    <table className="min-w-full border">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Price</th>
          <th>RSI</th>
          <th>MA20</th>
          <th>MA50</th>
          <th>Vol Ratio</th>
          <th>Volatility</th>
          <th>Div Yield</th>
          <th onClick={()=>setSortKey('score')}>Score</th>
          <th>Reasons</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row:any)=> (
          <tr key={row.ticker} className="border-t">
            <td>{row.ticker}</td>
            <td>{row.price}</td>
            <td>{row.rsi?.toFixed?.(2)}</td>
            <td>{row.ma20?.toFixed?.(2)}</td>
            <td>{row.ma50?.toFixed?.(2)}</td>
            <td>{row.volume_ratio?.toFixed?.(2)}</td>
            <td>{row.volatility_20?.toFixed?.(4)}</td>
            <td>{row.dividend_yield?.toFixed?.(2)}</td>
            <td>{row.score}</td>
            <td>{row.reasons}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
