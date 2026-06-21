'use client'

import { useEffect, useState } from 'react'
import styles from '../admin.module.css'

interface Stats {
  total: number
  byPage: { page: string; _count: { id: number } }[]
  byDay: { day: string; cnt: number }[]
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

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
          <div className={styles.statsRow} style={{ marginBottom: '32px' }}>
            <div className={styles.statCard}>
              <div className={`${styles.statNum} mono`}>{stats.total}</div>
              <div className={styles.statLabel}>Просмотров за период</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statNum} mono`}>{stats.byDay.length}</div>
              <div className={styles.statLabel}>Дней с активностью</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statNum} mono`}>
                {stats.byDay.length > 0 ? Math.round(stats.total / stats.byDay.length) : 0}
              </div>
              <div className={styles.statLabel}>Среднее в день</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className={styles.tableWrap}>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)', marginBottom: '0' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  Топ страниц
                </h2>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>Страница</th><th style={{ textAlign: 'right' }}>Просмотров</th></tr>
                </thead>
                <tbody>
                  {stats.byPage.map(p => (
                    <tr key={p.page}>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{p.page || '/'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{p._count.id}</td>
                    </tr>
                  ))}
                  {stats.byPage.length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Нет данных</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.tableWrap}>
              <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                  По дням
                </h2>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr><th>Дата</th><th style={{ textAlign: 'right' }}>Просмотров</th></tr>
                </thead>
                <tbody>
                  {[...stats.byDay].reverse().slice(0, 15).map(d => (
                    <tr key={d.day}>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
                        {new Date(d.day).toLocaleDateString('ru-RU')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{d.cnt}</td>
                    </tr>
                  ))}
                  {stats.byDay.length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Нет данных</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
