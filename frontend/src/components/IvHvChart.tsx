import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type Props = {
  price?: number | null
  iv?: number | null
  hv30?: number | null
  hv90?: number | null
  expectedMove?: number | null
}

export default function IvHvChart({price, iv, hv30, hv90, expectedMove}: Props){
  // Convert expectedMove to percent of price for charting
  const expectedPct = (expectedMove && price) ? Math.abs(expectedMove / price) : null

  const labels = ['HV30', 'HV90', 'ATM IV', 'Expected Move']
  const barValues = [hv30 || 0, hv90 || 0, iv || 0, 0]
  const lineValues = [null, null, null, expectedPct !== null ? expectedPct : null]

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Volatility',
        data: barValues.map(v => Number((v || 0).toFixed(4))),
        backgroundColor: ['#60a5fa', '#93c5fd', '#3b82f6', '#a7f3d0'],
        borderRadius: 6,
      },
      {
        type: 'line' as const,
        label: 'Expected Move %',
        data: lineValues.map(v => v === null ? null : Number((v || 0).toFixed(4))),
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.2,
        pointRadius: 5,
        yAxisID: 'y',
      }
    ]
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        ticks: {
          callback: function(val:number){
            try{ return (val*100).toFixed(0) + '%'}catch(e){ return val }
          }
        },
        beginAtZero: true
      }
    }
  }

  return (
    <div className="p-2 bg-white rounded border" style={{height:220}}>
      <div className="text-sm font-medium mb-1">IV vs HV (percent)</div>
      <div style={{height:170}}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
