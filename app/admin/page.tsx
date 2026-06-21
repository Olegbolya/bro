import { db } from '@/lib/db'
import styles from './admin.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  let stats = { visits: 0, newMessages: 0, publishedNews: 0 }

  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const [visits, newMessages, publishedNews] = await Promise.all([
      db.pageView.count({ where: { createdAt: { gte: today } } }),
      db.contactMessage.count({ where: { status: 'new' } }),
      db.news.count({ where: { published: true } }),
    ])
    stats = { visits, newMessages, publishedNews }
  } catch {}

  return (
    <div>
      <h1 className={styles.pageTitle}>Дашборд</h1>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} mono`}>{stats.visits}</div>
          <div className={styles.statLabel}>Посещений сегодня</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} mono`}>{stats.newMessages}</div>
          <div className={styles.statLabel}>Новых заявок</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} mono`}>{stats.publishedNews}</div>
          <div className={styles.statLabel}>Новостей опубликовано</div>
        </div>
      </div>

      <div className={styles.tableWrap} style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Статус системы:</strong> Панель управления активна.
          Используйте боковое меню для управления контентом.
          {stats.visits === 0 && stats.newMessages === 0
            ? ' База данных пуста — выполните npm run db:push && npm run db:seed для инициализации.'
            : ''}
        </p>
      </div>
    </div>
  )
}
