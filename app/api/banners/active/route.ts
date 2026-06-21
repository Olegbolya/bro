import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const banner = await db.banner.findFirst({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    })
    if (!banner) return NextResponse.json(null)
    return NextResponse.json({ id: banner.id, text: banner.text })
  } catch {
    return NextResponse.json(null)
  }
}
