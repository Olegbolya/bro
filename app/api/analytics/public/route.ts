import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    since.setHours(0, 0, 0, 0)

    const [byDay, total, uniqueRow, countriesRow, avgDurRow] = await Promise.all([
      db.$queryRaw<{ day: string; cnt: number }[]>`
        SELECT DATE("createdAt") as day, COUNT(*)::int as cnt
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY day
      `,
      db.pageView.count({ where: { createdAt: { gte: since } } }),
      db.$queryRaw<{ uniq: number }[]>`
        SELECT COUNT(DISTINCT "sessionId")::int as uniq
        FROM "PageView"
        WHERE "createdAt" >= ${since}
      `,
      db.$queryRaw<{ country: string; cnt: number }[]>`
        SELECT COALESCE(country, 'Неизвестно') as country, COUNT(*)::int as cnt
        FROM "PageView"
        WHERE "createdAt" >= ${since} AND country IS NOT NULL
        GROUP BY country
        ORDER BY cnt DESC
        LIMIT 5
      `,
      db.$queryRaw<{ avg_dur: number | null }[]>`
        SELECT AVG(duration)::int as avg_dur
        FROM "PageView"
        WHERE "createdAt" >= ${since} AND duration IS NOT NULL AND duration > 0
      `,
    ])

    return NextResponse.json({
      byDay,
      total,
      unique: uniqueRow[0]?.uniq ?? 0,
      countries: countriesRow,
      avgDuration: avgDurRow[0]?.avg_dur ?? null,
    })
  } catch (e) {
    console.error('[analytics/public] GET error:', e)
    return NextResponse.json({ byDay: [], total: 0, unique: 0, countries: [], avgDuration: null })
  }
}
