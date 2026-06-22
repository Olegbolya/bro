// Layout для публичной части сайта (route group «site»).
// Оборачивает все публичные страницы в структуру: сайдбар + баннер + основной контент.
// PageViewTracker рендерится здесь, а не в корневом layout, чтобы не трекать admin-страницы.
import Sidebar from '@/components/layout/Sidebar'
import SiteBanner from '@/components/ui/SiteBanner'
import PageViewTracker from '@/components/PageViewTracker'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-root">
      <Sidebar />
      {/* Правая колонка: баннер сверху, затем страница */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <SiteBanner />
        <main className="layout-main">
          {children}
        </main>
      </div>
      <PageViewTracker />
    </div>
  )
}
