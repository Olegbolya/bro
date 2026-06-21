import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    since.setHours(0, 0, 0, 0)

    const [byDay, total, uniqueRow] = await Promise.all([
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
    ])

    return NextResponse.json({
      byDay,
      total,
      unique: uniqueRow[0]?.uniq ?? 0,
    })
  } catch {
    return NextResponse.json({ byDay: [], total: 0, unique: 0 })
  }
}
