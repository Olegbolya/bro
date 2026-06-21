import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Бои Роботов Онлайн (БРО)',
  description: 'Управляйте реальными роботами на арене и станьте чемпионом!',
  icons: { icon: '/logobro.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
