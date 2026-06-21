import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'БРО — Бои Роботов Онлайн',
  description: 'Управляйте реальными роботами на арене и станьте чемпионом! Онлайн-игра с прямой трансляцией.',
}

const features = [
  { title: 'Реальные роботы',   text: 'Ощутите азарт от управления настоящей машиной, а не просто виртуальной моделью.' },
  { title: 'Прямая трансляция', text: 'Следите за боем в реальном времени с минимальной задержкой.' },
  { title: 'Доступность 24/7',  text: 'Арена открыта для боёв в любое время дня и ночи.' },
  { title: 'Играйте с друзьями',text: 'Получайте уведомления, бросайте вызовы друзьям и делитесь победами.' },
  { title: 'Турниры и призы',   text: 'Зарабатывайте опыт, повышайте уровень и выигрывайте призы в ежемесячных турнирах.' },
]

export default async function HomePage() {
  let visits30 = 0
  let uniquePlayers = 0

  try {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    since.setHours(0, 0, 0, 0)
    const [totalViews, sessions] = await Promise.all([
      db.pageView.count({ where: { createdAt: { gte: since } } }),
      db.pageView.groupBy({ by: ['sessionId'], where: { createdAt: { gte: since } } }),
    ])
    visits30 = totalViews
    uniquePlayers = sessions.length
  } catch {}

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroBadge}>⚡ Онлайн-арена</div>
          <h1 className={styles.heroTitle}>Бои Роботов<br /><span className={styles.heroAccent}>Онлайн</span></h1>
          <p className={styles.heroSub}>Управляйте реальными роботами на арене<br />и станьте чемпионом!</p>
          <a href="https://static.robo-arena.ru/queue.html" className={styles.heroCta}>
            Начать игру
          </a>
        </div>
      </section>

      {/* О проекте */}
      <section id="about" className={styles.about}>
        <div className="container">
          <h2 className="section-title">Что такое БРО?</h2>
          <p className={styles.aboutText}>
            <strong>«Бои Роботов Онлайн» (БРО)</strong> — инновационная онлайн-игра, где игроки управляют
            реальными физическими роботами на арене. Соревнуйтесь в динамичных боях 1v1, выталкивая
            противника за линию или переворачивая его, с прямой видеотрансляцией.
          </p>
          <video
            src="/images/circle2.mp4"
            autoPlay loop muted playsInline
            className={styles.video}
          />
        </div>
      </section>

      {/* Как работает */}
      <section id="how-it-works">
        <div className="container">
          <h2 className="section-title">Как это работает</h2>

          <div className={styles.featureBlock}>
            <h3 className={styles.featureTitle}>Полное погружение в бой</h3>
            <p className={styles.featureText}>
              Вы получаете прямое управление настоящим боевым роботом на физической арене.
              Благодаря видеотрансляции в реальном времени вы видите всё, что происходит
              на поле боя. Система автовозврата готовит роботов к следующему раунду за секунды.
            </p>
          </div>
          <video src="/images/autoreturn.mp4" autoPlay loop muted playsInline className={styles.video} />

          <div className={styles.featureBlock}>
            <h3 className={styles.featureTitle}>Точность каждого движения</h3>
            <p className={styles.featureText}>
              Современная система компьютерного зрения на основе AprilTags обеспечивает точное
              отслеживание роботов на арене. Честная и точная игровая механика — каждый маневр важен.
            </p>
          </div>
          <video src="/images/apriltag.mp4" autoPlay loop muted playsInline className={styles.video} />
        </div>
      </section>

      {/* Особенности */}
      <section id="features">
        <div className="container">
          <h2 className="section-title">Ключевые особенности</h2>
          <div className={styles.featuresGrid}>
            {features.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section id="stats">
        <div className="container">
          <h2 className="section-title">Статистика</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={`${styles.statNum} mono`}>{visits30 > 0 ? visits30.toLocaleString('ru-RU') : '—'}</span>
              <span className={styles.statLabel}>Посещений за 30 дней</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNum} mono`}>{uniquePlayers > 0 ? uniquePlayers.toLocaleString('ru-RU') : '—'}</span>
              <span className={styles.statLabel}>Уникальных сессий</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNum} mono`}>24/7</span>
              <span className={styles.statLabel}>Доступность арены</span>
            </div>
          </div>
        </div>
      </section>

      {/* Призыв к действию */}
      <section id="join">
        <div className="container">
          <div className={styles.ctaBlock}>
            <h2 className={styles.ctaTitle}>Готовы к битве?</h2>
            <p className={styles.ctaText}>Присоединяйтесь к тысячам игроков и начните свою карьеру бойца прямо сейчас!</p>
            <a href="https://static.robo-arena.ru/queue.html" className={styles.heroCta}>
              Присоединиться
            </a>
          </div>
        </div>
      </section>

      {/* Поддержка и партнёры */}
      <section id="sponsors">
        <div className="container">
          <div className={styles.sponsorBlock}>
            <h2 className="section-title">Поддержка и партнёры</h2>

            <div className={styles.mainSponsor}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/FASIE_RU_rgb_-_%D0%BE%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9.svg/1920px-FASIE_RU_rgb_-_%D0%BE%D1%81%D0%BD%D0%BE%D0%B2%D0%BD%D0%BE%D0%B9.svg.png"
                alt="Фонд содействия инновациям"
                className={styles.sponsorLogoMain}
              />
              <p className={styles.sponsorDesc}>
                Проект создан при поддержке Федерального государственного бюджетного учреждения
                «Фонд содействия развитию малых форм предприятий в научно-технической сфере»
                в рамках программы «Студенческий стартап»
              </p>
            </div>

            <div className={styles.partnersRow}>
              <img src="/images/it (1).png" alt="IT Park Казань"       className={styles.partnerLogo} />
              <img src="/images/кбр.png"    alt="Клуб боевых роботов"  className={styles.partnerLogo} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>© 2026 Бои Роботов Онлайн (БРО). Все права защищены.</p>
          <div className={styles.footerLinks}>
            <a href="https://vk.com/bro_kzn"              target="_blank" rel="noopener noreferrer">ВКонтакте</a>
            <a href="https://t.me/robot_figh"             target="_blank" rel="noopener noreferrer">Telegram</a>
            <a href="https://www.tiktok.com/@bro_kzn"     target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
          <Link href="/contacts" className={styles.footerContact}>Связаться с нами</Link>
        </div>
      </footer>
    </>
  )
}
