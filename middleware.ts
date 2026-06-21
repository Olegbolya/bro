import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import type { SessionData } from '@/lib/session'

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) return NextResponse.next()
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, {
    cookieName: 'bro_session',
    password: process.env.SESSION_SECRET as string,
  })

  if (!session.isAdmin) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
