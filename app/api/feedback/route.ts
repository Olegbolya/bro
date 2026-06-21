import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

// Простой rate limit в памяти (для serverless — достаточно для старта)
const ipLimits = new Map<string, { count: number; reset: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipLimits.get(ip)
  if (!entry || now > entry.reset) {
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Сообщение слишком длинное' }, { status: 400 })
  }

  try {
    await db.contactMessage.create({
      data: {
        name: name.trim().slice(0, 100),
        email: email.trim().slice(0, 200),
        subject: subject.trim().slice(0, 200),
        message: message.trim().slice(0, 2000),
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(messages)
}
