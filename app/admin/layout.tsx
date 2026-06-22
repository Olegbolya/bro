// Layout для раздела /admin.
// Добавляет панель навигации AdminNav поверх всего контента.
// Проверка авторизации (редирект на /admin/login) происходит в middleware.ts,
// а не здесь — это даёт более быстрый редирект без серверного рендеринга страницы.
import type { Metadata } from 'next'
import AdminNav from './AdminNav'
import styles from './admin.module.css'

export const metadata: Metadata = { title: 'Панель управления — БРО' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <AdminNav />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
