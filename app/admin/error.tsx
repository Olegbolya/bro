'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      padding: '60px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <p style={{ fontSize: '11px', color: 'var(--accent-2)', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace' }}>
        Ошибка
      </p>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Что-то пошло не так
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
        {error.message || 'Неизвестная ошибка'}
      </p>
      <button
        onClick={reset}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 20px',
          background: 'var(--accent)',
          border: 'none',
          color: '#000',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Повторить
      </button>
    </div>
  )
}
