# Samkraft - Архитектура и будущие возможности

## Текущая архитектура (MVP)

### Технологический стек

**Frontend:**
- Vanilla JavaScript (через CDN для прототипирования)
- TailwindCSS (через CDN)
- Font Awesome Icons
- Axios для HTTP запросов

**Backend:**
- Hono framework (Cloudflare Workers)
- TypeScript
- Cloudflare Pages для хостинга

**База данных:**
- Cloudflare D1 (SQLite на edge)
- Глобально распределённая
- Локальная разработка с `--local` флагом

**Deployment:**
- Cloudflare Pages (edge deployment)
- Automatic deployments через GitHub
- Preview deployments для PR

### Текущие возможности ✅

1. **Публичная главная страница** (/)
   - Hero section с ценностным предложением
   - 3 основных преимущества платформы
   - Секция "Как это работает" (3 шага)
   - Превью актуальных проектов
   - CTA секция для регистрации
   - Footer с навигацией

2. **Страница проектов** (/projects)
   - Список всех активных проектов
   - Фильтры: категория, муниципалитет, тип
   - Карточки проектов с основной информацией
   - Загрузка данных из API

3. **REST API endpoints:**
   - `GET /api/health` - Health check
   - `GET /api/projects` - Список проектов с фильтрами
   - `GET /api/projects/:id` - Детали проекта + роли
   - `GET /api/municipalities` - Список муниципалитетов
   - `GET /api/skills` - Список навыков
   - `GET /api/users/:username/portfolio` - Публичное портфолио
   - `GET /api/certificates/verify/:hash` - Верификация сертификата

4. **База данных (D1):**
   - Полная схема с 12 таблицами
   - Миграции
   - Seed data для тестирования

5. **Deployment инфраструктура:**
   - Git репозиторий с comprehensive .gitignore
   - PM2 конфигурация для sandbox разработки
   - Build scripts для production
   - README с полной документацией

## Планируемые функции (Roadmap)

### Фаза 1: Аутентификация и регистрация (Priority: HIGH)

**Функционал:**
- [ ] Регистрация без personnummer
  - Email/Phone верификация
  - SMS/Email OTP коды
  - Progressive tier system (basic → verified → validated)
- [ ] JWT authentication
- [ ] Login/Logout
- [ ] Password reset
- [ ] Session management

**API endpoints:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/verify-email
POST /api/auth/verify-phone
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

**Технологии:**
- JWT tokens с Ed25519 signing
- HttpOnly cookies для refresh tokens
- Twilio для SMS (или альтернатива)
- SendGrid для email

### Фаза 2: Управление проектами (Priority: HIGH)

**Функционал:**
- [ ] Создание проектов (form wizard)
- [ ] Workflow апрува проектов (mentor review)
- [ ] Подача заявок на участие в проектах
- [ ] Accept/reject заявок (creator view)
- [ ] Dashboard для creator'ов
- [ ] Логирование часов работы
- [ ] Статусы проектов (draft → active → completed)

**API endpoints:**
```
POST /api/projects
PUT /api/projects/:id
DELETE /api/projects/:id
POST /api/projects/:id/apply
GET /api/projects/:id/applicants
PUT /api/projects/:id/applicants/:userId/accept
PUT /api/projects/:id/applicants/:userId/reject
POST /api/projects/:id/hours
```

**UI pages:**
- `/dashboard` - User dashboard
- `/projects/create` - Project creation wizard
- `/projects/:id` - Detailed project page
- `/projects/:id/manage` - Project management (for creators)

### Фаза 3: Сертификаты и портфолио (Priority: HIGH)

**Функционал:**
- [ ] Генерация PDF сертификатов
- [ ] Cryptographic signing сертификатов
- [ ] Public verification page
- [ ] Downloadable certificates
- [ ] User portfolio pages
- [ ] Skill validation system
- [ ] Impact score calculation
- [ ] Badges система

**API endpoints:**
```
POST /api/certificates (mentor issues certificate)
GET /api/certificates/:id
GET /api/certificates/:id/pdf
GET /api/certificates/verify/:hash
PUT /api/users/:id/skills
POST /api/users/:id/skills/:skillId/validate (mentor validates)
```

**Technologies:**
- PDF generation: @cloudflare/pdfmake или puppeteer
- QR codes: qrcode library
- Cryptographic signing: Web Crypto API

### Фаза 4: Recommendation letters (Priority: MEDIUM)

**Функционал:**
- [ ] Request recommendation from mentor
- [ ] Auto-generated data section
- [ ] Custom mentor text section
- [ ] PDF export
- [ ] Verification URL
- [ ] Email notifications

**API endpoints:**
```
POST /api/recommendations/request
GET /api/recommendations/:id
PUT /api/recommendations/:id
GET /api/recommendations/:id/pdf
```

### Фаза 5: Messaging система (Priority: MEDIUM)

**Функционал:**
- [ ] Direct messages между users
- [ ] Project group chats
- [ ] Notifications
- [ ] Read receipts
- [ ] Moderation (flag/report)

**API endpoints:**
```
GET /api/messages
POST /api/messages
GET /api/messages/:id
PUT /api/messages/:id/read
POST /api/messages/:id/flag
GET /api/conversations/:userId
```

**Technologies:**
- Durable Objects для real-time messaging (Cloudflare)
- WebSocket connections для live updates

### Фаза 6: Municipality dashboard (Priority: MEDIUM)

**Функционал:**
- [ ] Analytics dashboard
- [ ] Impact metrics visualization
- [ ] Project sponsorship
- [ ] Budget tracking
- [ ] Export reports (PDF, CSV)
- [ ] Comparison with other municipalities

**UI pages:**
- `/municipality/dashboard` - Main dashboard
- `/municipality/projects` - Project management
- `/municipality/analytics` - Deep analytics
- `/municipality/reports` - Report generation

**Technologies:**
- Chart.js или D3.js для visualizations
- Server-side PDF generation для reports

### Фаза 7: Admin panel (Priority: MEDIUM)

**Функционал:**
- [ ] User management
- [ ] Content moderation
- [ ] Project approval queue
- [ ] System settings
- [ ] Analytics overview
- [ ] Audit logs

**UI pages:**
- `/admin/dashboard`
- `/admin/users`
- `/admin/projects`
- `/admin/moderation`
- `/admin/settings`

### Фаза 8: Search & Discovery (Priority: LOW)

**Функционал:**
- [ ] Full-text search проектов
- [ ] Advanced filters
- [ ] Recommended projects (algorithm)
- [ ] Saved searches
- [ ] Email alerts для новых projects

**Technologies:**
- Algolia или Typesense для search
- Или Cloudflare Vectorize для semantic search

### Фаза 9: Mobile optimization (Priority: MEDIUM)

**Функционал:**
- [ ] Progressive Web App (PWA)
- [ ] Offline mode
- [ ] Push notifications
- [ ] Camera integration (photo uploads)
- [ ] Geolocation для check-ins
- [ ] Mobile-optimized UI

**Technologies:**
- Service Workers
- Web Push API
- Workbox для offline caching

### Фаза 10: Internationalization (Priority: LOW)

**Функционал:**
- [ ] Swedish (Svenska) ✅ (частично)
- [ ] English
- [ ] Arabic (العربية)
- [ ] Ukrainian (Українська)
- [ ] Russian (Русский)
- [ ] Dari/Farsi (دری/فارسی)
- [ ] Sorani Kurdish (سۆرانی)

**Technologies:**
- i18next или LinguiJS
- JSON файлы с переводами
- Автоопределение языка из browser settings

### Фаза 11: Интеграции (Priority: LOW)

**Potential integrations:**
- [ ] BankID для Swedish citizens
- [ ] LinkedIn export портфолио
- [ ] Arbetsförmedlingen API (job matching)
- [ ] Migrationsverket API (опционально, с согласия пользователя)
- [ ] Kommun HR systems
- [ ] Google Calendar для project events

## Технические улучшения

### Performance

- [ ] Implement KV caching для hot data
- [ ] Add CDN caching headers
- [ ] Lazy loading images
- [ ] Code splitting
- [ ] Database query optimization
- [ ] Rate limiting на API

### Security

- [ ] Content Security Policy (CSP)
- [ ] Rate limiting
- [ ] CAPTCHA на регистрации
- [ ] SQL injection protection (prepared statements ✅)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Regular security audits

### Monitoring

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Analytics (Plausible или Fathom)
- [ ] Uptime monitoring
- [ ] Database query monitoring

### Testing

- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] API tests
- [ ] Load testing

## Масштабирование

### Cloudflare Services для scale

**Когда добавлять:**
- **KV Namespace** - при 10,000+ users (session caching, profile cache)
- **R2 Storage** - когда появятся uploads (certificates PDFs, profile photos)
- **Durable Objects** - для real-time messaging
- **Workers Analytics** - для advanced analytics
- **Cloudflare Images** - для обработки profile photos

### Database scaling strategy

**Current:** Single D1 database, globally replicated

**Future (at 100k+ users):**
- Vertical scaling (D1 automatically handles)
- Read replicas (D1 automatic replication)
- Sharding by municipality (если нужно)

### Cost estimates

| Users | Requests/month | D1 reads | D1 writes | Est. cost/month |
|-------|---------------|----------|-----------|-----------------|
| 500   | 100k          | 50k      | 5k        | $5              |
| 5,000 | 1M            | 500k     | 50k       | $25             |
| 50,000| 10M           | 5M       | 500k      | $100            |

## Альтернативные tech stacks (если нужно)

### Frontend framework (если SPA нужно)

**Опции:**
- React + Vite
- Vue 3 + Vite
- Svelte/SvelteKit

**Когда переходить:** Если vanilla JS становится неуправляемым (>10 страниц)

### Backend alternatives

**Текущее:** Hono (отлично для edge)

**Альтернативы:**
- Remix (если нужен SSR)
- Next.js (если нужны advanced features)
- Astro (если content-heavy)

**Когда менять:** Вероятно, никогда - Hono идеален для этого use case

## Вопросы для обсуждения

1. **Приоритеты:** Какие фазы делать в первую очередь?
2. **Monetization:** Freemium model или municipality funding?
3. **Governance:** Board structure, decision-making
4. **Partnerships:** Какие NGOs/municipalities пилотировать?
5. **Legal:** Stiftelse или AB structure?

---

**Текущий статус:** MVP готов к деплою ✅  
**Следующий шаг:** Deploy на Cloudflare Pages и начать тестирование
