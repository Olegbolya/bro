// Конфигурация iron-session — зашифрованная сессия в HttpOnly cookie.
// iron-session хранит данные прямо в cookie (без серверного хранилища),
// шифруя их через SESSION_SECRET. Bcrypt здесь не используется — пароль
// проверяется в api/auth/login, а сессия лишь фиксирует факт входа.
import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

// Данные, которые хранятся внутри зашифрованной cookie
export interface SessionData {
  isAdmin: boolean
}

const sessionOptions = {
  cookieName: 'bro_session',
  // SESSION_SECRET должен быть длиной не менее 32 символов (требование iron-session)
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    // secure:true — cookie передаётся только по HTTPS; в dev отключено для localhost
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  },
}

// Возвращает текущую сессию из cookies запроса. Используется во всех API-роутах.
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}
