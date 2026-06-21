import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { getSession } from '@/lib/session'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasCredentials =
    !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID

  if (!hasCredentials) {
    return NextResponse.json(
      { error: 'Хранилище изображений не настроено. Привяжите Vercel Blob в настройках проекта.' },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 })
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'Только изображения: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 5 МБ)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Compress and convert to WebP (skip for GIF to preserve animation)
    let uploadBuffer: Buffer
    let contentType: string
    let ext: string

    if (file.type === 'image/gif') {
      uploadBuffer = buffer
      contentType = 'image/gif'
      ext = 'gif'
    } else {
      uploadBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()
      contentType = 'image/webp'
      ext = 'webp'
    }

    const key = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const blob = await put(key, uploadBuffer, { access: 'public', contentType })
    return NextResponse.json({ url: blob.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
