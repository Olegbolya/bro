import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE = process.env.NEXT_PUBLIC_BASE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://bro-olegs-projects-7c529983.vercel.app')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let newsItems: { slug: string; updatedAt: Date }[] = []
  try {
    newsItems = await db.news.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
  } catch {}

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
