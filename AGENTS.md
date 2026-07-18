# AGENT.md — Samkraft

> Канонический источник: [CLAUDE.md](./CLAUDE.md). Этот файл — короткий operational contract для агентов, которые автоматически читают `AGENT.md` или `AGENTS.md`.

## Проект

Samkraft — шведская civic-tech платформа. Один участник предлагает общественно полезный проект, другие подают заявки и помогают его реализовать, а шведские менторы и координаторы обеспечивают поддержку, качество и соответствие правилам. Подтверждённое участие может завершаться сертификатом или рекомендательным письмом. Отдельный модуль помогает жителям структурировать предложения в коммуну с помощью AI и обязательного human review.

Прод: `https://samkraft.pages.dev`  
UI: шведский  
Документация и отчёты владельцу: русский

## Текущий приоритет

Не строить всю платформу сразу. Сначала довести сквозной пилот:

`signup → project → role application → manager decision → tasks → verified contribution → certificate/reference`

Всё остальное — backlog, если не является блокером безопасности или пилота.

## Режим работы

Перед действиями объявить один режим:

- `READ-ONLY`
- `PLAN-ONLY`
- `IMPLEMENT`
- `TEST`
- `DEPLOY`

Также указать scope, out-of-scope, критерии готовности и затрагиваемые системы.

Без явного разрешения нельзя менять production, БД, Auth, Cloudflare, SMTP, cron, webhooks или отправку сообщений.

## Стек

React 18 + Vite + TypeScript · Supabase/Postgres/Auth/Storage/Edge Functions · Cloudflare Pages · Turnstile · Resend.

Supabase ref: `sulyulmqypuzzgsbudfx`  
Cloudflare project: `samkraft`

## Обязательные правила

1. Одна сессия — одна цель. Не смешивать аудит, архитектуру, реализацию и deploy.
2. Не исправлять найденные попутно задачи. Записывать их в backlog.
3. Поле владельца проекта в БД — `creator_id`, не `created_by_id`.
4. Новая пользовательская таблица всегда получает RLS и негативные тесты доступа.
5. Профиль создаёт trigger `handle_new_user`; клиентский upsert после signup запрещён.
6. Волонтёрство допустимо только для `ideell`, `kommunal`, `civic`; в `kommersiell` — `paid`/`praktik`.
7. Не хранить personnummer, партийность или статус миграционного дела без отдельного правового основания.
8. AI не отправляет предложения в коммуну и не принимает решения. Human confirmation обязателен.
9. Сертификаты и рекомендации выдаются только после подтверждения ответственным человеком.
10. Перед push проверить Cloudflare `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
11. Секреты не печатать и не коммитить.
12. Успешный build не равен успешному продукту: проверять полный пользовательский путь.

## Команды

```bash
npm install --include=dev
npx tsc --noEmit
npm run build
git diff --check
git status --short
```

Запускать доступные тесты и обязательно фиксировать их фактический результат.

## Deploy gate

Перед deploy должны быть:

- проверенный diff;
- зелёные types/build/tests;
- проверенные env variables;
- RLS/security review для DDL;
- rollback plan;
- production smoke-test plan.

Deploy не считается завершённым без smoke-test.

## Финальный отчёт

Каждая сессия заканчивается разделами:

- Scope
- Изменения
- Проверки
- Production impact
- Риски/неизвестное
- Backlog
- Следующий безопасный шаг
## Least Privilege Rule

If the current session is READ-ONLY:

- never request write OAuth scopes;
- never request admin scopes;
- prefer public inspection first;
- prefer owner-executed SELECT statements over elevated API access;
- if only write-capable access exists, stop and explain why instead of requesting it.