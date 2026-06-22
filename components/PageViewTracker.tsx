// Невидимый компонент-трекер для сбора аналитики просмотров страниц.
// При каждом изменении pathname:
//   1. Отправляет POST /api/analytics (создаёт запись PageView, получает её id)
//   2. При уходе со страницы (cleanup useEffect) отправляет время через sendBeacon
// sendBeacon используется потому, что он гарантированно доставляет данные
// даже при закрытии вкладки, в отличие от обычного fetch.
'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Создаёт или возвращает уже существующий идентификатор сессии из sessionStorage.
// sessionStorage сбрасывается при закрытии вкладки — это и есть граница «сессии».
// try/catch нужен на случай, если sessionStorage заблокирован (режим инкогнито и т.д.)
// Резервный id уровня модуля — используется если оба Storage недоступны.
// Живёт столько же, сколько вкладка (модуль не перезагружается при SPA-навигации).
let _memorySessionId: string | null = null

function getOrCreateSessionId(): string {
  const key = 'bro_sid'
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

  // Пробуем sessionStorage (сбрасывается при закрытии вкладки — граница сессии)
  try {
    let id = sessionStorage.getItem(key)
    if (!id) { id = newId(); sessionStorage.setItem(key, id) }
    return id
  } catch { /* sessionStorage недоступен */ }

  // Fallback: localStorage (сохраняется между вкладками, но лучше фиксированного id
  // чем нового на каждый вызов — иначе каждая страница = новая сессия → 100% отказов)
  try {
    let id = localStorage.getItem(key)
    if (!id) { id = newId(); localStorage.setItem(key, id) }
    return id
  } catch { /* localStorage тоже недоступен */ }

  // Последний резерв: id в памяти — живёт пока открыта вкладка
  if (!_memorySessionId) _memorySessionId = newId()
  return _memorySessionId
}

export default function PageViewTracker() {
  const pathname = usePathname()
  // startRef хранит время открытия страницы без вызова ре-рендера
  const startRef = useRef<number>(Date.now())
  // viewIdRef хранит id созданной записи PageView, нужен для записи duration
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

    // Cleanup-функция выполняется при переходе на другую страницу или закрытии вкладки
    return () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000)
      // Отправляем только если страница открыта более 1 секунды, чтобы не засорять данные
      if (viewIdRef.current && duration > 1) {
        navigator.sendBeacon(
          '/api/analytics/duration',
          JSON.stringify({ id: viewIdRef.current, duration }),
        )
      }
    }
  }, [pathname])

  // Компонент не рендерит ничего в DOM
  return null
}
