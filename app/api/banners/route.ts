// API-роут для управления сайтовыми баннерами (только для администратора).
// GET  — список всех баннеров для admin-панели
// POST — создать новый баннер; поле expiresAt опционально (null = не истекает)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) throw new Error('Unauthorized')
}

export async function GET() {
  try {
    await requireAdmin()
    const banners = await db.banner.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(banners)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { text, active, expiresAt } = await req.json()
    if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 })

    const banner = await db.banner.create({
      data: {
        text: text.trim(),
        active: !!active,
        // null означает «показывать бессрочно»; дата — автоматическое снятие баннера
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    return NextResponse.json(banner, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
