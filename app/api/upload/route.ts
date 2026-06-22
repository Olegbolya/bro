// API маршрут загрузки изображений.
// Автоматически выбирает бэкенд хранилища по переменным окружения:
//   1. Vercel Blob  — если задан BLOB_READ_WRITE_TOKEN (продакшн на Vercel)
//   2. S3-совместимый (Yandex Cloud, MinIO, AWS S3) — если заданы S3_ENDPOINT + S3_ACCESS_KEY_ID + ...
//   3. Локальная папка public/uploads/ — резервный вариант, работает без настройки на VPS

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { getSession } from '@/lib/session'

// Разрешённые MIME-типы изображений
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
// Максимальный размер файла — 5 МБ
const MAX_BYTES = 5 * 1024 * 1024

// ─── Vercel Blob ─────────────────────────────────────────────────────────────

async function uploadToBlob(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { put } = await import('@vercel/blob')
  const blob = await put(key, buffer, { access: 'public', contentType })
  return blob.url
}

// ─── S3-совместимое хранилище (Yandex Cloud Object Storage, MinIO, AWS S3) ───

async function uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

  const client = new S3Client({
    region: process.env.S3_REGION || 'ru-central1',
    endpoint: process.env.S3_ENDPOINT,           // например: https://storage.yandexcloud.net
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // Для Yandex Cloud и других не-AWS провайдеров нужен path-style
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  })

  await client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }))

  // Если задан кастомный публичный домен (CDN) — используем его
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`
  }
  // Иначе строим URL по стандарту: endpoint/bucket/key
  const endpoint = process.env.S3_ENDPOINT!.replace(/\/$/, '')
  return `${endpoint}/${process.env.S3_BUCKET_NAME}/${key}`
}

// ─── Локальная файловая система ───────────────────────────────────────────────

async function uploadToLocal(buffer: Buffer, key: string): Promise<string> {
  // Папка public/uploads/news/ относительно корня проекта Next.js
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'news')
  await mkdir(uploadsDir, { recursive: true })

  // key имеет вид "news/timestamp-random.webp" — берём только имя файла
  const filename = path.basename(key)
  await writeFile(path.join(uploadsDir, filename), buffer)

  // Next.js раздаёт файлы из public/ по пути /uploads/news/filename
  return `/uploads/news/${filename}`
}

// ─── Определение активного бэкенда ───────────────────────────────────────────

function getStorageBackend(): 'blob' | 's3' | 'local' {
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob'
  if (
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  ) return 's3'
  return 'local'
}

// ─── Основной обработчик POST /api/upload ─────────────────────────────────────

export async function POST(request: NextRequest) {
  // Проверяем авторизацию: загружать файлы может только администратор
  const session = await getSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 })
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: 'Только изображения: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 5 МБ)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Конвертируем в WebP и уменьшаем до 1200px.
    // GIF пропускаем без изменений — sharp не поддерживает анимацию.
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

    // Уникальное имя файла: timestamp + случайный суффикс
    const key = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const backend = getStorageBackend()
    let url: string

    if (backend === 'blob') {
      url = await uploadToBlob(uploadBuffer, key, contentType)
    } else if (backend === 's3') {
      url = await uploadToS3(uploadBuffer, key, contentType)
    } else {
      url = await uploadToLocal(uploadBuffer, key)
    }

    return NextResponse.json({ url })
  } catch (e: unknown) {
    console.error('[upload] POST error:', e)
    const msg = e instanceof Error ? e.message : 'Ошибка загрузки'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
