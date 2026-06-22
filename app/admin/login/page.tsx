// Страница входа в панель администратора (/admin/login).
// После успешного входа router.refresh() принудительно обновляет кэш Next.js,
// чтобы AdminNav и другие server-компоненты получили актуальное состояние сессии.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Ошибка'); setLoading(false); return }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Ошибка подключения')
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <div className={styles.logo}>БРО</div>
        <h1 className={styles.title}>Вход в панель</h1>

        <form onSubmit={submit} className={styles.form}>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Пароль администратора"
            autoFocus
            disabled={loading}
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
