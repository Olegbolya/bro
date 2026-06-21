'use client'

import { useEffect, useState } from 'react'
import styles from '../admin.module.css'

interface Banner { id: number; text: string; active: boolean; expiresAt: string | null; createdAt: string }

const emptyForm = { text: '', active: true, expiresAt: '' }

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const r = await fetch('/api/banners')
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data)) setBanners(data)
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.text.trim()) { setError('Введите текст баннера'); return }
    setSaving(true); setError('')
    try {
      const url = editId ? `/api/banners/${editId}` : '/api/banners'
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: form.text, active: form.active, expiresAt: form.expiresAt || null }),
      })
      if (!r.ok) throw new Error((await r.json()).error || 'Ошибка')
      setForm(emptyForm); setEditId(null); setShowForm(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function del(id: number) {
    if (!confirm('Удалить баннер?')) return
    await fetch(`/api/banners/${id}`, { method: 'DELETE' })
    await load()
  }

  async function toggle(b: Banner) {
    await fetch(`/api/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !b.active }),
    })
    await load()
  }

  function startEdit(b: Banner) {
    setEditId(b.id)
    setForm({ text: b.text, active: b.active, expiresAt: b.expiresAt ? b.expiresAt.slice(0, 16) : '' })
    setShowForm(true)
    setError('')
  }

  function cancel() { setForm(emptyForm); setEditId(null); setShowForm(false); setError('') }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Баннеры</h1>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setError('') }}
            style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            + Создать
          </button>
        )}
      </div>

      {showForm && (
        <div className={styles.tableWrap} style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
            {editId ? 'Редактировать баннер' : 'Новый баннер'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Текст баннера *</label>
              <textarea
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                rows={2}
                style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Активен
              </label>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Истекает</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '8px 12px', fontSize: '14px' }}
                />
              </div>
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
        {banners.length === 0 ? (
          <p style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>Баннеров нет</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Текст</th><th>Статус</th><th>Истекает</th><th>Действия</th></tr></thead>
            <tbody>
              {banners.map(b => (
                <tr key={b.id}>
                  <td style={{ maxWidth: '300px' }}>{b.text}</td>
                  <td>
                    <button onClick={() => toggle(b)}
                      style={{ padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: b.active ? 'var(--accent-dim)' : 'var(--surface-2)',
                        color: b.active ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {b.active ? 'Активен' : 'Выкл'}
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {b.expiresAt ? new Date(b.expiresAt).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => startEdit(b)}
                        style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                        Ред.
                      </button>
                      <button onClick={() => del(b.id)}
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
