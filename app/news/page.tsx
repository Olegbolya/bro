import type { Metadata } from 'next'
import styles from './news.module.css'

export const metadata: Metadata = {
  title: 'Новости — БРО',
  description: 'Новости проекта и история обновлений Бои Роботов Онлайн',
}

export default function NewsPage() {
  return (
    <div className={styles.wrap}>
      <div className="container">
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.tabActive}`}>Новости</button>
          <button className={styles.tab}>История обновлений</button>
        </div>

        {/* Заглушка — контент появится после подключения БД */}
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◈</div>
          <h2>Новостей пока нет</h2>
          <p>Следите за нашими соцсетями и скоро здесь появятся первые публикации.</p>
        </div>
      </div>
    </div>
  )
}
