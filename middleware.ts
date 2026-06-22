// Middleware Next.js: защищает все маршруты /admin/* от неавторизованного доступа.
// Запускается на Edge Runtime до рендеринга страницы — редирект происходит мгновенно.
// Страница /admin/login исключена из проверки, чтобы не создать бесконечный редирект.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'

export async function middleware(request: NextRequest) {
  // Пропускаем всё, что не относится к /admin
  if (!request.nextUrl.pathname.startsWith('/admin')) return NextResponse.next()
  // Страницу входа пропускаем без проверки сессии
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

  // Middleware читает сессию иначе, чем Server Components:
  // getIronSession здесь принимает request и response (не просто cookies())
  const response = NextResponse.next()

  try {
    const session = await getIronSession<SessionData>(request, response, {
      cookieName: 'bro_session',
      password: process.env.SESSION_SECRET as string,
    })

    if (!session.isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  } catch {
    // Ошибка парсинга сессии (например, невалидный ключ) — редиректим на вход
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

// Применяем middleware только к маршрутам /admin/*
export const config = {
  matcher: ['/admin/:path*'],
}
