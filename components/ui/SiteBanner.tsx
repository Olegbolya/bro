'use client'

import { useEffect, useState } from 'react'

interface BannerData { id: number; text: string }

export default function SiteBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/banners/active')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBanner(d) })
      .catch(() => {})
  }, [])

  if (!banner || dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(255,107,43,0.08), rgba(255,107,43,0.04))',
      borderBottom: '1px solid rgba(255, 107, 43, 0.25)',
      borderLeft: '3px solid var(--accent-2)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '13px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--accent-2)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}>⚠ Внимание</span>
        <span style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>{banner.text}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
          flexShrink: 0,
          padding: '2px 4px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-2)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        aria-label="Закрыть"
      >×</button>
    </div>
  )
}
