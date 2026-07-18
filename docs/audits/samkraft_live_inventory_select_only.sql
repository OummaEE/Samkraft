-- ============================================================================
-- Samkraft — инвентаризация живой БД (Wave 0A/0B)
-- Проект: sulyulmqypuzzgsbudfx
-- Дата подготовки: 2026-07-17
--
-- НАЗНАЧЕНИЕ: скрипт только читает метаданные. Он не меняет схему, данные,
-- права или настройки. Все выражения — исключительно SELECT (одна общая
-- выборка через UNION ALL).
--
-- КАК ЗАПУСКАТЬ (владелец, вручную):
--   1. Supabase Dashboard -> проект sulyulmqypuzzgsbudfx -> SQL Editor.
--   2. Новый запрос, вставить весь файл целиком.
--   3. Визуально убедиться: в файле только комментарии и один SELECT-запрос.
--   4. Запустить. Результат: ~18 строк, по одной на раздел (ord, section, data).
--   5. Экспортировать результат (JSON/CSV) и сохранить локально для аудита.
--
-- Личные данные пользователей не выбираются. Строки auth.users не читаются.
-- ============================================================================

select 1 as ord, '01_identity' as section,
       jsonb_build_object(
         'database', current_database(),
         'postgres_version', version(),
         'timezone', current_setting('TimeZone'),
         'server_encoding', current_setting('server_encoding')
       ) as data

union all

select 2, '02_extensions',
       coalesce(jsonb_agg(jsonb_build_object('name', extname, 'version', extversion) order by extname), '[]'::jsonb)
from pg_extension

union all

select 3, '03_schemas',
       coalesce(jsonb_agg(nspname order by nspname), '[]'::jsonb)
from pg_namespace
where nspname not like 'pg\_%' and nspname <> 'information_schema'

union all

select 4, '04_public_tables',
       coalesce(jsonb_agg(jsonb_build_object(
         'table', c.relname,
         'rls_enabled', c.relrowsecurity,
         'rls_forced', c.relforcerowsecurity
       ) order by c.relname), '[]'::jsonb)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all

select 5, '05_columns',
       coalesce(jsonb_agg(jsonb_build_object(
         'table', table_name,
         'column', column_name,
         'type', data_type,
         'nullable', is_nullable,
         'default', column_default
       ) order by table_name, ordinal_position), '[]'::jsonb)
from information_schema.columns
where table_schema = 'public'

union all

select 6, '06_constraints_pk_fk_unique_check',
       coalesce(jsonb_agg(jsonb_build_object(
         'table', r.relname,
         'name', con.conname,
         'contype', con.contype,
         'definition', pg_get_constraintdef(con.oid)
       ) order by r.relname, con.conname), '[]'::jsonb)
from pg_constraint con
join pg_class r on r.oid = con.conrelid
join pg_namespace n on n.oid = r.relnamespace
where n.nspname = 'public' and con.contype in ('p','f','u','c')

union all

select 7, '07_indexes',
       coalesce(jsonb_agg(jsonb_build_object(
         'table', tablename,
         'index', indexname,
         'definition', indexdef
       ) order by tablename, indexname), '[]'::jsonb)
from pg_indexes
where schemaname = 'public'

union all

select 8, '08_rls_policies',
       coalesce(jsonb_agg(jsonb_build_object(
         'schema', schemaname,
         'table', tablename,
         'policy', policyname,
         'permissive', permissive,
         'roles', to_jsonb(roles),
         'command', cmd,
         'using_expression', qual,
         'with_check_expression', with_check
       ) order by schemaname, tablename, policyname), '[]'::jsonb)
from pg_policies
where schemaname in ('public','storage')

union all

select 9, '09_table_privileges_by_role',
       coalesce(jsonb_agg(jsonb_build_object(
         'table', table_name,
         'grantee', grantee,
         'privilege', privilege_type
       ) order by table_name, grantee, privilege_type), '[]'::jsonb)
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated','service_role','PUBLIC')

union all

select 10, '10_relevant_functions_inventory',
       coalesce(jsonb_agg(jsonb_build_object(
         'schema', n.nspname,
         'name', p.proname,
         'arguments', pg_get_function_identity_arguments(p.oid),
         'returns', pg_get_function_result(p.oid),
         'volatility', case p.provolatile when 'i' then 'immutable' when 's' then 'stable' when 'v' then 'volatile' end,
         'security_mode', case when p.prosecdef then 'definer' else 'invoker' end,
         'config', to_jsonb(p.proconfig)
       ) order by n.nspname, p.proname), '[]'::jsonb)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname in ('handle_new_user','is_admin','my_role','is_project_manager','is_project_participant','check_role_engagement')

union all

select 11, '11_relevant_function_definitions',
       coalesce(jsonb_agg(jsonb_build_object(
         'schema', n.nspname,
         'name', p.proname,
         'definition', pg_get_functiondef(p.oid)
       ) order by n.nspname, p.proname), '[]'::jsonb)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname in ('handle_new_user','is_admin','my_role','is_project_manager','is_project_participant','check_role_engagement')

union all

select 12, '12_relevant_function_privileges',
       coalesce(jsonb_agg(jsonb_build_object(
         'function', routine_name,
         'grantee', grantee,
         'privilege', privilege_type
       ) order by routine_name, grantee), '[]'::jsonb)
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('handle_new_user','is_admin','my_role','is_project_manager','is_project_participant','check_role_engagement')

union all

select 13, '13_triggers_public_auth_storage',
       coalesce(jsonb_agg(jsonb_build_object(
         'schema', n.nspname,
         'table', r.relname,
         'trigger', t.tgname,
         'enabled_state', t.tgenabled,
         'function', p.proname,
         'definition', pg_get_triggerdef(t.oid)
       ) order by n.nspname, r.relname, t.tgname), '[]'::jsonb)
from pg_trigger t
join pg_class r on r.oid = t.tgrelid
join pg_namespace n on n.oid = r.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and n.nspname in ('public','auth','storage')

union all

select 14, '14_pilot_tables_existence',
       coalesce(jsonb_agg(jsonb_build_object(
         'table', v.tname,
         'exists', (to_regclass('public.' || v.tname) is not null)
       ) order by v.tname), '[]'::jsonb)
from (values
  ('users'),('projects'),('project_roles'),('project_participants'),
  ('project_tasks'),('volunteer_hours'),('certificates'),('recommendations'),
  ('reference_letters'),('activity_log'),('notifications'),('organizations'),
  ('organization_members'),('proposals'),('proposal_supports'),('consents'),
  ('municipalities'),('skills'),('user_skills'),('messages'),('project_updates'),
  ('attachments')
) as v(tname)

union all

select 15, '15_storage_buckets_metadata',
       coalesce(jsonb_agg(jsonb_build_object(
         'id', id,
         'name', name,
         'public', public,
         'file_size_limit', file_size_limit,
         'allowed_mime_types', to_jsonb(allowed_mime_types)
       ) order by name), '[]'::jsonb)
from storage.buckets

union all

select 16, '16_edge_functions_note',
       jsonb_build_object(
         'note', 'Edge Functions невозможно инвентаризировать из SQL. Их список и статус смотреть отдельно: Dashboard -> Edge Functions (read-only просмотр). Не делать выводов о них из этого скрипта.'
       )

union all

select 17, '17_auth_note',
       jsonb_build_object(
         'note', 'Строки auth.users намеренно не читаются. Настройки Auth (Site URL, redirect-URL, SMTP, провайдеры, CAPTCHA) смотреть в Dashboard -> Authentication (read-only просмотр); публичная часть уже снята через /auth/v1/settings.'
       )

order by ord;
