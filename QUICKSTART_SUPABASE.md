# 🚀 Samkraft + Supabase - Quick Start

## Что изменилось?

✅ **Заменили Cloudflare D1 на Supabase PostgreSQL**

**Почему Supabase лучше:**
- 💪 PostgreSQL (мощнее SQLite)
- 🔐 Built-in authentication (JWT, OAuth, magic links)
- ⚡ Real-time subscriptions для messaging
- 📦 File storage для PDF сертификатов
- 🛡️ Row-Level Security (RLS) для приватности
- 🆓 Бесплатный tier: 500MB БД + 2GB storage
- 🌍 Глобально распределённая БД

---

## Быстрый старт (5 минут)

### 1. Создать Supabase проект (2 мин)

```bash
1. Перейти: https://supabase.com/
2. Sign in → New project
3. Заполнить:
   Name: samkraft
   Password: [сгенерировать сильный]
   Region: Europe (West)
4. Create project
```

**Сохранить credentials:**
- Project URL: `https://xxx.supabase.co`
- anon key: `eyJhb...`

### 2. Создать таблицы (1 мин)

```bash
1. SQL Editor → New query
2. Скопировать содержимое: supabase_schema.sql
3. Вставить в редактор
4. Run
```

✅ **Проверка:** Table Editor → должно быть 12 таблиц

### 3. Деплой на Cloudflare (2 мин)

```bash
1. https://dash.cloudflare.com/
2. Pages → Create → Connect Git → Samkraft
3. Build:
   - Command: npm run build
   - Output: dist
4. Settings → Environment variables:
   - SUPABASE_URL = https://xxx.supabase.co
   - SUPABASE_ANON_KEY = eyJhb...
5. Redeploy
```

### 4. Проверка

```bash
curl https://samkraft.pages.dev/api/health
# Должно вернуть: "database": "Supabase PostgreSQL"

curl https://samkraft.pages.dev/api/municipalities
# Должно вернуть 3 муниципалитета
```

---

## Локальная разработка

### Setup

```bash
# 1. Скопировать example
cp .dev.vars.example .dev.vars

# 2. Отредактировать .dev.vars
nano .dev.vars
# Вставить свои SUPABASE_URL и SUPABASE_ANON_KEY

# 3. Билд
npm run build

# 4. Запуск
npx wrangler pages dev dist --port 3000
# Или с PM2:
pm2 start ecosystem.config.cjs
```

### Доступ

```
http://localhost:3000
```

---

## Добавить тестовые проекты

### Через Supabase Dashboard

```bash
1. Table Editor → projects → Insert row
2. Заполнить:
   title: "Community Garden"
   description_short: "Build a garden together"
   category_primary: "environmental"
   location_municipality: "Stockholms kommun"
   status: "active"
   visibility: "public"
   max_participants: 15
3. Save
```

### Через SQL

```sql
INSERT INTO projects (
  title,
  description_short,
  category_primary,
  location_municipality,
  status,
  visibility,
  max_participants
) VALUES (
  'Community Garden in Järva',
  'Build a community garden together',
  'environmental',
  'Stockholms kommun',
  'active',
  'public',
  15
);
```

---

## API Endpoints (работают сразу)

```bash
GET /api/health               # Health check
GET /api/projects             # Список проектов
GET /api/projects/:id         # Детали проекта
GET /api/municipalities       # Муниципалитеты
GET /api/skills               # Навыки
GET /api/users/:username/portfolio  # Портфолио (пока пусто)
GET /api/certificates/verify/:hash  # Верификация
```

---

## Что дальше?

### Phase 1: Authentication (следующие 2 недели)

```typescript
// Supabase Auth уже встроена!
import { createClient } from '@supabase/supabase-js'

// Registration
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password'
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})
```

### Phase 2: CRUD Operations

- [ ] Создание проектов (authenticated)
- [ ] Подача заявок
- [ ] Dashboard для creators
- [ ] Hours tracking

### Phase 3: Certificates

- [ ] PDF generation
- [ ] Upload в Supabase Storage
- [ ] QR code verification

---

## Преимущества Supabase vs D1

| Feature | Cloudflare D1 | Supabase |
|---------|---------------|----------|
| Database | SQLite | PostgreSQL ✅ |
| Auth | Manual setup | Built-in ✅ |
| Storage | R2 (separate) | Built-in ✅ |
| Real-time | Durable Objects | Built-in ✅ |
| Dashboard | Limited | Full-featured ✅ |
| Free tier | 5GB | 500MB + 2GB storage |
| Joins | Limited | Full SQL ✅ |

---

## Документация

- 📘 **README.md** - Основная документация
- 🚀 **SUPABASE_DEPLOYMENT.md** - Подробный гайд (этот файл)
- 📡 **API_EXAMPLES.md** - Примеры API запросов
- 🏗️ **ARCHITECTURE.md** - Техническая архитектура

---

## Troubleshooting

### "Database connection failed"

```bash
Причина: Environment variables не настроены
Решение:
1. Cloudflare Pages → Settings → Environment variables
2. Добавить SUPABASE_URL и SUPABASE_ANON_KEY
3. Redeploy
```

### "Failed to fetch projects"

```bash
Причина: Таблицы не созданы
Решение:
1. Supabase → SQL Editor
2. Запустить supabase_schema.sql
3. Проверить Table Editor → 12 таблиц
```

### Проекты не отображаются

```bash
Причина: Нет проектов со status='active'
Решение:
1. Добавить тестовый проект (см. выше)
2. Убедиться: status='active', visibility='public'
```

---

## Стоимость

**Free tier достаточно для:**
- ✅ 500-1000 активных пользователей
- ✅ 10,000+ проектов
- ✅ 50,000+ сертификатов
- ✅ Unlimited API requests

**Upgrade to Pro ($25/month) когда:**
- >500MB данных
- >50k monthly active users
- Нужен custom domain email

---

## Следующие шаги

1. ✅ **Supabase проект создан**
2. ✅ **Таблицы созданы**
3. ✅ **Деплой на Cloudflare**
4. ⏳ **Добавить тестовые проекты**
5. ⏳ **Настроить authentication**
6. ⏳ **Релиз Phase 1**

---

**Готово! Теперь у вас production-ready приложение с PostgreSQL! 🎉**

Repository: https://github.com/OummaEE/Samkraft  
Questions? Open an issue or check SUPABASE_DEPLOYMENT.md
