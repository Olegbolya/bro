'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem('bro_sid')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem('bro_sid', id)
    }
    return id
  } catch {
    return Math.random().toString(36).slice(2)
  }
}

export default function PageViewTracker() {
  const pathname = usePathname()
  const startRef = useRef<number>(Date.now())
  const viewIdRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = Date.now()
    const sessionId = getOrCreateSessionId()

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pathname,
        sessionId,
        referer: document.referrer || null,
      }),
    })
      .then(r => r.json())
      .then(d => { viewIdRef.current = d.id ?? null })
      .catch(() => {})

    return () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000)
      if (viewIdRef.current && duration > 1) {
        navigator.sendBeacon(
          '/api/analytics/duration',
          JSON.stringify({ id: viewIdRef.current, duration }),
        )
      }
    }
  }, [pathname])

  return null
}
