// Публичный эндпоинт: возвращает текущий активный баннер для показа на сайте.
// Баннер считается активным, если active:true и либо expiresAt не задан,
// либо expiresAt ещё не наступил. Используется компонентом SiteBanner.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// force-dynamic — отключает кэш Next.js, чтобы новые баннеры появлялись сразу
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // findFirst вместо findUnique — потому что фильтр содержит не-уникальное поле active
    const banner = await db.banner.findFirst({
      where: {
        active: true,
        // Принимаем баннеры без срока действия ИЛИ с датой истечения в будущем
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' }, // при нескольких активных берём самый свежий
    })
    if (!banner) return NextResponse.json(null)
    // Возвращаем только id и text — остальные поля (expiresAt и т.д.) клиенту не нужны
    return NextResponse.json({ id: banner.id, text: banner.text })
  } catch {
    // При ошибке возвращаем null, чтобы не сломать страницу — баннер некритичен
    return NextResponse.json(null)
  }
}
