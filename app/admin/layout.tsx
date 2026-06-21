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
