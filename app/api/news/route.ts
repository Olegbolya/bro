// API-роут для списка новостей.
// GET  — публичный список (только published:true) или полный список для администратора (?all=1)
// POST — создание новой статьи (только для администратора)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import sanitizeHtml from 'sanitize-html'

// Вспомогательная функция: бросает исключение, если запрос не от администратора
async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) throw new Error('Unauthorized')
}

// Генерирует URL-slug из произвольного текста, поддерживая кириллицу
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wа-яёА-ЯЁ\s-]/gi, '') // оставляем только буквы, цифры, пробелы, дефисы
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') // схлопываем множественные дефисы
    .slice(0, 80)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  // ?all=1 запрашивает все статьи включая черновики — только для авторизованного администратора
  const all = searchParams.get('all') === '1'

  try {
    if (all) await requireAdmin()
    const news = await db.news.findMany({
      where: all ? undefined : { published: true },
      orderBy: { createdAt: 'desc' },
      // Лимит: 200 для admin-панели (все статьи), 20 для публичного списка
      take: all ? 200 : 20,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        imageUrl: true, published: true, createdAt: true,
      },
    })
    return NextResponse.json(news)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error'
    if (msg !== 'Unauthorized') console.error('[news] GET error:', e)
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

    // Если slug не задан вручную — генерируем из заголовка
    const finalSlug = (slug?.trim() || slugify(title)).slice(0, 80)

    // Очищаем HTML от потенциально опасных тегов (XSS-защита)
    // Разрешаем img и заголовки h1-h3, которые использует редактор Quill
    const cleanContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'] },
    })
    // Проверяем, что после очистки осталось хоть что-то видимое (не только теги)
    if (!cleanContent.replace(/<[^>]*>/g, '').trim()) {
      return NextResponse.json({ error: 'Содержимое не может быть пустым' }, { status: 400 })
    }

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
    // Slug должен быть уникальным в БД — Prisma бросает Unique constraint при дублировании
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Slug уже занят' }, { status: 409 })
    }
    if (msg !== 'Unauthorized') console.error('[news] POST error:', e)
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
