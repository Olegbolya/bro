// API-роут аналитики.
// POST — записать просмотр страницы (PageView); вызывается компонентом PageViewTracker.
//        После записи асинхронно запускается геолокация IP через ipwho.is.
// GET  — полные данные аналитики для admin-дашборда за последние N дней (?days=30).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Определяет страну и город по IP и сохраняет результат в PageView.
// Используется локальный кэш (GeoCache), чтобы не делать повторные запросы к ipwho.is
// для одного и того же IP.
async function lookupGeo(ip: string, viewId: number) {
  try {
    const cached = await db.geoCache.findUnique({ where: { ip } })
    if (cached) {
      await db.pageView.update({ where: { id: viewId }, data: { country: cached.country, city: cached.city } })
      return
    }
    // Таймаут 3 секунды — не хотим задерживать ответ пользователю
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(3000) })
    const data = await res.json()
    if (data.success) {
      const country = data.country ?? null
      const city = data.city ?? null
      await Promise.all([
        // Обновляем кэш и сам просмотр параллельно
        db.geoCache.upsert({
          where: { ip },
          create: { ip, country, city },
          update: { country, city, updatedAt: new Date() },
        }),
        db.pageView.update({ where: { id: viewId }, data: { country, city } }),
      ])
    }
  } catch {
    // Геолокация — дополнительная функция; ошибка не должна ломать аналитику
  }
}

// Регулярное выражение для определения приватных/локальных IP — для них геолокация бессмысленна
const PRIVATE_IP = /^(127\.|::1$|::ffff:127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/

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

    // Геолокацию запускаем асинхронно — не блокируем ответ клиенту
    if (ip && !PRIVATE_IP.test(ip)) {
      lookupGeo(ip, view.id).catch(() => {})
    }

    // Возвращаем id созданной записи — он нужен для последующей записи duration
    return NextResponse.json({ id: view.id })
  } catch (e) {
    console.error('[analytics] POST error:', e)
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

    // Все запросы выполняются параллельно для минимизации времени ответа
    const [total, byPage, byDay, uniqueRow, avgDurRow, byReferer, byCountry, byHour, bounceRow] =
      await Promise.all([
        // Общее число просмотров за период
        db.pageView.count({ where: { createdAt: { gte: since } } }),

        // Топ-10 самых посещаемых страниц
        db.pageView.groupBy({
          by: ['page'],
          _count: { id: true },
          where: { createdAt: { gte: since } },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),

        // Количество просмотров по дням (для графика)
        db.$queryRaw`
          SELECT DATE("createdAt") as day, COUNT(*)::int as cnt
          FROM "PageView"
          WHERE "createdAt" >= ${since}
          GROUP BY DATE("createdAt")
          ORDER BY day
        `,

        // Число уникальных сессий (прокси для уникальных посетителей)
        db.$queryRaw`
          SELECT COUNT(DISTINCT "sessionId")::int as uniq
          FROM "PageView"
          WHERE "createdAt" >= ${since}
        `,

        // Среднее время на странице (в секундах); записывается компонентом PageViewTracker
        db.$queryRaw`
          SELECT AVG(duration)::int as avg_dur
          FROM "PageView"
          WHERE "createdAt" >= ${since} AND duration IS NOT NULL AND duration > 0
        `,

        // Источники трафика: парсим домен из Referer-заголовка
        db.$queryRaw`
          SELECT
            CASE
              WHEN referer IS NULL OR referer = '' THEN 'Прямой переход'
              ELSE REPLACE(SPLIT_PART(SPLIT_PART(referer, '//', 2), '/', 1), 'www.', '')
            END as source,
            COUNT(*)::int as cnt
          FROM "PageView"
          WHERE "createdAt" >= ${since}
          GROUP BY source
          ORDER BY cnt DESC
          LIMIT 10
        `,

        // Топ стран посетителей
        db.$queryRaw`
          SELECT COALESCE(country, 'Неизвестно') as country, COUNT(*)::int as cnt
          FROM "PageView"
          WHERE "createdAt" >= ${since}
          GROUP BY country
          ORDER BY cnt DESC
          LIMIT 10
        `,

        // Распределение просмотров по часам суток (для тепловой карты активности)
        db.$queryRaw`
          SELECT EXTRACT(HOUR FROM "createdAt")::int as hour, COUNT(*)::int as cnt
          FROM "PageView"
          WHERE "createdAt" >= ${since}
          GROUP BY EXTRACT(HOUR FROM "createdAt")
          ORDER BY hour
        `,

        // Показатель отказов: сессии с единственным просмотром / все сессии
        db.$queryRaw`
          SELECT
            SUM(CASE WHEN cnt = 1 THEN 1 ELSE 0 END)::int as bounced,
            COUNT(*)::int as total_sessions
          FROM (
            SELECT "sessionId", COUNT(*) as cnt
            FROM "PageView"
            WHERE "createdAt" >= ${since}
            GROUP BY "sessionId"
          ) t
        `,
      ])

    return NextResponse.json({
      total,
      uniqueVisitors: (uniqueRow as {uniq:number}[])[0]?.uniq ?? 0,
      avgDuration: (avgDurRow as {avg_dur:number|null}[])[0]?.avg_dur ?? null,
      bounce: (bounceRow as {bounced:number;total_sessions:number}[])[0] ?? { bounced: 0, total_sessions: 0 },
      byPage,
      byDay,
      byReferer,
      byCountry,
      byHour,
    })
  } catch (e) {
    console.error('[analytics] GET error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
