// API-роут авторизации администратора.
// Защищён от брутфорса: не более 10 неверных попыток с одного IP за 15 минут.
// Пароль хранится в .env только в виде bcrypt-хэша (ADMIN_PASSWORD_HASH),
// сырой пароль нигде не сохраняется.
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

// Хранилище счётчиков неудачных попыток в памяти процесса.
// Сбрасывается при перезапуске сервера — это приемлемо для одного инстанса.
const failedAttempts = new Map<string, { count: number; reset: number }>()

// Возвращает true, если IP ещё не исчерпал лимит попыток
function checkBruteForce(ip: string): boolean {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  // Если записи нет или окно сброса истекло — разрешаем
  if (!entry || now > entry.reset) return true
  return entry.count < 10
}

// Фиксирует неудачную попытку; при первой ошибке открывает 15-минутное окно
function recordFailure(ip: string): void {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  if (!entry || now > entry.reset) {
    failedAttempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 })
  } else {
    entry.count++
  }
}

// Сбрасывает счётчик после успешного входа
function clearFailures(ip: string): void {
  failedAttempts.delete(ip)
}

export async function POST(request: NextRequest) {
  // x-forwarded-for может содержать цепочку прокси — берём первый (реальный) IP
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

  // bcrypt.compare безопасно сравнивает пароль с хэшом (защита от timing-атак)
  const valid = await bcrypt.compare(password, hash)
  if (!valid) {
    recordFailure(ip)
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
  }

  clearFailures(ip)

  // Устанавливаем флаг isAdmin в зашифрованную cookie-сессию
  const session = await getSession()
  session.isAdmin = true
  await session.save()

  return NextResponse.json({ ok: true })
}
