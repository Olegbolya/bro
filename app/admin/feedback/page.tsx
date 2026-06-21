'use client'

import { useEffect, useState } from 'react'
import styles from '../admin.module.css'

interface Message {
  id: number; name: string; email: string; subject: string
  message: string; status: string; createdAt: string
}

const statusLabel: Record<string, string> = {
  new: 'Новая', read: 'Прочитана', in_progress: 'В работе', archived: 'Архив',
}
const statusColor: Record<string, string> = {
  new: 'var(--accent)', read: 'var(--text-secondary)',
  in_progress: 'var(--warning)', archived: 'var(--surface-3)',
}

export default function FeedbackPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  async function load() {
    const r = await fetch('/api/feedback')
    if (r.ok) setMessages(await r.json())
  }

  useEffect(() => { load() }, [])

  async function setStatus(id: number, status: string) {
    await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Заявки из контактной формы</h1>

      <div className={styles.tableWrap}>
        {messages.length === 0 ? (
          <p style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>Заявок пока нет</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Тема</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <>
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {new Date(m.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td>{m.name}</td>
                    <td style={{ color: 'var(--accent)' }}>
                      <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()}>{m.email}</a>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</td>
                    <td>
                      <span style={{ color: statusColor[m.status] ?? 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {statusLabel[m.status] ?? m.status}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        value={m.status}
                        onChange={e => setStatus(m.id, e.target.value)}
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '4px 8px', fontSize: '12px' }}
                      >
                        {Object.entries(statusLabel).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expanded === m.id && (
                    <tr key={`${m.id}-expanded`}>
                      <td colSpan={6} style={{ background: 'var(--surface-2)', padding: '16px 20px' }}>
                        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line', margin: 0 }}>{m.message}</p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
