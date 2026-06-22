// Форма обратной связи на странице /contacts.
// Отправляет данные на POST /api/feedback. Клиентская валидация минимальна
// (required + type="email") — основная валидация происходит на сервере.
'use client'

import { useState } from 'react'
import styles from './ContactForm.module.css'

interface FormState {
  name: string
  email: string
  subject: string
  message: string
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  // status управляет внешним видом формы: idle / загрузка / успех / ошибка
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Фабрика обработчиков изменения полей — возвращает функцию для конкретного поля
  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Ошибка отправки'); return }
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
      setErrorMsg('Не удалось отправить. Попробуйте позже.')
    }
  }

  if (status === 'success') {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h3>Сообщение отправлено!</h3>
        <p>Мы свяжемся с вами в ближайшее время.</p>
        <button className={`btn btn-ghost ${styles.again}`} onClick={() => setStatus('idle')}>
          Отправить ещё
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Имя *</label>
          <input
            className={styles.input}
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="Ваше имя"
            required
            disabled={status === 'loading'}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email *</label>
          <input
            className={styles.input}
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            required
            disabled={status === 'loading'}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Тема *</label>
        <input
          className={styles.input}
          type="text"
          value={form.subject}
          onChange={set('subject')}
          placeholder="Тема обращения"
          required
          disabled={status === 'loading'}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Сообщение *</label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={form.message}
          onChange={set('message')}
          placeholder="Ваше сообщение..."
          required
          rows={5}
          disabled={status === 'loading'}
        />
      </div>

      {status === 'error' && (
        <div className={styles.error}>{errorMsg}</div>
      )}

      <button
        type="submit"
        className={`btn btn-primary ${styles.submit}`}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Отправка...' : 'Отправить сообщение'}
      </button>
    </form>
  )
}
