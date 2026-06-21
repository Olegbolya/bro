import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

const failedAttempts = new Map<string, { count: number; reset: number }>()

function checkBruteForce(ip: string): boolean {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  if (!entry || now > entry.reset) return true
  return entry.count < 10
}

function recordFailure(ip: string): void {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  if (!entry || now > entry.reset) {
    failedAttempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 })
  } else {
    entry.count++
  }
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip)
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  if (!checkBruteForce(ip)) {
    return NextResponse.json(
      { error: 'Слишком много неверных попыток. Подождите 15 минут.' },
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
  if (!valid) {
    recordFailure(ip)
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
  }

  clearFailures(ip)

  const session = await getSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}
