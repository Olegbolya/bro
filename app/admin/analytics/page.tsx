'use client'

import { useEffect, useState } from 'react'
import styles from '../admin.module.css'

interface Stats {
  total: number
  uniqueVisitors: number
  avgDuration: number | null
  bounce: { bounced: number; total_sessions: number }
  byPage: { page: string; _count: { id: number } }[]
  byDay: { day: string; cnt: number }[]
  byReferer: { source: string; cnt: number }[]
  byCountry: { country: string; cnt: number }[]
  byHour: { hour: number; cnt: number }[]
}

function fmtDuration(s: number | null): string {
  if (!s) return '—'
  if (s < 60) return `${s} сек`
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color, minWidth: '32px', textAlign: 'right', fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => { if (d && typeof d.total === 'number') setStats(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  const bounceRate = stats
    ? stats.bounce.total_sessions > 0
      ? Math.round((stats.bounce.bounced / stats.bounce.total_sessions) * 100)
      : 0
    : 0

  const activeDays = stats?.byDay.length ?? 0

  const last20Days = stats ? [...stats.byDay].slice(-20) : []
  const maxDay = last20Days.reduce((m, d) => Math.max(m, d.cnt), 0)

  const allHours = Array.from({ length: 24 }, (_, h) => {
    const found = stats?.byHour.find(x => x.hour === h)
    return { hour: h, cnt: found?.cnt ?? 0 }
  })
  const maxHour = allHours.reduce((m, h) => Math.max(m, h.cnt), 0)

  const maxPage = stats?.byPage[0]?._count.id ?? 1
  const maxRef = stats?.byReferer[0]?.cnt ?? 1
  const maxCountry = stats?.byCountry[0]?.cnt ?? 1

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Аналитика</h1>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '6px 12px', fontSize: '14px' }}
        >
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>
      ) : !stats ? (
        <p style={{ color: 'var(--text-secondary)' }}>Нет данных</p>
      ) : (
        <>
          {/* Stat cards */}
          <div className={styles.statsRow} style={{ marginBottom: '32px' }}>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.total}</div>
              <div className={styles.statLabel}>Просмотры</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.uniqueVisitors}</div>
              <div className={styles.statLabel}>Уникальных</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{fmtDuration(stats.avgDuration)}</div>
              <div className={styles.statLabel}>Сред. время</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{activeDays}</div>
              <div className={styles.statLabel}>Дней активн.</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{bounceRate}%</div>
              <div className={styles.statLabel}>Отказы</div>
            </div>
          </div>

          {/* Daily chart */}
          <div className={styles.tableWrap} style={{ marginBottom: '24px', padding: '20px 24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
              Активность по дням
            </h2>
            {last20Days.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Нет данных</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
                {last20Days.map(d => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${new Date(d.day).toLocaleDateString('ru-RU')}: ${d.cnt}`}>
                    <div style={{ width: '100%', background: 'var(--accent)', borderRadius: '2px 2px 0 0', height: maxDay > 0 ? `${Math.max(4, Math.round((d.cnt / maxDay) * 72))}px` : '4px', opacity: 0.8, transition: 'height 0.3s ease' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top pages + Traffic sources */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <div className={styles.tableWrap}>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)', marginBottom: '0' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  Топ страниц
                </h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {stats.byPage.length === 0 ? (
                  <p style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Нет данных</p>
                ) : stats.byPage.map(p => (
                  <div key={p.page} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', minWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page || '/'}</span>
                    <Bar value={p._count.id} max={maxPage} color="var(--accent)" />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.tableWrap}>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  Источники трафика
                </h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {stats.byReferer.length === 0 ? (
                  <p style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Нет данных</p>
                ) : stats.byReferer.map(r => (
                  <div key={r.source} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)', minWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.source}</span>
                    <Bar value={r.cnt} max={maxRef} color="#22c55e" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Countries + Hourly chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className={styles.tableWrap}>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                  По странам
                </h2>
              </div>
              <div style={{ padding: '8px 0' }}>
                {stats.byCountry.length === 0 ? (
                  <p style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Нет данных</p>
                ) : stats.byCountry.map(c => (
                  <div key={c.country} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.country}</span>
                    <Bar value={c.cnt} max={maxCountry} color="#c084fc" />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.tableWrap} style={{ padding: '20px 24px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
                Активность по часам
              </h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
                {allHours.map(h => (
                  <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={`${h.hour}:00 — ${h.cnt}`}>
                    <div style={{ width: '100%', background: '#f59e0b', borderRadius: '2px 2px 0 0', height: maxHour > 0 ? `${Math.max(2, Math.round((h.cnt / maxHour) * 72))}px` : '2px', opacity: 0.8, transition: 'height 0.3s ease' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                {[0, 6, 12, 18, 23].map(h => (
                  <span key={h} style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{h}ч</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
