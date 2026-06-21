import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import sanitizeHtml from 'sanitize-html'

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) throw new Error('Unauthorized')
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    const item = await db.news.findUnique({ where: { id: parseInt(params.id) } })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!item.published && !session.isAdmin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title.trim()
    if (body.slug !== undefined) data.slug = body.slug.trim()
    if (body.excerpt !== undefined) data.excerpt = body.excerpt.trim()
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || null
    if (body.published !== undefined) data.published = body.published
    if (body.content !== undefined) {
      data.content = sanitizeHtml(body.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
        allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
      })
    }

    const item = await db.news.update({ where: { id: parseInt(params.id) }, data })
    return NextResponse.json(item)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await db.news.delete({ where: { id: parseInt(params.id) } })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
