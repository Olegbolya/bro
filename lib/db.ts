// Singleton-обёртка над Prisma Client.
// В режиме разработки Next.js пересобирает модули при каждом hot-reload,
// что приводит к созданию множества подключений к БД. Сохраняем один
// экземпляр в globalThis, чтобы переиспользовать его между перезагрузками.
import { PrismaClient } from '@prisma/client'

// Расширяем globalThis, чтобы TypeScript знал о нашем поле prisma
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Берём существующий экземпляр из глобального объекта или создаём новый
export const db = globalForPrisma.prisma ?? new PrismaClient()

// В production глобальное присвоение не нужно — там нет hot-reload
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
