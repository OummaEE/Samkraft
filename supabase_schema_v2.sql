-- ============================================================
-- Samkraft v2 — ЧЕРНОВИК миграции (к ARCHITECTURE_V2.md, 2026-07-06)
-- НЕ применять вслепую: сначала выполнить INTROSPECTION-запрос
-- в самом низу файла на живой БД и сверить имена таблиц/колонок.
-- Предполагается: существует public.users с id = auth.users.id.
-- ============================================================

-- ---------- 0. КАНОНИЗАЦИЯ ----------

-- Профиль создаётся триггером при регистрации (надёжнее, чем из клиента)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role, municipality)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'participant'),
    new.raw_user_meta_data->>'municipality'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Объединение ролей migrant/volunteer -> participant (см. §3 архитектуры)
-- update public.users set role = 'participant' where role in ('migrant','volunteer');

-- Легаси D1 (выполнять ТОЛЬКО если колонки существуют и не используются):
-- alter table public.users drop column if exists password_hash;
-- alter table public.users drop column if exists tier;

-- ---------- 1. ОРГАНИЗАЦИИ ----------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null check (org_type in
    ('ideell_forening','kommun','foretag','politisk_org','informell_grupp')),
  org_number text,                         -- organisationsnummer (для юрлиц)
  description text,
  website_url text,
  municipality_id uuid references public.municipalities(id),
  verified boolean not null default false, -- ставит только admin
  verified_at timestamptz,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  org_role text not null default 'member' check (org_role in ('owner','manager','member')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- ---------- 2. ПРОЕКТЫ: тип и владелец-организация ----------

alter table public.projects
  add column if not exists project_kind text not null default 'ideell'
    check (project_kind in ('ideell','kommunal','civic','kommersiell')),
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists min_hours_for_letter integer not null default 20,
  add column if not exists expense_reimbursement boolean not null default false;

-- Тип роли в проекте: волонтёрская / оплачиваемая / практика
alter table public.project_roles
  add column if not exists engagement_type text not null default 'volunteer'
    check (engagement_type in ('volunteer','paid','praktik'));

-- Юридический предохранитель (§2.2, §4): в коммерческих проектах
-- волонтёрские роли запрещены; paid-роли разрешены ТОЛЬКО в kommersiell.
create or replace function public.check_role_engagement()
returns trigger language plpgsql as $$
declare kind text;
begin
  select project_kind into kind from public.projects where id = new.project_id;
  if kind = 'kommersiell' and new.engagement_type = 'volunteer' then
    raise exception 'Volunteer roles are not allowed in commercial projects (dold anstallning risk)';
  end if;
  if kind <> 'kommersiell' and new.engagement_type = 'paid' then
    raise exception 'Paid roles are only allowed in commercial projects';
  end if;
  return new;
end $$;

drop trigger if exists trg_check_role_engagement on public.project_roles;
create trigger trg_check_role_engagement
  before insert or update on public.project_roles
  for each row execute function public.check_role_engagement();

-- ---------- 3. ПРЕДЛОЖЕНИЯ В КОММУНУ (AI-конвейер, §6) ----------

alter table public.municipalities
  add column if not exists proposal_channel_url text,   -- ссылка на e-förslag/форму коммуны
  add column if not exists proposal_channel_type text
    check (proposal_channel_type in ('e_forslag','medborgarforslag','synpunkt','email',null));

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id),
  municipality_id uuid not null references public.municipalities(id),
  raw_text text not null,                  -- своими словами, любой язык
  raw_language text,                       -- BCP-47, напр. 'ru', 'ar'
  ai_title text,                           -- Rubrik
  ai_background text,                      -- Bakgrund
  ai_suggestion text,                      -- Förslag
  ai_benefit text,                         -- Förväntad nytta
  ai_committee_guess text,                 -- Berörd nämnd (гипотеза AI)
  ai_summary_translated text,              -- перевод на язык автора для проверки
  ai_model text,                           -- напр. 'claude-sonnet-5'
  status text not null default 'draft' check (status in
    ('draft','ai_formatted','user_approved','under_moderation',
     'published','submitted','answered','rejected')),
  moderation_note text,
  submitted_at timestamptz,
  answer_text text,                        -- ответ коммуны (вносится вручную)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_proposals_municipality on public.proposals(municipality_id, status);
create index if not exists idx_proposals_author on public.proposals(author_id);

create table if not exists public.proposal_supports (
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

-- ---------- 4. ДАШБОРД ПРОЕКТА (§8) ----------

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','doing','done','cancelled')),
  assignee_id uuid references public.users(id),
  due_date date,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_project on public.project_tasks(project_id, status);

create table if not exists public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Подтверждение часов (если volunteer_hours уже есть — только ALTER)
alter table public.volunteer_hours
  add column if not exists approved_by uuid references public.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists status text not null default 'pending'
    check (status in ('pending','approved','rejected'));

-- ---------- 5. РЕКОМЕНДАТЕЛЬНЫЕ ПИСЬМА (§7) ----------

create table if not exists public.reference_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  project_id uuid not null references public.projects(id),
  issuer_id uuid not null references public.users(id),      -- кто подписал
  organization_id uuid references public.organizations(id), -- от чьего имени
  hours_confirmed numeric not null,
  role_title text,
  factual_text text not null,      -- автогенерируемая фактическая часть
  personal_text text,              -- личный текст автора (человека)
  verify_hash text not null unique,
  pdf_path text,                   -- путь в приватном Storage-бакете 'letters'
  language text not null default 'sv',
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists idx_letters_user on public.reference_letters(user_id);

-- ---------- 6. УВЕДОМЛЕНИЯ И СОГЛАСИЯ ----------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,              -- 'application_accepted', 'hours_approved', ...
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null check (consent_type in
    ('registration','civic_participation','portfolio_public','ai_processing')),
  consent_version text not null,   -- версия текста согласия
  granted boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_consents_user on public.consents(user_id, consent_type);

-- ---------- 7. RLS (минимальный обязательный набор, §10) ----------
-- ВКЛЮЧИТЬ на всех таблицах; ниже — ключевые политики-шаблоны.

alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;
alter table public.proposals            enable row level security;
alter table public.proposal_supports    enable row level security;
alter table public.project_tasks        enable row level security;
alter table public.project_updates      enable row level security;
alter table public.reference_letters    enable row level security;
alter table public.notifications        enable row level security;
alter table public.consents             enable row level security;
-- + проверить, что RLS включена на users, projects, project_participants,
--   volunteer_hours, certificates, recommendations, messages, attachments!

-- Хелпер: менеджер ли текущий пользователь в проекте
create or replace function public.is_project_manager(p_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects pr
    where pr.id = p_project and (
      pr.creator_id = auth.uid()
      or exists (select 1 from public.organization_members om
                 where om.organization_id = pr.organization_id
                   and om.user_id = auth.uid()
                   and om.org_role in ('owner','manager'))
    )
  );
$$;

-- Предложения: автор видит/правит свои; опубликованные видят все
drop policy if exists proposals_owner_all on public.proposals;
create policy proposals_owner_all on public.proposals
  for all using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists proposals_public_read on public.proposals;
create policy proposals_public_read on public.proposals
  for select using (status in ('published','submitted','answered'));

-- Поддержки: видят все, ставит каждый за себя
drop policy if exists supports_read on public.proposal_supports;
create policy supports_read on public.proposal_supports for select using (true);
drop policy if exists supports_insert on public.proposal_supports;
create policy supports_insert on public.proposal_supports
  for insert with check (user_id = auth.uid());

-- Задачи: менеджеры проекта — всё; исполнитель видит и двигает свои
drop policy if exists tasks_manager_all on public.project_tasks;
create policy tasks_manager_all on public.project_tasks
  for all using (public.is_project_manager(project_id));
drop policy if exists tasks_assignee on public.project_tasks;
create policy tasks_assignee on public.project_tasks
  for select using (assignee_id = auth.uid());
drop policy if exists tasks_assignee_update on public.project_tasks;
create policy tasks_assignee_update on public.project_tasks
  for update using (assignee_id = auth.uid());

-- Письма: видят получатель и издатель; создание — только через
-- Edge Function 'issue-letter' (service role), НЕ из клиента.
drop policy if exists letters_read on public.reference_letters;
create policy letters_read on public.reference_letters
  for select using (user_id = auth.uid() or issuer_id = auth.uid());

-- Уведомления и согласия: строго свои
drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists consents_own on public.consents;
create policy consents_own on public.consents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Организации: читают все, создаёт любой залогиненный, правят owner/manager
drop policy if exists orgs_read on public.organizations;
create policy orgs_read on public.organizations for select using (true);
drop policy if exists orgs_insert on public.organizations;
create policy orgs_insert on public.organizations
  for insert with check (created_by = auth.uid());
drop policy if exists orgs_update on public.organizations;
create policy orgs_update on public.organizations
  for update using (exists (select 1 from public.organization_members om
    where om.organization_id = id and om.user_id = auth.uid()
      and om.org_role in ('owner','manager')));

-- ============================================================
-- INTROSPECTION: выполнить на живой БД ПЕРЕД применением файла,
-- результат сверить со схемой (и прислать Claude для сверки):
--
-- select table_name, column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
-- order by table_name, ordinal_position;
--
-- select tablename, rowsecurity from pg_tables where schemaname='public';
-- ============================================================
