import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const article = await db.news.findUnique({
      where: { slug: params.slug, published: true },
      select: { title: true, excerpt: true, imageUrl: true },
    })
    if (!article) return { title: 'Новость не найдена — БРО' }
    return {
      title: `${article.title} — БРО`,
      description: article.excerpt,
      openGraph: article.imageUrl
        ? { images: [article.imageUrl] }
        : undefined,
    }
  } catch {
    return { title: 'БРО' }
  }
}

export default async function NewsArticlePage({ params }: Props) {
  let article: Awaited<ReturnType<typeof db.news.findUnique>> = null

  try {
    article = await db.news.findUnique({
      where: { slug: params.slug, published: true },
    })
  } catch {}

  if (!article) notFound()

  return (
    <div style={{ padding: '60px 0 80px', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '780px' }}>

        {/* Back link */}
        <Link
          href="/news"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '40px',
            transition: 'color 0.15s',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          ← Назад к новостям
        </Link>

        {/* Article header */}
        <div style={{
          borderLeft: '3px solid var(--accent)',
          paddingLeft: '20px',
          marginBottom: '40px',
        }}>
          <p style={{
            fontSize: '11px',
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '12px',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {new Date(article.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          <h1 style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
            marginBottom: '16px',
          }}>{article.title}</h1>
          <p style={{
            fontSize: '17px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>{article.excerpt}</p>
        </div>

        {/* Cover image */}
        {article.imageUrl && (
          <div style={{ position: 'relative', marginBottom: '40px', border: '1px solid var(--border-accent)', overflow: 'hidden', height: '420px' }}>
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 780px) 100vw, 780px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        )}

        {/* Article content */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
          style={{
            fontSize: '16px',
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}
        />

        {/* Back to list */}
        <div style={{
          marginTop: '60px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
        }}>
          <Link
            href="/news"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            ← Все новости
          </Link>
        </div>
      </div>
    </div>
  )
}
