'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import styles from '../admin.module.css'

const QuillEditor = dynamic(() => import('@/components/news/QuillEditor'), { ssr: false })

interface NewsItem {
  id: number; title: string; slug: string; excerpt: string
  imageUrl: string | null; published: boolean; createdAt: string
}

const emptyForm = { title: '', slug: '', excerpt: '', content: '', imageUrl: '', published: false }

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\wа-яёА-ЯЁ\s-]/gi, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [form, setForm] = useState(emptyForm)
  const [fullContent, setFullContent] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const r = await fetch('/api/news?all=1')
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data)) setItems(data)
    }
  }

  useEffect(() => { load() }, [])

  function handleTitleChange(v: string) {
    setForm(f => ({ ...f, title: v, slug: f.slug || slugify(v) }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Ошибка загрузки')
      setForm(f => ({ ...f, imageUrl: data.url }))
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    if (!form.title.trim() || !form.excerpt.trim() || !fullContent.replace(/<[^>]*>/g, '').trim()) {
      setError('Заполните заголовок, анонс и содержимое'); return
    }
    setSaving(true); setError('')
    try {
      const url = editId ? `/api/news/${editId}` : '/api/news'
      const method = editId ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content: fullContent }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Ошибка')
      setForm(emptyForm); setFullContent(''); setEditId(null); setShowForm(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function del(id: number) {
    if (!confirm('Удалить новость?')) return
    await fetch(`/api/news/${id}`, { method: 'DELETE' })
    await load()
  }

  async function togglePublish(item: NewsItem) {
    await fetch(`/api/news/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published }),
    })
    await load()
  }

  async function startEdit(item: NewsItem) {
    try {
      const r = await fetch(`/api/news/${item.id}`)
      if (!r.ok) throw new Error('Ошибка загрузки')
      const full = await r.json()
      setEditId(item.id)
      setFormKey(k => k + 1)
      setForm({ title: full.title, slug: full.slug, excerpt: full.excerpt, content: '', imageUrl: full.imageUrl || '', published: full.published })
      setFullContent(full.content || '')
      setShowForm(true); setError(''); setUploadError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    }
  }

  function cancel() {
    setForm(emptyForm); setFullContent(''); setEditId(null)
    setFormKey(k => k + 1)
    setShowForm(false); setError(''); setUploadError('')
  }

  const inputStyle = { width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Новости</h1>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setFormKey(k => k + 1); setError('') }}
            style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            + Добавить
          </button>
        )}
      </div>

      {showForm && (
        <div className={styles.tableWrap} style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
            {editId ? 'Редактировать новость' : 'Новая новость'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Заголовок *</label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)} style={inputStyle} placeholder="Заголовок новости" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Slug *</label>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} style={inputStyle} placeholder="url-адрес" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Анонс *</label>
              <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Краткое описание для списка новостей" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Содержимое *</label>
              <QuillEditor key={formKey} initialValue={fullContent} onChange={setFullContent} />
            </div>

            {/* Image upload */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Изображение
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: uploading ? 'var(--text-secondary)' : 'var(--text-primary)',
                    cursor: uploading ? 'default' : 'pointer',
                    fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  {uploading ? 'Загружаю...' : '↑ Загрузить фото'}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                    style={{ padding: '8px 12px', background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Удалить фото
                  </button>
                )}
                {form.imageUrl && (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                    {form.imageUrl}
                  </span>
                )}
              </div>
              {uploadError && (
                <p style={{ color: 'var(--danger)', fontSize: '13px', margin: '6px 0 0' }}>{uploadError}</p>
              )}
              {form.imageUrl && (
                <div style={{ marginTop: '10px', border: '1px solid var(--border)', overflow: 'hidden', display: 'inline-block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Preview" style={{ maxHeight: '160px', maxWidth: '100%', display: 'block', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
              Опубликовать сразу
            </label>
            {error && <p style={{ color: 'var(--danger)', fontSize: '14px', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={save} disabled={saving || uploading}
                style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#000', fontWeight: 600, cursor: 'pointer', fontSize: '14px', opacity: (saving || uploading) ? 0.7 : 1 }}>
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
          <p style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>Новостей нет</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>Заголовок</th><th>Slug</th><th>Статус</th><th>Дата</th><th>Действия</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                      )}
                      {item.title}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{item.slug}</td>
                  <td>
                    <button onClick={() => togglePublish(item)}
                      style={{ padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: item.published ? 'var(--accent-dim)' : 'var(--surface-2)',
                        color: item.published ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {item.published ? 'Опубл.' : 'Черновик'}
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {new Date(item.createdAt).toLocaleDateString('ru-RU')}
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
