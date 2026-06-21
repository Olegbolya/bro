import { db } from '@/lib/db'
import styles from '../admin.module.css'

export const dynamic = 'force-dynamic'

const statusLabel: Record<string, string> = {
  new:         'Новая',
  read:        'Прочитана',
  in_progress: 'В работе',
  archived:    'Архив',
}
const statusColor: Record<string, string> = {
  new:         'var(--accent)',
  read:        'var(--text-secondary)',
  in_progress: 'var(--warning)',
  archived:    'var(--surface-3)',
}

export default async function FeedbackPage() {
  let messages: Awaited<ReturnType<typeof db.contactMessage.findMany>> = []
  try {
    messages = await db.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  } catch {}

  return (
    <div>
      <h1 className={styles.pageTitle}>Заявки из контактной формы</h1>

      <div className={styles.tableWrap}>
        {messages.length === 0 ? (
          <p style={{ padding: '32px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Заявок пока нет
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Тема</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(m.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td>{m.name}</td>
                  <td style={{ color: 'var(--accent)' }}>
                    <a href={`mailto:${m.email}`}>{m.email}</a>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.subject}
                  </td>
                  <td>
                    <span style={{
                      color: statusColor[m.status] ?? 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {statusLabel[m.status] ?? m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
