# 🚀 Samkraft + Supabase Deployment Guide

## Почему Supabase?

✅ **PostgreSQL** - мощнее SQLite, лучше для production  
✅ **Built-in Auth** - JWT authentication из коробки  
✅ **Real-time** - WebSocket subscriptions для messaging  
✅ **Storage** - для PDF сертификатов и фото  
✅ **Row-Level Security** - безопасность на уровне строк  
✅ **Бесплатный tier** - 500MB БД, 2GB storage  
✅ **Auto-generated API** - REST API создаётся автоматически  

---

## Шаг 1: Создание проекта Supabase

### 1.1 Регистрация

1. Перейдите на https://supabase.com/
2. Нажмите **Start your project** → **Sign in** (через GitHub)
3. После авторизации нажмите **New project**

### 1.2 Создание проекта

Заполните форму:
- **Name:** `samkraft` (или другое имя)
- **Database Password:** Сгенерируйте сильный пароль (сохраните его!)
- **Region:** Выберите ближайший регион (например, `Europe (West) - eu-west-1` для Швеции)
- **Pricing Plan:** Free (достаточно для MVP)

Нажмите **Create new project** и подождите ~2 минуты.

### 1.3 Получение API credentials

После создания проекта:

1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: `https://abc123xyz.supabase.co`)
   - **anon / public key** (это безопасный ключ для client-side)

**Сохраните эти значения** - они понадобятся для деплоя!

---

## Шаг 2: Создание базы данных

### 2.1 Запуск SQL миграции

1. В Supabase Dashboard перейдите в **SQL Editor** (левое меню)
2. Нажмите **New query**
3. Откройте файл `supabase_schema.sql` из репозитория
4. Скопируйте **весь SQL код** и вставьте в редактор
5. Нажмите **Run** (или `Ctrl/Cmd + Enter`)

Вы должны увидеть сообщение:
```
Success. No rows returned
Samkraft database schema created successfully!
```

### 2.2 Проверка таблиц

1. Перейдите в **Table Editor** (левое меню)
2. Вы должны увидеть 12 таблиц:
   - users
   - projects
   - project_roles
   - project_participants
   - skills
   - user_skills
   - certificates
   - recommendations
   - messages
   - municipalities
   - activity_log

3. Откройте таблицу `skills` - там должно быть 10 записей (seed data)
4. Откройте `municipalities` - должно быть 3 муниципалитета

✅ **Если видите таблицы и данные - всё готово!**

---

## Шаг 3: Деплой на Cloudflare Pages

### 3.1 Подготовка кода

Убедитесь, что ваш код на GitHub (ветка `feature/supabase-integration` или `main`):

```bash
# Проверить статус
git status

# Закоммитить изменения
git add .
git commit -m "Add Supabase integration"
git push origin main
```

### 3.2 Создание проекта Cloudflare Pages

1. Войдите в https://dash.cloudflare.com/
2. Перейдите в **Workers & Pages**
3. Нажмите **Create application** → **Pages** → **Connect to Git**
4. Выберите **GitHub** и авторизуйте Cloudflare
5. Выберите репозиторий **Samkraft**
6. Настройте build:
   - **Project name:** `samkraft`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

### 3.3 Добавление Environment Variables

**КРИТИЧЕСКИ ВАЖНО:**

1. В настройках проекта перейдите в **Settings** → **Environment variables**
2. Добавьте переменные для **Production**:
   - **Variable name:** `SUPABASE_URL`
   - **Value:** `https://your-project-ref.supabase.co` (из Шага 1.3)
   - Нажмите **Add variable**
   
   - **Variable name:** `SUPABASE_ANON_KEY`
   - **Value:** `eyJhb...` (ваш anon key из Шага 1.3)
   - Нажмите **Add variable**

3. **(Опционально)** Добавьте те же переменные для **Preview** окружения

4. Нажмите **Save**

### 3.4 Деплой

1. Вернитесь на вкладку **Deployments**
2. Нажмите **Create deployment** → **Deploy site**
3. Подождите 2-3 минуты
4. После успешного деплоя получите URL: `https://samkraft.pages.dev`

---

## Шаг 4: Проверка работоспособности

### 4.1 Health Check

```bash
curl https://samkraft.pages.dev/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T...",
  "service": "Samkraft API",
  "database": "Supabase PostgreSQL"
}
```

### 4.2 Проверка API

```bash
# Список муниципалитетов
curl https://samkraft.pages.dev/api/municipalities

# Должен вернуть 3 муниципалитета
{
  "success": true,
  "data": [
    {"name": "Stockholms kommun", ...},
    {"name": "Göteborgs kommun", ...},
    {"name": "Malmö kommun", ...}
  ]
}
```

```bash
# Список навыков
curl https://samkraft.pages.dev/api/skills

# Должен вернуть 10 skills
{
  "success": true,
  "data": [
    {"name": "Gardening", "category": "Environmental", ...},
    ...
  ]
}
```

### 4.3 Откройте сайт в браузере

Перейдите на https://samkraft.pages.dev

Вы должны увидеть:
- ✅ Красивую главную страницу
- ✅ Секцию "Aktuella projekt" (пока пустую - нет проектов в БД)
- ✅ Footer с "Powered by Supabase PostgreSQL"

---

## Шаг 5: Локальная разработка (опционально)

### 5.1 Настройка .dev.vars

Создайте файл `.dev.vars` (не коммитится в git):

```bash
cp .dev.vars.example .dev.vars
```

Отредактируйте `.dev.vars`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 5.2 Запуск локально

```bash
# Собрать проект
npm run build

# Запустить локально с wrangler
npx wrangler pages dev dist --port 3000

# Или с PM2
pm2 start ecosystem.config.cjs
```

Откройте http://localhost:3000

---

## Автоматический деплой при push

После настройки через GitHub:

1. **Каждый push в `main`** → автоматический production deploy
2. **Pull Request** → preview deploy с уникальным URL
3. **Мониторинг** → Cloudflare Dashboard → Deployments

---

## Управление данными через Supabase Dashboard

### Добавление тестовых проектов (вручную)

1. Перейдите в **Table Editor** → **projects**
2. Нажмите **Insert row** → **Insert row manually**
3. Заполните поля:
   ```
   title: "Community Garden in Järva"
   description_short: "Build a community garden together"
   category_primary: "environmental"
   location_municipality: "Stockholms kommun"
   status: "active"
   visibility: "public"
   max_participants: 15
   ```
4. Нажмите **Save**

Теперь проект появится на главной странице!

### SQL запросы для вставки данных

Или используйте SQL Editor:

```sql
-- Вставить тестовый проект
INSERT INTO projects (
  title, 
  description_short, 
  category_primary, 
  location_municipality, 
  status, 
  visibility, 
  max_participants,
  creator_id
) VALUES (
  'Community Garden in Järva',
  'Build a community garden together',
  'environmental',
  'Stockholms kommun',
  'active',
  'public',
  15,
  (SELECT id FROM users LIMIT 1)  -- временно используем любого user
);
```

---

## Настройка Row-Level Security (RLS) - Фаза 2

Когда добавите authentication:

### Пример RLS policy для проектов:

```sql
-- Пользователи могут видеть только публичные проекты или свои
CREATE POLICY "Users can view public projects or their own"
  ON projects
  FOR SELECT
  USING (
    visibility = 'public' 
    OR 
    creator_id = auth.uid()
  );

-- Пользователи могут создавать проекты
CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  WITH CHECK (
    creator_id = auth.uid()
  );

-- Пользователи могут редактировать свои проекты
CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  USING (creator_id = auth.uid());
```

---

## Supabase Storage для файлов (Фаза 2)

### Создание bucket для сертификатов:

1. Перейдите в **Storage** (левое меню)
2. Нажмите **Create a new bucket**
3. **Name:** `certificates`
4. **Public bucket:** ✅ (или настройте RLS позже)
5. Нажмите **Create bucket**

### Загрузка файлов через API:

```typescript
// В будущем коде:
const { data, error } = await supabase.storage
  .from('certificates')
  .upload('certificate_abc123.pdf', pdfBlob)
```

---

## Troubleshooting

### Ошибка: "Database connection failed"

**Причина:** Environment variables не настроены

**Решение:**
1. Проверьте Cloudflare Pages → Settings → Environment variables
2. Убедитесь, что `SUPABASE_URL` и `SUPABASE_ANON_KEY` добавлены
3. Переделайте deployment

### Ошибка: "Failed to fetch projects"

**Причина:** Таблицы не созданы или RLS блокирует доступ

**Решение:**
1. Проверьте Supabase → Table Editor → видны ли таблицы?
2. Если таблиц нет → запустите `supabase_schema.sql` снова
3. Проверьте RLS policies (для публичных endpoint'ов они должны разрешать SELECT)

### Проекты не отображаются на главной

**Причина:** Нет проектов со статусом `active` и `visibility = 'public'`

**Решение:**
1. Добавьте тестовые проекты через Table Editor
2. Убедитесь, что `status = 'active'` и `visibility = 'public'`

### Локально работает, на production не работает

**Причина:** Environment variables не синхронизированы

**Решение:**
1. Проверьте `.dev.vars` (локально)
2. Проверьте Cloudflare environment variables (production)
3. Убедитесь, что значения одинаковые

---

## Миграция с D1 на Supabase (если уже деплоили D1)

Если у вас уже был деплой с Cloudflare D1:

### Вариант A: Новый проект в Cloudflare

1. Создайте новый проект `samkraft-supabase`
2. Следуйте этому гайду с нуля
3. Старый проект можно удалить позже

### Вариант B: Обновить существующий проект

1. Удалите D1 binding в Cloudflare Pages Settings
2. Добавьте Supabase environment variables
3. Создайте новый deployment
4. Cloudflare автоматически использует новую конфигурацию

---

## Стоимость

### Supabase Free Tier:
- ✅ 500MB Database space
- ✅ 2GB Storage
- ✅ 50,000 monthly active users
- ✅ 500MB Egress
- ✅ Unlimited API requests

**Достаточно для:**
- MVP с 500-1000 пользователями
- ~10,000 проектов
- ~50,000 сертификатов

### Cloudflare Pages Free Tier:
- ✅ Unlimited static requests
- ✅ Unlimited bandwidth
- ✅ 500 builds/month

### Когда переходить на платный план?

**Supabase Pro ($25/month):**
- При >500MB данных
- Нужно >50k active users
- Нужна custom domain email

**Cloudflare Pages Pro ($20/month):**
- При >500 builds/month
- Нужна advanced analytics

---

## Следующие шаги

### Фаза 1: Authentication
- [ ] Настроить Supabase Auth
- [ ] Добавить регистрацию/логин
- [ ] Настроить RLS policies
- [ ] JWT tokens

### Фаза 2: CRUD Operations
- [ ] Создание проектов (authenticated users)
- [ ] Подача заявок на участие
- [ ] Dashboard для creators
- [ ] Hours tracking

### Фаза 3: Certificates & Storage
- [ ] PDF generation
- [ ] Upload в Supabase Storage
- [ ] QR code verification
- [ ] Recommendation letters

---

## Полезные ссылки

- **Supabase Dashboard:** https://app.supabase.com/
- **Supabase Docs:** https://supabase.com/docs
- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **GitHub Repo:** https://github.com/OummaEE/Samkraft

---

## Поддержка

- **GitHub Issues:** https://github.com/OummaEE/Samkraft/issues
- **Supabase Discord:** https://discord.supabase.com/
- **Cloudflare Discord:** https://discord.gg/cloudflaredev

---

**🎉 Готово! Теперь у вас полноценное production-ready приложение с PostgreSQL базой данных!**

*Сильное приложение начинается с правильной базы данных. Supabase + Cloudflare Pages = идеальная комбинация для Samkraft.* 💙💛
