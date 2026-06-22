// API-роут для формы обратной связи.
// POST — принять сообщение от посетителя и сохранить в ContactMessage.
//        Ограничение: 3 отправки в час с одного IP (защита от спама).
// GET  — список всех сообщений для admin-панели (только для администратора).
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Счётчики отправок в памяти процесса. Простой rate limit для одного инстанса VPS.
// При горизонтальном масштабировании потребуется Redis или аналог.
const ipLimits = new Map<string, { count: number; reset: number }>()

// Возвращает true, если IP не превысил лимит (3 сообщения в час)
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipLimits.get(ip)
  if (!entry || now > entry.reset) {
    // Первая отправка за последний час — инициализируем счётчик
    ipLimits.set(ip, { count: 1, reset: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Слишком много заявок. Попробуйте позже.' }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  const { name, email, subject, message } = body as Record<string, string>

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
  }
  // Базовая проверка формата email на сервере (дублирует клиентскую валидацию)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Сообщение слишком длинное' }, { status: 400 })
  }

  try {
    await db.contactMessage.create({
      data: {
        // slice гарантирует, что длина не превысит ограничения схемы БД
        name: name.trim().slice(0, 100),
        email: email.trim().slice(0, 200),
        subject: subject.trim().slice(0, 200),
        message: message.trim().slice(0, 2000),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[feedback] POST error:', e)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // возвращаем последние 100 сообщений; для архива понадобится пагинация
  })
  return NextResponse.json(messages)
}
