# БРО — Бои Роботов Онлайн

Портал для управления онлайн-ареной боевых роботов. Next.js 14 App Router + PostgreSQL (Supabase) + Vercel.

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 14 (App Router) + TypeScript |
| БД | PostgreSQL (Supabase Supavisor pooler) |
| ORM | Prisma 5 |
| Аутентификация | iron-session (зашифрованная cookie) |
| Хранилище файлов | Vercel Blob |
| Стили | CSS Modules + CSS-переменные |
| Графики | Chart.js + react-chartjs-2 |
| WYSIWYG | Quill.js |
| Сжатие изображений | sharp (WebP, max 1200px) |

---

## Быстрый старт (локальная разработка)

### 1. Требования

- Node.js 20+
- Аккаунт на [Supabase](https://supabase.com) (или любой PostgreSQL)
- Аккаунт на [Vercel](https://vercel.com) с привязанным Blob-хранилищем

### 2. Клонировать и установить зависимости

```bash
git clone https://github.com/Olegbolya/bro.git
cd bro
npm install
```

### 3. Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase — transaction pooler (для Vercel serverless)
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase — session pooler (для prisma db push / миграций)
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

# Сессии (минимум 32 случайных символа)
SESSION_SECRET="<сгенерируйте: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"

# Хеш пароля администратора (bcrypt)
ADMIN_PASSWORD_HASH="<сгенерируйте: node -e \"require('bcryptjs').hash('ВАШ_ПАРОЛЬ',10).then(console.log)\">"

# Vercel Blob (для загрузки изображений)
BLOB_READ_WRITE_TOKEN=""
```

### 4. Инициализация базы данных

```bash
# Применить схему к БД
npm run db:push

# Заполнить начальными данными (баннер, демо-новость, первый релиз)
npm run db:seed
```

### 5. Запуск в режиме разработки

```bash
npm run dev
# → http://localhost:3000
# Панель управления → http://localhost:3000/admin
```

---

## Деплой на Vercel

### 1. Переменные окружения в Vercel Dashboard

Settings → Environment Variables → добавить все переменные из `.env.local`.

### 2. Vercel Blob

В Vercel Dashboard → Storage → Create Database → Blob Store.  
После создания `BLOB_READ_WRITE_TOKEN` добавится автоматически (или добавьте вручную).

### 3. Деплой

```bash
git push origin master
# Vercel CI/CD подхватит изменения автоматически
```

---

## Структура проекта

```
app/
├── (site)/          — публичные страницы (Главная, Новости, Контакты, Embed)
├── admin/           — панель управления (защищена сессией)
└── api/             — API-маршруты
components/
├── charts/          — Chart.js графики (VisitsChart, PublicStats)
├── feedback/        — ContactForm
├── layout/          — Sidebar, AdminNav
├── news/            — NewsTabs, QuillEditor
└── ui/              — SiteBanner
lib/
├── db.ts            — Prisma клиент (singleton)
└── session.ts       — iron-session конфиг
prisma/
├── schema.prisma    — Схема БД
└── seed.ts          — Начальные данные
```

---

## Основные маршруты

| URL | Описание |
|---|---|
| `/` | Главная (лендинг + публичная статистика) |
| `/news` | Новости и история обновлений |
| `/news/[slug]` | Полная статья |
| `/contacts` | Контакты + форма обратной связи |
| `/embed` | Встроенный WebRTC-плеер арены |
| `/admin` | Дашборд (требует авторизации) |
| `/admin/news` | CRUD новостей (Quill WYSIWYG) |
| `/admin/updates` | CRUD истории обновлений |
| `/admin/feedback` | Заявки из контактной формы |
| `/admin/analytics` | Детальная аналитика |
| `/admin/banners` | Управление глобальными баннерами |
| `/sitemap.xml` | Автогенерируемая карта сайта |

---

## Безопасность

- Пароль хранится как bcrypt-хеш (`ADMIN_PASSWORD_HASH`)
- Brute-force: 10 попыток / 15 мин по IP
- Сессии: iron-session (HttpOnly + Secure + SameSite=Lax cookie)
- XSS: sanitize-html на сервере при сохранении контента новостей
- SQL-инъекции: Prisma ORM (параметризованные запросы)
- Rate limit: /api/feedback — 3 заявки / час по IP
- Admin API: все мутации проверяют `session.isAdmin`

---

## Миграция на собственный VPS

```bash
# Требования: Node.js 20+, PostgreSQL, nginx, pm2

git clone https://github.com/Olegbolya/bro.git && cd bro
npm ci
cp .env.example .env  # заполнить DATABASE_URL, SESSION_SECRET, etc.
npm run db:push
npm run db:seed
npm run build
pm2 start npm --name bro -- start
# nginx: proxy_pass http://localhost:3000
```

При переносе файлов замените `BLOB_READ_WRITE_TOKEN` на доступ к Яндекс.Облако S3 или настройте локальное хранение.

---

## Рекомендации по развитию

- **Личный кабинет**: регистрация, история боёв, рейтинг
- **Уведомления**: Telegram-бот для новых заявок из формы контактов
- **Турниры**: страница `/tournaments` с турнирной сеткой
- **Redis**: кеширование агрегаций аналитики
- **Мониторинг**: Sentry для ошибок, UptimeRobot для аптайма
- **PWA**: Service Worker для добавления на главный экран
