// API-роут выхода из системы.
// session.destroy() стирает зашифрованную cookie на клиенте,
// делая сессию недействительной без необходимости хранить список отозванных токенов.
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST() {
  const session = await getSession()
  await session.destroy()
  return NextResponse.json({ ok: true })
}
