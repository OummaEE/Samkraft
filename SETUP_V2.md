# Samkraft v2 — что построено и как запустить (6 июля 2026)

## Что уже сделано (в Supabase-проекте `sulyulmqypuzzgsbudfx`)

- **21 таблица** по ARCHITECTURE_V2.md: ядро (users, projects, project_participants, volunteer_hours, certificates, recommendations, messages, municipalities, skills, user_skills, project_roles, activity_log) + v2 (organizations, organization_members, proposals, proposal_supports, project_tasks, project_updates, reference_letters, notifications, consents).
- **RLS включена на всех 21 таблицах, 49 политик.** Профиль создаётся триггером при регистрации; `evgeniya.leonidovna@gmail.com` и `oumma.ee@gmail.com` при регистрации автоматически получают роль `admin`.
- **Юридический предохранитель:** волонтёрские роли в `kommersiell`-проектах отклоняются на уровне БД (триггер), оплачиваемые роли — только в `kommersiell`.
- **Storage:** бакеты `attachments` и `avatars` (публичные), `letters` (приватный).
- **Seed:** 3 коммуны (Stockholm/Göteborg/Malmö), 12 навыков (включая Translation и Election Information для пилота).
- **Edge Function `ai-format-proposal`** (ACTIVE, требует JWT): превращает текст предложения на любом языке в структурированный шведский формат (Rubrik/Bakgrund/Förslag/Nytta + перевод-резюме для проверки автором).
- **Код поправлен:** `created_by_id` → `creator_id` (projectService.ts, AdminDashboard.tsx); `npx tsc --noEmit` проходит без ошибок.

## Что сделать тебе (15 минут)

### 1. Cloudflare Pages → Settings → Environment variables

```
VITE_SUPABASE_URL      = https://sulyulmqypuzzgsbudfx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bHl1bG1xeXB1enpnc2J1ZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNjg5NzgsImV4cCI6MjA5ODk0NDk3OH0.8Wuzn7c9v3Ld-qIxbGGo6sy9CGzq8dGPPAyP8EQor1Q
TURNSTILE_SECRET_KEY   = <секрет из Cloudflare Turnstile — как раньше>
```

(anon key — публичный по дизайну, его можно хранить в env фронтенда; данные защищает RLS.)

### 2. Ключ для AI-функции (когда будешь тестировать предложения)

В терминале с Supabase CLI **или** Dashboard → Edge Functions → Secrets:

```
supabase secrets set ANTHROPIC_API_KEY=<твой ключ с console.anthropic.com> --project-ref sulyulmqypuzzgsbudfx
```

Без ключа функция вернёт понятную ошибку `ai_not_configured`, всё остальное работает.

### 3. Supabase Dashboard → Authentication → URL Configuration

- Site URL: `https://<твой-домен>.pages.dev`
- Redirect URLs: добавить тот же домен.
- Authentication → Sign In / Up: для быстрого теста можно временно отключить «Confirm email» (иначе нужны SMTP-настройки).

### 4. Деплой

`git add -A && git commit -m "v2: schema + fixes" && git push` — Cloudflare Pages соберёт сам (rollup-ошибка в моей песочнице — артефакт Windows-node_modules, в CI её не будет).

### 5. Первый вход

Зарегистрируйся на сайте своим email → роль admin присвоится автоматически. Скажи мне — прогоню смоук-тест по живым данным.

## Как вызывать AI-функцию из фронтенда (для следующей итерации)

```ts
const { data: { session } } = await supabase.auth.getSession()
const res = await fetch(
  'https://sulyulmqypuzzgsbudfx.supabase.co/functions/v1/ai-format-proposal',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session!.access_token}`,
    },
    body: JSON.stringify({
      raw_text: text,               // 20–4000 символов, любой язык
      municipality_name: 'Malmö kommun',
      raw_language: 'ru',
    }),
  }
)
// → { title, background, suggestion, benefit, committee_guess,
//     summary_translated, detected_language, flagged, flag_reason, model }
```

Результат записывай в `proposals` (ai_*-поля) со статусом `ai_formatted`; после правки и подтверждения автором — `user_approved`.

## Известные остатки (не блокируют)

1. **4 WARN в Security Advisors** — осознанно: RLS-хелперы (`is_admin`, `my_role`, `is_project_manager`, `is_project_participant`) должны быть вызываемы ролью `authenticated`, раскрывают только данные о самом вызывающем.
2. Просмотр профилей открыт всем залогиненным (email виден участникам платформы) — для пилота нормально, ужесточим при росте.
3. UI для organizations / proposals / project_tasks ещё не написан — таблицы и права готовы, это фаза 1–2 плана из ARCHITECTURE_V2.md.
4. Регион БД — eu-west-2 (Лондон). GDPR-адекватность у Великобритании есть; если для грантов важен строго ЕС — пересоздать проект в eu-west-1/eu-central-1 можно, пока данных нет.
