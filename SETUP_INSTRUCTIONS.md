# 🚀 Шаги для завершения настройки Samkraft с Supabase

## ✅ Что уже сделано

1. ✅ Supabase проект создан
2. ✅ Credentials добавлены в `.dev.vars`
3. ✅ Код готов для работы с Supabase

---

## 📋 Следующие шаги (ВАЖНО!)

### Шаг 1: Запустить SQL миграцию в Supabase

**Это критически важно! Без этого база данных будет пустой.**

1. Откройте ваш Supabase проект:
   ```
   https://app.supabase.com/project/dltfprkqyzxyyvfejrdy
   ```

2. В левом меню выберите **SQL Editor**

3. Нажмите **New query**

4. Откройте файл `supabase_schema.sql` из репозитория GitHub:
   ```
   https://github.com/OummaEE/Samkraft/blob/main/supabase_schema.sql
   ```

5. **Скопируйте ВСЁ содержимое** файла (283 строки SQL)

6. **Вставьте** в SQL Editor в Supabase

7. Нажмите **Run** (или Ctrl/Cmd + Enter)

8. Дождитесь выполнения (займёт ~5-10 секунд)

9. Вы должны увидеть:
   ```
   Success. No rows returned
   NOTICE: Samkraft database schema created successfully!
   NOTICE: Next steps:
   NOTICE: 1. Configure RLS policies for authenticated users
   NOTICE: 2. Set up Supabase Auth
   NOTICE: 3. Update your app environment variables
   ```

### Шаг 2: Проверить таблицы

1. В Supabase перейдите в **Table Editor** (левое меню)

2. Вы должны увидеть **12 таблиц**:
   - ✅ users
   - ✅ projects
   - ✅ project_roles
   - ✅ project_participants
   - ✅ skills
   - ✅ user_skills
   - ✅ certificates
   - ✅ recommendations
   - ✅ messages
   - ✅ municipalities
   - ✅ activity_log

3. Откройте таблицу **skills** - должно быть **10 записей** (seed data)

4. Откройте таблицу **municipalities** - должно быть **3 записи**

✅ Если видите таблицы и данные - **база данных готова!**

---

## 🧪 Тестирование локально

### Запуск приложения

```bash
cd /home/user/webapp

# 1. Собрать проект
npm run build

# 2. Запустить локально
npx wrangler pages dev dist --port 3000
```

### Открыть в браузере

```
http://localhost:3000
```

### Проверить API

```bash
# Health check
curl http://localhost:3000/api/health

# Должно вернуть:
{
  "status": "ok",
  "timestamp": "...",
  "service": "Samkraft API",
  "database": "Supabase PostgreSQL"
}

# Municipalities
curl http://localhost:3000/api/municipalities

# Должно вернуть 3 муниципалитета
```

---

## ☁️ Деплой на Cloudflare Pages

### Вариант A: Через GitHub (рекомендуется)

1. Код уже на GitHub: https://github.com/OummaEE/Samkraft

2. Перейдите в Cloudflare Dashboard:
   ```
   https://dash.cloudflare.com/
   ```

3. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**

4. Выберите **GitHub** и авторизуйте Cloudflare

5. Выберите репозиторий **Samkraft**

6. Настройте build:
   - **Project name:** `samkraft`
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

7. Нажмите **Save and Deploy**

8. **ВАЖНО:** Добавьте Environment Variables:
   - Перейдите в **Settings** → **Environment variables**
   - **Production** (и Preview если нужно):
     
     **Variable 1:**
     - Name: `SUPABASE_URL`
     - Value: `https://dltfprkqyzxyyvfejrdy.supabase.co`
     
     **Variable 2:**
     - Name: `SUPABASE_ANON_KEY`
     - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGZwcmtxeXp4eXl2ZmVqcmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzcxNDksImV4cCI6MjA4NjU1MzE0OX0.EpSsjOtnxkgKw32VdjMZl62ug59_tYB9APtKveyMAH4`

9. **Save**

10. Перейдите на **Deployments** → **Retry deployment** (чтобы применить env variables)

### Вариант B: Через CLI

```bash
cd /home/user/webapp

# 1. Деплой
npx wrangler pages deploy dist --project-name samkraft

# 2. Добавить env variables через dashboard (см. выше Вариант A, шаг 8)
```

---

## 🧪 Проверка production deployment

После успешного деплоя:

```bash
# Получите URL (будет что-то вроде https://samkraft.pages.dev)

# Health check
curl https://samkraft.pages.dev/api/health

# Municipalities
curl https://samkraft.pages.dev/api/municipalities

# Skills
curl https://samkraft.pages.dev/api/skills
```

---

## 📊 Добавить тестовый проект

### Через Supabase Dashboard

1. Перейдите в **Table Editor** → **projects**

2. Нажмите **Insert** → **Insert row**

3. Заполните:
   ```
   title: Community Garden in Järva
   description_short: Build a community garden together
   description_long: We will create a 200m² community garden where local residents can grow vegetables and meet neighbors.
   category_primary: environmental
   location_municipality: Stockholms kommun
   status: active
   visibility: public
   max_participants: 15
   start_date: 2026-06-01
   end_date: 2026-09-30
   weekly_commitment: 4-6 hours/week
   ```

4. **Save**

5. Обновите главную страницу - проект должен появиться!

### Через SQL

```sql
INSERT INTO projects (
  title,
  description_short,
  description_long,
  category_primary,
  location_municipality,
  status,
  visibility,
  max_participants,
  start_date,
  end_date,
  weekly_commitment
) VALUES (
  'Community Garden in Järva',
  'Build a community garden together',
  'We will create a 200m² community garden where local residents can grow vegetables and meet neighbors.',
  'environmental',
  'Stockholms kommun',
  'active',
  'public',
  15,
  '2026-06-01',
  '2026-09-30',
  '4-6 hours/week'
);
```

---

## 🎯 Checklist

- [ ] SQL миграция выполнена в Supabase
- [ ] 12 таблиц созданы
- [ ] Seed data (skills, municipalities) присутствует
- [ ] Локальное тестирование прошло успешно
- [ ] Деплой на Cloudflare Pages выполнен
- [ ] Environment variables добавлены
- [ ] Production API работает
- [ ] Добавлен хотя бы 1 тестовый проект
- [ ] Главная страница загружается

---

## ❓ Troubleshooting

### "Database connection failed"

**Причина:** Environment variables не настроены в Cloudflare

**Решение:**
1. Cloudflare Pages → Settings → Environment variables
2. Добавьте `SUPABASE_URL` и `SUPABASE_ANON_KEY`
3. Retry deployment

### "Failed to fetch projects"

**Причина:** SQL миграция не выполнена

**Решение:**
1. Supabase → SQL Editor
2. Запустите `supabase_schema.sql`
3. Проверьте Table Editor → должно быть 12 таблиц

### Проекты не отображаются

**Причина:** Нет проектов со `status='active'`

**Решение:**
1. Добавьте тестовый проект (см. выше)
2. Убедитесь: `status='active'` и `visibility='public'`

---

## 📚 Следующие шаги

После успешного деплоя:

1. ⏳ **Phase 1: Authentication** (2-3 недели)
   - Supabase Auth integration
   - User registration (no personnummer)
   - Login/logout
   - Protected routes

2. ⏳ **Phase 2: CRUD** (1 месяц)
   - Project creation
   - Application system
   - Hours tracking
   - Real-time notifications

3. ⏳ **Phase 3: Certificates** (1 месяц)
   - PDF generation
   - QR verification
   - Recommendation letters
   - Municipality dashboard

---

**Ваши credentials безопасны:**
- ✅ `.dev.vars` в `.gitignore` (не коммитится)
- ✅ Anon key безопасен для client-side
- ✅ Row-Level Security защищает данные

**Готово к работе! 🎉**

Repository: https://github.com/OummaEE/Samkraft  
Supabase Project: https://app.supabase.com/project/dltfprkqyzxyyvfejrdy
