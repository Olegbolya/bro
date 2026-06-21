import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { page, sessionId, referer } = await req.json()
    if (!page || !sessionId) return NextResponse.json({ ok: false }, { status: 400 })

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      null

    const view = await db.pageView.create({
      data: { page, sessionId, ip, referer: referer || null },
    })
    return NextResponse.json({ id: view.id })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '30')
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)

    const [total, byPage, byDay] = await Promise.all([
      db.pageView.count({ where: { createdAt: { gte: since } } }),
      db.pageView.groupBy({
        by: ['page'],
        _count: { id: true },
        where: { createdAt: { gte: since } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      db.$queryRaw<{ day: string; cnt: number }[]>`
        SELECT DATE("createdAt") as day, COUNT(*)::int as cnt
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY day
      `,
    ])

    return NextResponse.json({ total, byPage, byDay })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
