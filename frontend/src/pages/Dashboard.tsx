import React from 'react'
import api from '../services/api'
import StockTable from '../components/StockTable'

export default function Dashboard(){
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = async ()=>{
    setLoading(true)
    setError(null)
    try{
      const res = await api.get('/scan')
      setData(res.data)
    }catch(e:any){
      setError(e.message)
    }finally{setLoading(false)}
  }

  React.useEffect(()=>{refresh()},[])

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Dashboard</h2>
        <div>
          <button onClick={refresh} className="mr-2">Refresh</button>
          {loading && <span>Loading...</span>}
        </div>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <StockTable data={data} />
    </div>
  )
}
