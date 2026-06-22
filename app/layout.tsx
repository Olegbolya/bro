// Корневой layout всего приложения.
// Устанавливает глобальные метаданные (SEO), подключает CSS и задаёт lang="ru".
// Все остальные layouts (site, admin, embed) вложены в этот.
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
