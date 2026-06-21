import type { Metadata } from 'next'
import ContactForm from '@/components/feedback/ContactForm'
import styles from './contacts.module.css'

export const metadata: Metadata = {
  title: 'Контакты — БРО',
  description: 'Свяжитесь с командой Бои Роботов Онлайн',
}

export default function ContactsPage() {
  return (
    <div className={styles.wrap}>
      <div className="container">
        <h1 className={styles.title}>Контакты</h1>

        <div className={styles.grid}>
          {/* Реквизиты */}
          <div className={styles.info}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>О проекте</h2>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Проект</span>
                  <span>Бои Роботов Онлайн (БРО)</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Город</span>
                  <span>Казань</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ВКонтакте</span>
                  <a href="https://vk.com/bro_kzn" target="_blank" rel="noopener noreferrer">vk.com/bro_kzn</a>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Telegram</span>
                  <a href="https://t.me/robot_figh" target="_blank" rel="noopener noreferrer">@robot_figh</a>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>TikTok</span>
                  <a href="https://www.tiktok.com/@bro_kzn" target="_blank" rel="noopener noreferrer">@bro_kzn</a>
                </div>
              </div>
            </div>

            <div className={styles.card} style={{ marginTop: '20px' }}>
              <h2 className={styles.cardTitle}>Поддержка</h2>
              <p className={styles.supportText}>
                По вопросам игры, техническим проблемам или предложениям сотрудничества — воспользуйтесь формой или напишите нам напрямую в любой из соцсетей.
              </p>
            </div>
          </div>

          {/* Форма */}
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Написать нам</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
