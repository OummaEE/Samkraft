# 🚀 Samkraft Quick Start Guide

## Что уже готово ✅

- ✅ Полное веб-приложение на Hono + Cloudflare Pages
- ✅ База данных D1 со всеми таблицами
- ✅ REST API с документацией
- ✅ Главная страница (multilingual design)
- ✅ Страница проектов с фильтрами
- ✅ Код залит на GitHub: https://github.com/OummaEE/Samkraft
- ✅ Готово к деплою на Cloudflare Pages

## Следующие шаги для деплоя

### 1. Создайте базу данных D1

```bash
npx wrangler d1 create samkraft-db
```

Скопируйте `database_id` из вывода и обновите `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "samkraft-db",
    "database_id": "ВАШ_DATABASE_ID_СЮДА"
  }
]
```

### 2. Примените миграции

```bash
npx wrangler d1 migrations apply samkraft-db --remote
```

### 3. Деплой на Cloudflare Pages

**Вариант А: Через веб-интерфейс (проще)**

1. Войдите в https://dash.cloudflare.com/
2. Pages → Create project → Connect to Git
3. Выберите репозиторий `Samkraft`
4. Настройки:
   - Build command: `npm run build`
   - Build output: `dist`
5. Settings → Functions → D1 database bindings → Add binding:
   - Variable name: `DB`
   - D1 database: `samkraft-db`
6. Save and Deploy

**Вариант Б: Через CLI**

```bash
npx wrangler pages project create samkraft --production-branch main
npm run build
npx wrangler pages deploy dist --project-name samkraft
```

Затем добавьте D1 binding через веб-интерфейс (шаг 5 выше).

### 4. Проверьте работу

```bash
curl https://samkraft.pages.dev/api/health
```

Должен вернуть:
```json
{"status":"ok","timestamp":"...","service":"Samkraft API"}
```

## Структура проекта

```
samkraft/
├── migrations/            # SQL миграции для D1
├── public/static/         # CSS и JS файлы
├── src/index.tsx         # Главный файл приложения (Hono)
├── wrangler.jsonc        # Cloudflare конфигурация
├── README.md             # Основная документация
├── DEPLOYMENT.md         # Подробная инструкция по деплою
├── ARCHITECTURE.md       # Описание архитектуры и roadmap
└── API_EXAMPLES.md       # Примеры использования API
```

## Полезные команды

```bash
# Локальная разработка
npm run build                  # Собрать проект
npm run dev:d1                # Запустить с локальной D1
npm run db:migrate:local      # Применить миграции локально
npm run db:seed               # Заполнить тестовыми данными

# Production
npm run deploy:prod           # Деплой на Cloudflare Pages
npm run db:migrate:prod       # Применить миграции на production

# Git
git status                    # Статус изменений
git add .                     # Добавить все файлы
git commit -m "message"       # Создать коммит
git push origin main          # Запушить на GitHub
```

## API Endpoints (доступны сейчас)

```
GET /api/health                          # Health check
GET /api/projects                        # Список проектов
GET /api/projects/:id                    # Детали проекта
GET /api/municipalities                  # Муниципалитеты
GET /api/skills                          # Навыки
GET /api/users/:username/portfolio       # Публичное портфолио
GET /api/certificates/verify/:hash       # Верификация сертификата
```

## Что делать дальше

### Приоритет 1: Деплой
1. Задеплойте на Cloudflare Pages (следуйте инструкции выше)
2. Протестируйте все API endpoints
3. Проверьте UI на мобильных устройствах

### Приоритет 2: Добавить функционал
1. **Аутентификация** (регистрация/логин)
2. **Создание проектов** (form + workflow)
3. **Подача заявок** на участие в проектах
4. **Генерация сертификатов** (PDF + QR codes)

### Приоритет 3: Контент
1. Добавить реальные проекты (через seed data или admin panel)
2. Создать контент для municipality pages
3. Добавить переводы (Swedish, English, Arabic, etc.)

### Приоритет 4: Партнёры
1. Связаться с муниципалитетами (Stockholm, Göteborg, Malmö)
2. Партнёрство с NGO (Red Cross, etc.)
3. Пилотная программа с 1-2 municipality

## Документация

- 📖 **README.md** - Общая информация и setup
- 🚀 **DEPLOYMENT.md** - Пошаговый деплой на Cloudflare
- 🏗️ **ARCHITECTURE.md** - Архитектура и roadmap
- 📡 **API_EXAMPLES.md** - Примеры использования API
- 📝 **Этот файл** - Быстрый старт

## Поддержка

- GitHub: https://github.com/OummaEE/Samkraft
- Issues: https://github.com/OummaEE/Samkraft/issues
- Email: contact@samkraft.se (когда настроите домен)

## Лицензия

MIT License - см. LICENSE файл

---

**Всё готово! Можете деплоить на Cloudflare Pages прямо сейчас. 🎉**

Если нужна помощь - открывайте issue на GitHub или пишите мне.

- Jane (your AI assistant) 🤖
