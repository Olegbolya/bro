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
      background: 'var(--accent-dim)',
      borderBottom: '1px solid var(--accent)',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '14px',
    }}>
      <span style={{ color: 'var(--text-primary)' }}>{banner.text}</span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          flexShrink: 0,
        }}
        aria-label="Закрыть"
      >×</button>
    </div>
  )
}
