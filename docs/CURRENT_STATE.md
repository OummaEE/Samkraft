# Samkraft — CURRENT STATE (verified)

## 1. Document status

- **Проект:** Samkraft
- **Дата верификации:** 2026-07-17
- **Supabase ref:** `sulyulmqypuzzgsbudfx`
- **Production URL:** https://samkraft.pages.dev
- **Источник доказательств:** owner-run SELECT-only инвентаризация живой БД
  (`docs/audits/samkraft_live_inventory_select_only.sql`, результат —
  `docs/audits/live_inventory_result_2026-07-17.csv`), плюс публичные
  anon-уровня проверки Supabase и production-фронтенда (Wave 0A).

Документ разделяет три типа утверждений:

- **FACT (проверено)** — получено из owner-run инвентаризации или прямого
  публичного наблюдения.
- **INTERPRETATION** — вывод из фактов, не наблюдавшийся напрямую.
- **UNKNOWN** — не проверено в этой волне.

Runtime-поведение (реальный signup, подтверждение email, выдача документов)
**не наблюдалось**. Наличие объекта в БД не означает, что пользовательский путь
работает.

---

## 2. Current source-of-truth hierarchy

Порядок приоритета при конфликте (сверху — авторитетнее):

1. **Живая инвентаризация Supabase** — источник правды по схеме БД, RLS,
   функциям, триггерам и метаданным Storage.
2. **Текущий production-бандл** (`index-BeUcdpBE.js`) — источник правды по
   поведению задеплоенного фронтенда.
3. **Локальное грязное рабочее дерево** — по маркерам ближе всего к production,
   но **ещё не сверено** формально; точное равенство production и локального
   кода не доказано.
4. **GitHub `origin/main`** (`65ef9d3`) — устарел и **небезопасен для деплоя**
   без сверки (см. Wave 0A: расходится и с локальным деревом, и с production).
5. **SQL-файлы репозитория** — смесь legacy и черновиков, **не авторитетны
   автоматически** (см. §13).

---

## 3. Verified live database summary (FACT)

- PostgreSQL **17.6**
- Timezone **UTC**, кодировка UTF8
- **21** public-таблица
- **203** колонки
- **91** constraint (PK/FK/UNIQUE/CHECK)
- **55** индексов
- **53** RLS-политики
- **6** целевых функций-хелперов
- **11** триггеров (public/auth/storage)
- **RLS включена на всех 21 public-таблицах**; `rls_forced = false` везде
- **3** Storage-бакета
- Расширения: pgcrypto, uuid-ossp, supabase_vault, pg_stat_statements, plpgsql

---

## 4. Application tables (FACT — все существуют вживую)

```
users                 projects              project_roles
project_participants  project_tasks         volunteer_hours
certificates          recommendations       reference_letters
activity_log          notifications         organizations
organization_members  proposals             proposal_supports
consents              municipalities        skills
user_skills           messages              project_updates
```

- `attachments` — **НЕ таблица БД**.
- `attachments` — **Storage-бакет** (см. §8).

---

## 5. Critical field contracts (FACT)

### users
- `id uuid` PK, **FK → auth.users(id) ON DELETE CASCADE**
- `role text` NOT NULL, default `volunteer`, CHECK ∈
  {participant, migrant, volunteer, mentor, municipality_admin, pending_admin, admin}
- `full_name text` NOT NULL default `''`
- `municipality text` (nullable)
- `username text` UNIQUE
- `email text` UNIQUE
- `profile_visibility text` NOT NULL default `members`, CHECK ∈ {public, members, private}

### projects
- **Поле владельца — `creator_id`** (FK → users). Колонки `created_by_id`
  в живой БД **нет** (она существует только в TypeScript-типе).
- `project_kind text` NOT NULL default `ideell`, CHECK ∈
  {ideell, kommunal, civic, kommersiell}
- `status text` NOT NULL default `draft`, CHECK ∈
  {draft, pending_review, in_development, active, completed, archived}
- `visibility text` NOT NULL default `public`, CHECK ∈
  {public, municipality_only, private}
- `min_hours_for_letter int` NOT NULL default `20`
- `current_participants int` NOT NULL default `0`; также `mentor_id`,
  `organization_id`, `municipality_id`, `expense_reimbursement` bool.

### project_roles
- `engagement_type text` NOT NULL default `volunteer`, CHECK ∈
  {volunteer, paid, praktik}
- Enforcement volunteer/paid — триггером `check_role_engagement` (см. §6, §7).
- `positions_available`, `positions_filled`, `responsibilities`.

### project_participants
- **UNIQUE(project_id, user_id)** — защита от дублей заявок на уровне БД.
- `status text` NOT NULL default `pending`, CHECK ∈
  {pending, accepted, active, completed, rejected, withdrawn}
- **`role_id` отсутствует** → текущая заявка привязана к **проекту**, а не к
  конкретной открытой роли (`role` — свободный текст).
- `application_text`, `hours_completed`, `accepted_at`, `completed_at`.

### volunteer_hours
- `status text` NOT NULL default `pending`, CHECK ∈ {pending, approved, rejected}
- `approved_by uuid` FK → users, `approved_at timestamptz` — поля подтверждения
  менеджером.
- CHECK: `0 < hours <= 24`.

### certificates и reference_letters
- **certificates:** `issuer_id`, `certificate_hash` UNIQUE (default случайный),
  `revoked_at` (поддержка отзыва), `hours_contributed`.
- **reference_letters:** `issuer_id` NOT NULL, `verify_hash` UNIQUE,
  `factual_text` NOT NULL, `personal_text`, `pdf_path` (приватный бакет `letters`),
  `language` default `sv`, `revoked_at`.

---

## 6. Verified functions and triggers (FACT)

Все функции имеют `SET search_path = public` (защита от search_path-хайджека).

### handle_new_user
- **SECURITY DEFINER**, LANGUAGE plpgsql.
- Триггер `on_auth_user_created` **AFTER INSERT ON auth.users**, включён.
- Создаёт строку в `public.users` (id, email, full_name, role, municipality, username).
- Default роль — `volunteer` (из `raw_user_meta_data->>'role'`, иначе volunteer).
- **Auto-admin:** для email `evgeniya.leonidovna@gmail.com` и `oumma.ee@gmail.com`
  роль принудительно `admin`. Это **зафиксированная существующая деталь
  реализации, а не рекомендованный дизайн** — hardcoded email в триггере.
- `on conflict (id) do nothing`.
- **Caveat:** `on conflict` покрывает только `id`; `username` и `email` имеют
  UNIQUE. Теоретическая коллизия сгенерированного `username`
  (`prefix_<4hex>`) вызвала бы исключение и провал signup. Вероятность крайне мала.
- **Статус (важно):** живая БД содержит включённый триггер INSERT на
  `auth.users` и SECURITY DEFINER-функцию `handle_new_user`, предназначенную
  создавать `public.users`. Структурный фундамент БД **проверен**
  (функция существует; триггер существует и включён; `public.users` ссылается
  на `auth.users`; функция вставляет ожидаемые поля профиля). Сквозной
  **runtime signup остаётся непроверенным** — заявлять его надёжность до
  реального теста нельзя.

### is_admin() → boolean
- STABLE **SECURITY DEFINER**. Возвращает true, если `auth.uid()` имеет role=admin.

### my_role() → text
- STABLE **SECURITY DEFINER**. Возвращает role текущего пользователя.

### is_project_manager(uuid) → boolean
- STABLE **SECURITY DEFINER**. True для creator / mentor / org owner|manager / admin.

### is_project_participant(uuid) → boolean
- STABLE **SECURITY DEFINER**. True для участника со статусом accepted/active/completed.

### check_role_engagement()
- **SECURITY INVOKER**, триггер `trg_check_role_engagement` на `project_roles`,
  включён. Enforcement легальной матрицы (см. §7).

EXECUTE на is_admin/my_role/is_project_manager/is_project_participant выдан
`authenticated`; handle_new_user/check_role_engagement — только postgres/service_role.

---

## 7. Verified technical legal enforcement (FACT — только технические факты)

- Волонтёрская роль (`engagement_type='volunteer'`) в проекте
  `project_kind='kommersiell'` — **блокируется триггером** (raise exception).
- Оплачиваемая роль (`paid`) в **не-kommersiell** проекте — **блокируется
  триггером**.
- `praktik` — **не ограничен** типом проекта (разрешён в любом).
- Соответствие «скрытому найму» (dold anställning) БД **не гарантирует** —
  ловится только разделение volunteer/paid на уровне ролей.
- Выдача `certificates` и `reference_letters` требует, чтобы issuer был
  project-менеджером — по RLS (`issuer_id = auth.uid() AND is_project_manager`).
- **Это не юридическое заключение о соответствии**, только описание технического
  enforcement. Триггер срабатывает лишь на вставке/обновлении `project_roles`.

---

## 8. Current Storage state (FACT)

| Bucket | Public | Upload | file_size_limit | allowed_mime_types |
|---|---|---|---|---|
| attachments | public | authenticated (RLS) | **не задан** | **не задан** |
| avatars | public | authenticated (RLS) | **не задан** | **не задан** |
| letters | private | — | **не задан** | **не задан** |

- `letters` читается только владельцем (`owner = auth.uid()`), что соответствует
  модели приватных signed-URL для PDF писем.
- Отсутствие лимитов размера и MIME на всех бакетах — см. backlog §12.

---

## 9. Verified Auth and production behavior (FACT)

Из публичного `/auth/v1/settings` и браузерной проверки production:

- Email-регистрация **включена** (`email: true`, `disable_signup: false`).
- **Подтверждение email обязательно** (`mailer_autoconfirm: false`).
- **Google-провайдер выключен** (`google: false`).
- **Кнопка «Fortsätt med Google» видна в production** (/register и /login) —
  при выключенном провайдере приведёт к ошибке.
- Маршрут `/auth/callback` в деплое **отсутствует**.
- UI сброса пароля **отсутствует**.
- `municipalities`: **290** строк (полный список коммун Швеции).
- `skills`: **12** строк (включая Translation, Election Information).
- На момент проверки анониму **не видно ни одного проекта** (0 anon-видимых
  строк во всех пользовательских таблицах; «пусто» и «скрыто RLS» этим способом
  неразличимы).
- **Реальный runtime signup не проверялся** (аккаунты не создавались).

---

## 10. Pilot journey status

Легенда: DB = состояние БД, FE = состояние фронтенда, RT = runtime.

| Шаг | DB | FE | RT |
|---|---|---|---|
| signup | READY | présent (путь есть) | UNVERIFIED |
| email confirmation | READY (Confirm ON) | MISSING (нет callback/redirect) | UNVERIFIED |
| profile | READY (триггер создаёт users) | présent (mapRole-баг) | UNVERIFIED |
| project (create+publish) | READY | PARTIAL (нет UI модерации/смены статуса у мигранта) | UNVERIFIED |
| open role | READY (project_roles + enforcement) | **MISSING** (таблица не используется) | UNVERIFIED |
| application | READY (RLS + UNIQUE) | PARTIAL (заявка на проект, без role_id) | UNVERIFIED |
| manager decision | READY (RLS update менеджером) | **MISSING** (нет UI accept/reject) | UNVERIFIED |
| tasks | READY (project_tasks + RLS) | **MISSING** | UNVERIFIED |
| verified contribution | READY (volunteer_hours + approve) | **MISSING** (logVolunteerHours мёртв) | UNVERIFIED |
| certificate/reference letter | READY (RLS issue менеджером) | **MISSING** (выдачи нет) | UNVERIFIED |

**Вывод (INTERPRETATION):** БД готова почти на всю глубину пилота; основной
незакрытый объём — фронтенд задней половины пути.

---

## 11. Critical blockers

1. **Расхождение GitHub / локального дерева / production** — три разошедшиеся
   версии кода; `git push` может откатить production.
2. **Email-confirmation путь во фронтенде неполон** (нет `/auth/callback`,
   нет `emailRedirectTo`) при включённом Confirm email.
3. **Кнопка Google в UI при выключенном Google-провайдере** — гарантированная
   пользовательская ошибка.
4. **Политика `projects_read` (USING true)** раскрывает все строки projects
   независимо от `status` и `visibility` (черновики/приватные видны анониму).
5. **`users_select` (USING true)** — любой залогиненный читает всех
   пользователей, включая `email`.
6. **Глубина бэкенда значительно превышает реализацию фронтенда** (§10).
7. **Live runtime signup ещё не тестировался.**

---

## 12. Known non-blocking backlog

- Storage: нет лимитов размера и ограничения MIME на всех бакетах.
- Фронтенд `mapRole` коэрсит participant/pending_admin → volunteer.
- TypeScript-тип использует `created_by_id`, в БД поле `creator_id`.
- Заявка (`project_participants`) не содержит `role_id`.
- `praktik` не ограничен типом проекта (правила неполны).
- `organization_members` select-политика содержит тавтологию
  `me.organization_id = me.organization_id`.
- `handle_new_user`: edge-case UNIQUE-коллизии username/email.
- Legacy anon-ключ по-прежнему запечён в production-бандле.
- SQL-файлы репозитория конфликтуют с живым состоянием (§13).

---

## 13. Repository object classification

| Объект | Классификация |
|---|---|
| Живая инвентаризация Supabase (`live_inventory_result_2026-07-17.csv`) | **LIVE AUTHORITATIVE** |
| `docs/CURRENT_STATE.md` (этот файл) | **VERIFIED SNAPSHOT** (на 2026-07-17) |
| `supabase_schema_v2.sql` | **DRAFT** (сам помечен черновиком; ссылается на несуществующую таблицу `attachments`) |
| `supabase_schema.sql` | **LEGACY** (Postgres с `password_hash`, без auth.users-связи) |
| `migrations/0001_initial_schema.sql` | **LEGACY** (Cloudflare D1 / SQLite) |
| `seed.sql` | **LEGACY/DRAFT** (справочные данные; расходятся с живыми 290 коммунами) |

Схемные файлы **не удаляются, не переписываются и не переименовываются** в этой волне.

---

## 14. Unknowns

- Список и статус Edge Functions (в т.ч. `ai-format-proposal`).
- Site URL и allowlist redirect-URL в Auth.
- SMTP-провайдер (Resend) и фактическая доставляемость писем.
- Конфигурация нативной CAPTCHA в Supabase.
- Регион БД.
- Реальные сохранившиеся счётчики пользователей/данных после паузы-восстановления.
- Реальный runtime: signup, подтверждение email, выдача документов.
- Cloudflare deployment-метаданные (id/дата/метод), полный список env vars.

---

## 15. Next-wave boundary

- **Wave 0B завершается после создания этой документации.**
- **Wave 0C должна быть отдельной волной сверки Git** (GitHub / локальное дерево /
  production).
- **Никакая продуктовая реализация не начинается до завершения Wave 0C.**
- **Фиксы безопасности** (OVERPERMISSIVE-политики, Storage-лимиты, Google-кнопка)
  выделяются в отдельный scope **после** сверки.
- **Wave 1 этим документом не начинается.**
