-- KONA OS 2030 — tablas privadas. Ejecutar una sola vez en Supabase SQL Editor.
create table if not exists public.kona_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.kona_profiles enable row level security;

create table if not exists public.kona_activities (
 user_id uuid not null references auth.users(id) on delete cascade,
 source_id text not null,
 recorded_at date not null,
 payload jsonb not null,
 ingested_at timestamptz not null default now(),
 primary key (user_id, source_id),
 constraint kona_source_id_length check (length(source_id) between 1 and 160)
);
create index if not exists kona_activities_user_date_idx on public.kona_activities(user_id, recorded_at desc);
alter table public.kona_activities enable row level security;

-- Permisos de la Data API y RLS para cuentas individuales
revoke all on public.kona_profiles from anon;
revoke all on public.kona_activities from anon;
grant select, insert, update on public.kona_profiles to authenticated;
grant select, insert, update on public.kona_activities to authenticated;

drop policy if exists kona_profiles_read_self on public.kona_profiles;
create policy kona_profiles_read_self on public.kona_profiles for select to authenticated
 using (user_id = (select auth.uid()));
drop policy if exists kona_profiles_insert_self on public.kona_profiles;
create policy kona_profiles_insert_self on public.kona_profiles for insert to authenticated
 with check (user_id = (select auth.uid()));
drop policy if exists kona_profiles_update_self on public.kona_profiles;
create policy kona_profiles_update_self on public.kona_profiles for update to authenticated
 using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists kona_activities_read_self on public.kona_activities;
create policy kona_activities_read_self on public.kona_activities for select to authenticated
 using (user_id = (select auth.uid()));
drop policy if exists kona_activities_insert_self on public.kona_activities;
create policy kona_activities_insert_self on public.kona_activities for insert to authenticated
 with check (user_id = (select auth.uid()));
drop policy if exists kona_activities_update_self on public.kona_activities;
create policy kona_activities_update_self on public.kona_activities for update to authenticated
 using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- v8: recuperación desde Salud Conectada / Google Health; nunca pública.
create table if not exists public.kona_wellness (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 primary key (user_id, day)
);
alter table public.kona_wellness enable row level security;
revoke all on public.kona_wellness from anon;
grant select, insert, update, delete on public.kona_wellness to authenticated;
drop policy if exists kona_wellness_select_self on public.kona_wellness;
create policy kona_wellness_select_self on public.kona_wellness for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists kona_wellness_insert_self on public.kona_wellness;
create policy kona_wellness_insert_self on public.kona_wellness for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists kona_wellness_update_self on public.kona_wellness;
create policy kona_wellness_update_self on public.kona_wellness for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists kona_wellness_delete_self on public.kona_wellness;
create policy kona_wellness_delete_self on public.kona_wellness for delete to authenticated using (user_id = (select auth.uid()));
