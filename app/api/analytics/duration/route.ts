import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { id, duration } = await req.json()
    if (!id || !duration) return NextResponse.json({ ok: false }, { status: 400 })
    await db.pageView.update({ where: { id }, data: { duration } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
