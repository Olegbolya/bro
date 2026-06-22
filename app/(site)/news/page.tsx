// Страница списка новостей и истории обновлений (/news).
// Данные загружаются на сервере (Server Component), передаются в клиентский NewsTabs.
// Suspense нужен потому, что NewsTabs использует useSearchParams — это требование Next.js
// при наличии поискового параметра в URL в server-rendered окружении.
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { db } from '@/lib/db'
import NewsTabs from '@/components/news/NewsTabs'
import type { NewsItem, UpdateItem } from '@/components/news/NewsTabs'
import styles from './news.module.css'

// force-dynamic — не кэшируем страницу, чтобы новые статьи сразу появлялись без ребилда
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Новости — БРО',
  description: 'Новости проекта и история обновлений Бои Роботов Онлайн',
}

export default async function NewsPage() {
  let news: NewsItem[] = []
  let updates: UpdateItem[] = []

  try {
    const [rawNews, rawUpdates] = await Promise.all([
      db.news.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, title: true, slug: true, excerpt: true, imageUrl: true, createdAt: true },
      }),
      db.projectUpdate.findMany({ orderBy: { date: 'desc' }, take: 20 }),
    ])
    // Преобразуем Date в ISO-строки — Date не сериализуется при передаче из Server в Client Component
    news = rawNews.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }))
    updates = rawUpdates.map(u => ({ ...u, date: u.date.toISOString(), createdAt: u.createdAt.toISOString() }))
  } catch {}

  return (
    <div className={styles.wrap}>
      <div className="container">
        <Suspense fallback={null}>
          <NewsTabs news={news} updates={updates} />
        </Suspense>
      </div>
    </div>
  )
}
