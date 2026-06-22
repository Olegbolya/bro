// API-роут для изменения / удаления конкретного баннера (только для администратора).
// PATCH  — обновить текст, статус active или срок действия (частичное обновление)
// DELETE — удалить баннер
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) throw new Error('Unauthorized')
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const id = parseInt(params.id)
    const { text, active, expiresAt } = await req.json()

    // Spread с условием — включаем поле в data только если оно передано в теле запроса.
    // Это позволяет, например, переключить active не трогая text.
    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(text !== undefined && { text: text.trim() }),
        ...(active !== undefined && { active }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    })
    return NextResponse.json(banner)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await db.banner.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
