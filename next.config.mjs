// Конфигурация Next.js
// Здесь настраиваются разрешённые домены для next/image (оптимизация изображений).
// При добавлении нового хранилища — добавьте его домен в remotePatterns.

/** @type {import('next').NextConfig} */

// Базовые домены, всегда разрешённые
const remotePatterns = [
  { protocol: 'https', hostname: 'upload.wikimedia.org' },
  // Vercel Blob Storage
  { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
  { protocol: 'https', hostname: 'public.blob.vercel-storage.com' },
]

// Динамически добавляем S3-домен если задан (читается из .env при сборке)
if (process.env.S3_ENDPOINT) {
  try {
    const url = new URL(process.env.S3_ENDPOINT)
    const protocol = url.protocol.replace(':', '')
    remotePatterns.push({ protocol, hostname: url.hostname })
  } catch { /* некорректный URL — игнорируем */ }
}

// Если задан кастомный CDN для S3 — разрешаем и его
if (process.env.S3_PUBLIC_URL) {
  try {
    const url = new URL(process.env.S3_PUBLIC_URL)
    const protocol = url.protocol.replace(':', '')
    remotePatterns.push({ protocol, hostname: url.hostname })
  } catch { /* некорректный URL — игнорируем */ }
}

const config = {
  images: { remotePatterns },
}

export default config
