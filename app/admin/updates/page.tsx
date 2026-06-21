'use client'

import { useEffect, useState } from 'react'
import styles from '../admin.module.css'

interface Update { id: number; version: string; title: string; content: string; date: string; createdAt: string }

const emptyForm = { version: '', title: '', content: '', date: '' }

export default function AdminUpdatesPage() {
  const [items, setItems] = useState<Update[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const r = await fetch('/api/updates?all=1')
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data)) setItems(data)
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.version.trim() || !form.title.trim() || !form.content.trim() || !form.date) {
      setError('Заполните все поля'); return
    }
    setSaving(true); setError('')
    try {
      const url = editId ? `/api/updates/${editId}` : '/api/updates'
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Ошибка')
      setForm(emptyForm); setEditId(null); setShowForm(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function del(id: number) {
    if (!confirm('Удалить запись?')) return
    await fetch(`/api/updates/${id}`, { method: 'DELETE' })
    await load()
  }

  function startEdit(item: Update) {
    setEditId(item.id)
    setForm({ version: item.version, title: item.title, content: item.content, date: item.date.slice(0, 10) })
    setShowForm(true); setError('')
  }

  function cancel() { setForm(emptyForm); setEditId(null); setShowForm(false); setError('') }

  const inputStyle = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Обновления</h1>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setError('') }}
            style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            + Добавить
          </button>
        )}
      </div>

      {showForm && (
        <div className={styles.tableWrap} style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
            {editId ? 'Редактировать обновление' : 'Новое обновление'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Версия *</label>
                <input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} style={inputStyle} placeholder="v1.2.0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Название *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Название релиза" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Дата *</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Содержимое *</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Что нового в этой версии..." />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '14px', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={save} disabled={saving}
                style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button onClick={cancel}
                style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        {items.length === 0 ? (
          <p style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>Обновлений нет</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Версия</th><th>Название</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent)' }}>{item.version}</span></td>
                  <td>{item.title}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {new Date(item.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(item)}
                        style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                        Ред.
                      </button>
                      <button onClick={() => del(item.id)}
                        style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}>
                        Удал.
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
