import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Бои Роботов Онлайн (БРО)',
  description: 'Управляйте реальными роботами на арене и станьте чемпионом!',
  icons: { icon: '/logobro.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="layout-root">
          <Sidebar />
          <main className="layout-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
