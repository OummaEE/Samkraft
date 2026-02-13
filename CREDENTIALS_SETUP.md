# 🔐 Supabase Credentials – НАСТРОЕНО

## ✅ Ваши Credentials добавлены в проект

**Project URL:**
```
https://dltfprkqyzxyyvfejrdy.supabase.co
```

**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGZwcmtxeXp4eXl2ZmVqcmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzcxNDksImV4cCI6MjA4NjU1MzE0OX0.EpSsjOtnxkgKw32VdjMZl62ug59_tYB9APtKveyMAH4
```

---

## 📋 Что уже сделано:

✅ Создан файл `.dev.vars` с вашими ключами  
✅ Этот файл в `.gitignore` (не попадёт в GitHub)  
✅ Готов для локальной разработки с Wrangler  

---

## 🚀 ШАГ 1: Применить SQL Schema к вашей Supabase БД

### Вариант A: Через Supabase Dashboard (рекомендуется)

1. Откройте https://supabase.com/dashboard/project/dltfprkqyzxyyvfejrdy
2. Перейдите в **SQL Editor** (левое меню)
3. Нажмите **New query**
4. Скопируйте содержимое файла `supabase_schema.sql` из репозитория
5. Вставьте в редактор
6. Нажмите **Run** (или `Ctrl/Cmd + Enter`)

Должны увидеть:
```
Success. No rows returned
Samkraft database schema created successfully!
```

### Вариант B: Через CLI (если установлен Supabase CLI)

```bash
# Установить Supabase CLI (если нет)
npm install -g supabase

# Применить schema
supabase db push --db-url "postgresql://postgres:[YOUR_DB_PASSWORD]@db.dltfprkqyzxyyvfejrdy.supabase.co:5432/postgres" \
  --file supabase_schema.sql
```

---

## 🔍 ШАГ 2: Проверить, что таблицы созданы

### Через Dashboard:

1. Откройте https://supabase.com/dashboard/project/dltfprkqyzxyyvfejrdy/editor
2. Вы должны увидеть 12 таблиц:
   - `users`
   - `projects`
   - `project_roles`
   - `project_participants`
   - `skills`
   - `user_skills`
   - `certificates`
   - `recommendations`
   - `messages`
   - `municipalities`
   - `activity_log`

3. Откройте таблицу `skills` - должно быть 10 записей
4. Откройте `municipalities` - должно быть 3 муниципалитета

### Через API (test):

```bash
# После деплоя на Cloudflare Pages:
curl https://samkraft.pages.dev/api/skills
# Должен вернуть 10 skills

curl https://samkraft.pages.dev/api/municipalities
# Должен вернуть 3 municipalities
```

---

## 🌐 ШАГ 3: Добавить credentials в Cloudflare Pages

### В Cloudflare Dashboard:

1. Войдите на https://dash.cloudflare.com/
2. Перейдите в **Workers & Pages** → **samkraft**
3. Откройте **Settings** → **Environment variables**
4. Нажмите **Add variable**

**Добавьте 2 переменные для Production:**

**Переменная 1:**
- **Name:** `SUPABASE_URL`
- **Value:** `https://dltfprkqyzxyyvfejrdy.supabase.co`

**Переменная 2:**
- **Name:** `SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdGZwcmtxeXp4eXl2ZmVqcmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzcxNDksImV4cCI6MjA4NjU1MzE0OX0.EpSsjOtnxkgKw32VdjMZl62ug59_tYB9APtKveyMAH4`

5. **(Опционально)** Добавьте те же переменные для **Preview**
6. Нажмите **Save**

---

## 🏁 ШАГ 4: Деплой на Cloudflare Pages

### Создание Cloudflare Pages проекта (если ещё не создан):

```bash
# Из корня репозитория:
npx wrangler pages project create samkraft \
  --production-branch main \
  --compatibility-date 2026-02-13
```

### Деплой:

```bash
# Сборка
npm run build

# Деплой
npx wrangler pages deploy dist --project-name samkraft
```

**Или через GitHub (автодеплой):**
1. Подключите репозиторий https://github.com/OummaEE/Samkraft к Cloudflare Pages
2. При каждом push в `main` - автоматический деплой
3. Cloudflare сам соберёт и задеплоит проект

---

## ✅ ШАГ 5: Проверить работу

### Откройте в браузере:

```
https://samkraft.pages.dev
```

### Проверьте API endpoints:

```bash
# Health check
curl https://samkraft.pages.dev/api/health

# Должно вернуть:
{
  "status": "ok",
  "timestamp": "2026-02-13T...",
  "service": "Samkraft API",
  "database": "Supabase PostgreSQL"
}

# Список муниципалитетов
curl https://samkraft.pages.dev/api/municipalities

# Должно вернуть 3 municipality
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Stockholms kommun",
      "code": "0180",
      "region": "Stockholm"
    },
    ...
  ]
}

# Список навыков
curl https://samkraft.pages.dev/api/skills

# Должно вернуть 10 skills
```

---

## 🧪 Локальное тестирование (опционально)

### Запустить локально:

```bash
# Сборка
cd /home/user/webapp && npm run build

# Запуск с wrangler (использует .dev.vars)
npx wrangler pages dev dist --port 3000

# Открыть в браузере:
# http://localhost:3000
```

### Проверка локальных endpoints:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/municipalities
curl http://localhost:3000/api/skills
```

---

## 📊 Что уже настроено:

✅ **Credentials добавлены** в `.dev.vars`  
✅ **SQL Schema готова** в `supabase_schema.sql`  
✅ **API endpoints созданы** в `src/index.tsx`  
✅ **Frontend UI готов** (TailwindCSS + Swedish UX)  
✅ **Seed data готова** (municipalities, skills)  

---

## 🔜 Следующие шаги:

1. ✅ **Применить `supabase_schema.sql`** к вашей Supabase БД (ШАГ 1)
2. ✅ **Добавить credentials** в Cloudflare Pages (ШАГ 3)
3. ✅ **Задеплоить** на Cloudflare Pages (ШАГ 4)
4. 🧪 **Протестировать** endpoints (ШАГ 5)
5. 🎨 **Добавить тестовые проекты** через Supabase Table Editor
6. 🔐 **Настроить Auth** (Фаза 2)

---

## 🔐 Безопасность

### ❌ НЕ коммитьте в Git:
- `.dev.vars` (уже в `.gitignore`)
- Database passwords
- Service role keys (используйте только `anon` ключ на frontend)

### ✅ Безопасные ключи:
- **Anon key** - можно использовать в client-side коде
- **Service role key** - ТОЛЬКО для backend operations (не используется сейчас)

### 🛡️ Row-Level Security (RLS):
В текущей версии **RLS отключён** для публичных endpoints (`api/projects`, `api/skills`).  
После добавления Auth в Фазе 2 - включим RLS policies для защиты данных.

---

## 📚 Документация:

- **Deployment:** `SUPABASE_DEPLOYMENT.md`
- **Quick Start:** `QUICKSTART_SUPABASE.md`
- **API Examples:** `API_EXAMPLES.md`
- **Architecture:** `ARCHITECTURE.md`
- **Project Summary:** `PROJECT_SUMMARY.md`

---

## 💬 Поддержка:

- **GitHub Issues:** https://github.com/OummaEE/Samkraft/issues
- **Supabase Docs:** https://supabase.com/docs
- **Cloudflare Docs:** https://developers.cloudflare.com/pages

---

**🎉 Готово! Ваши credentials настроены, теперь нужно только применить SQL schema и задеплоить!**

*Следующий шаг: Откройте Supabase Dashboard и запустите `supabase_schema.sql` → Table Editor → SQL Editor → Run* 🚀
