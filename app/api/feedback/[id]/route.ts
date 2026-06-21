import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

const validStatuses = ['new', 'read', 'in_progress', 'archived']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await req.json()
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const msg = await db.contactMessage.update({
      where: { id: parseInt(params.id) },
      data: { status },
    })
    return NextResponse.json(msg)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
