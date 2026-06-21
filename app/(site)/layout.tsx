import Sidebar from '@/components/layout/Sidebar'
import SiteBanner from '@/components/ui/SiteBanner'
import PageViewTracker from '@/components/PageViewTracker'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-root">
      <Sidebar />
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
