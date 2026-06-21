import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import sanitizeHtml from 'sanitize-html'

async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) throw new Error('Unauthorized')
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === '1'

  try {
    if (all) await requireAdmin()
    const news = await db.news.findMany({
      where: all ? undefined : { published: true },
      orderBy: { createdAt: 'desc' },
      take: all ? 200 : 20,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        imageUrl: true, published: true, createdAt: true,
      },
    })
    return NextResponse.json(news)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title, slug, excerpt, content, imageUrl, published } = await req.json()
    if (!title?.trim() || !excerpt?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    const finalSlug = (slug?.trim() || slugify(title)).slice(0, 80)
    const cleanContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
    })

    const item = await db.news.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content: cleanContent,
        imageUrl: imageUrl?.trim() || null,
        published: !!published,
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Slug уже занят' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
