// Генератор sitemap.xml для поисковых роботов.
// Next.js автоматически вызывает эту функцию и отдаёт результат по /sitemap.xml.
// Базовый URL берётся из переменной окружения NEXT_PUBLIC_BASE_URL или VERCEL_URL.
import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

// Приоритет: NEXT_PUBLIC_BASE_URL (ручная настройка) → VERCEL_URL → хардкод для Vercel preview
const BASE = process.env.NEXT_PUBLIC_BASE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://bro-olegs-projects-7c529983.vercel.app')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let newsItems: { slug: string; updatedAt: Date }[] = []
  try {
    // Только опубликованные статьи попадают в sitemap — черновики не индексируются
    newsItems = await db.news.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
  } catch {} // При ошибке БД возвращаем sitemap только со статичными страницами

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/contacts`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...newsItems.map(n => ({
      url: `${BASE}/news/${n.slug}`,
      lastModified: n.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
