import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) throw new Error('Unauthorized')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1'

  try {
    if (all) await requireAdmin()
    const updates = await db.projectUpdate.findMany({
      orderBy: { date: 'desc' },
      take: all ? 200 : 20,
    })
    return NextResponse.json(updates)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { version, title, content, date } = await req.json()
    if (!version?.trim() || !title?.trim() || !content?.trim() || !date) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 })
    }

    const item = await db.projectUpdate.create({
      data: {
        version: version.trim(),
        title: title.trim(),
        content: content.trim(),
        date: new Date(date),
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
