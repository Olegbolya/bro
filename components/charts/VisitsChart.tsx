'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface DayData { day: string; cnt: number }

export default function VisitsChart() {
  const [data, setData] = useState<DayData[]>([])

  useEffect(() => {
    fetch('/api/analytics/public')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.byDay)) setData(d.byDay) })
      .catch(() => {})
  }, [])

  if (data.length === 0) return null

  const chartData = {
    labels: data.map(d =>
      new Date(d.day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    ),
    datasets: [{
      data: data.map(d => d.cnt),
      fill: true,
      borderColor: '#00c2ff',
      backgroundColor: 'rgba(0, 194, 255, 0.08)',
      pointBackgroundColor: '#00c2ff',
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.4,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0e1017',
        borderColor: '#1c2035',
        borderWidth: 1,
        titleColor: '#6b7a90',
        bodyColor: '#d8e4f0',
        callbacks: {
          label: (ctx: { raw: unknown }) => ` ${ctx.raw} просмотров`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(28,32,53,0.8)' },
        ticks: { color: '#6b7a90', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(28,32,53,0.8)' },
        ticks: { color: '#6b7a90', font: { size: 11 } },
        beginAtZero: true,
      },
    },
  }

  return (
    <div style={{ height: '180px' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
