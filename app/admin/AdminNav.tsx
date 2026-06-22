// Боковая навигация панели администратора.
// Клиентский компонент — нужен для определения активного пункта меню (usePathname)
// и обработки кнопки «Выйти» (logout через fetch + router).
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import styles from './admin.module.css'

const links = [
  { href: '/admin',            label: 'Дашборд',   icon: '▦' },
  { href: '/admin/news',       label: 'Новости',    icon: '◈' },
  { href: '/admin/updates',    label: 'Обновления', icon: '◉' },
  { href: '/admin/feedback',   label: 'Заявки',     icon: '✉' },
  { href: '/admin/analytics',  label: 'Аналитика',  icon: '▣' },
  { href: '/admin/banners',    label: 'Баннеры',    icon: '⬡' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Уничтожаем сессию на сервере, затем переходим на страницу входа и сбрасываем кэш
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className={styles.nav}>
      <div className={styles.navLogo}>
        <span>БРО</span>
        <span className={styles.navLogoSub}>Admin</span>
      </div>

      <nav className={styles.navLinks}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.navLink} ${pathname === l.href ? styles.navLinkActive : ''}`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className={styles.navFooter}>
        <Link href="/" className={styles.navLink} style={{ fontSize: '13px' }}>
          ← На сайт
        </Link>
        <button onClick={logout} className={styles.logoutBtn}>Выйти</button>
      </div>
    </aside>
  )
}
