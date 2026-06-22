// Компонент вкладок страницы /news: «Новости» и «История обновлений».
// Активная вкладка хранится в URL (?tab=news или ?tab=updates), а не в state —
// это позволяет сохранять состояние при навигации «назад/вперёд» и шарить ссылки.
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from '@/app/(site)/news/news.module.css'

export interface NewsItem {
  id: number; title: string; slug: string; excerpt: string
  imageUrl: string | null; createdAt: string
}
export interface UpdateItem {
  id: number; version: string; title: string; content: string; date: string; createdAt: string
}

interface Props {
  news: NewsItem[]
  updates: UpdateItem[]
}

export default function NewsTabs({ news, updates }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'news'

  // scroll:false — не прокручиваем страницу наверх при смене вкладки
  function setTab(t: string) {
    router.push(`/news?tab=${t}`, { scroll: false })
  }

  return (
    <>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'news' ? styles.tabActive : ''}`} onClick={() => setTab('news')}>Новости</button>
        <button className={`${styles.tab} ${tab === 'updates' ? styles.tabActive : ''}`} onClick={() => setTab('updates')}>История обновлений</button>
      </div>

      {tab === 'news' && (
        news.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◈</div>
            <h2>Новостей пока нет</h2>
            <p>Следите за нашими соцсетями и скоро здесь появятся первые публикации.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {news.map(item => (
              <Link key={item.id} href={`/news/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <article className={styles.newsCard}>
                  {item.imageUrl && (
                    <div className={styles.newsCardImgWrap}>
                      <Image src={item.imageUrl} alt="" fill sizes="130px" style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                      {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)', lineHeight: 1.35 }}>{item.title}</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{item.excerpt}</p>
                    <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>Читать далее →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === 'updates' && (
        updates.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>◉</div>
            <h2>Обновлений пока нет</h2>
            <p>История изменений появится здесь после первого релиза.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {updates.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', gap: '24px', paddingBottom: '32px', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--border)', flexShrink: 0, marginTop: '4px' }} />
                  {i < updates.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '6px' }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--accent)', fontWeight: 700 }}>{item.version}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </>
  )
}
