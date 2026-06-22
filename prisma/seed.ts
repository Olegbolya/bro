import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Initial banner
  const bannerCount = await db.banner.count()
  if (bannerCount === 0) {
    await db.banner.create({
      data: {
        text: '🤖 Арена БРО открыта!',
        active: true,
      },
    })
    console.log('Created initial banner')
  }

  // Demo news article
  const newsCount = await db.news.count()
  if (newsCount === 0) {
    await db.news.create({
      data: {
        title: 'Добро пожаловать на арену БРО!',
        slug: 'welcome',
        excerpt: 'Бои Роботов Онлайн официально открыты. Управляйте реальными роботами на арене и станьте первым чемпионом!',
        content: `<h2>БРО — это реальность</h2>
<p>Мы рады объявить об официальном открытии арены Бои Роботов Онлайн. Теперь каждый желающий может сесть за джойстик и взять под управление настоящего боевого робота.</p>
<h3>Что вас ждёт</h3>
<ul>
<li>Бои в формате 1v1 на физической арене</li>
<li>Прямая видеотрансляция без задержек</li>
<li>Система рейтинга и достижений</li>
<li>Ежемесячные турниры с призами</li>
</ul>
<p>Следите за нашими обновлениями — скоро появятся новые режимы и роботы!</p>`,
        published: true,
      },
    })
    console.log('Created demo news article')
  }

  // Demo project update
  const updateCount = await db.projectUpdate.count()
  if (updateCount === 0) {
    await db.projectUpdate.create({
      data: {
        version: 'v1.0.0',
        title: 'Первый публичный релиз',
        content: `— Запуск публичной версии арены
— Поддержка боёв 1v1 в режиме реального времени
— Система очереди и автоматического матчмейкинга
— Видеотрансляция с минимальной задержкой
— Управление через веб-интерфейс без установки ПО`,
        date: new Date('2026-01-01'),
      },
    })
    console.log('Created demo project update')
  }

  console.log('Seed completed.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
