import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { id, duration } = await req.json()
    if (typeof id !== 'number' || typeof duration !== 'number') return NextResponse.json({ ok: false }, { status: 400 })
    if (duration < 1 || duration > 86400) return NextResponse.json({ ok: false }, { status: 400 })
    await db.pageView.update({ where: { id }, data: { duration } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[analytics/duration] POST error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
