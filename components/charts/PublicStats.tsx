'use client'

import { useEffect, useState } from 'react'

interface PublicData {
  countries: { country: string; cnt: number }[]
  avgDuration: number | null
}

function fmtDur(s: number | null): string {
  if (!s) return '—'
  if (s < 60) return `${s} сек`
  return `${Math.floor(s / 60)} мин ${s % 60} сек`
}

export default function PublicStats() {
  const [data, setData] = useState<PublicData | null>(null)

  useEffect(() => {
    fetch('/api/analytics/public')
      .then(r => r.json())
      .then(d => {
        if (d && Array.isArray(d.countries)) {
          setData({ countries: d.countries, avgDuration: d.avgDuration })
        }
      })
      .catch(() => {})
  }, [])

  if (!data || (data.countries.length === 0 && !data.avgDuration)) return null

  const maxCnt = data.countries.reduce((m, c) => Math.max(m, c.cnt), 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
      {/* Avg time */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', padding: '20px 24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          Среднее время на сайте
        </p>
        <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', letterSpacing: '-1px' }}>
          {fmtDur(data.avgDuration)}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>за последние 30 дней</p>
      </div>

      {/* Top countries */}
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', padding: '20px 24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
          География посетителей
        </p>
        {data.countries.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Нет данных</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.countries.map(c => (
              <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.country}
                </span>
                <div style={{ flex: 1, height: '5px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((c.cnt / maxCnt) * 100)}%`, height: '100%', background: '#c084fc', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#c084fc', fontFamily: 'monospace', minWidth: '24px', textAlign: 'right' }}>{c.cnt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
