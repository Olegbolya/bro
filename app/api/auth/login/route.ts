import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

const attempts = new Map<string, { count: number; reset: number }>()

function checkBruteForce(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.reset) {
    attempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (!checkBruteForce(ip)) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте через 15 минут.' },
      { status: 429 }
    )
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Неверный формат' }, { status: 400 })
  }

  const { password } = body as { password?: string }
  if (!password) return NextResponse.json({ error: 'Введите пароль' }, { status: 400 })

  const hash = process.env.ADMIN_PASSWORD_HASH
  if (!hash) return NextResponse.json({ error: 'Сервер не настроен' }, { status: 500 })

  const valid = await bcrypt.compare(password, hash)
  if (!valid) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })

  const session = await getSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}
