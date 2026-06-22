// Layout для страницы /embed — намеренно минимальный (без сайдбара и баннера).
// Embed используется как полноэкранный WebRTC-просмотрщик, встраиваемый в iframe.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
