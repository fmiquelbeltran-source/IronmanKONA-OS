-- Ejecutar en SQL Editor de un proyecto Supabase propio.
-- Solo cada usuario autenticado podrá leer/escribir su propia copia de Kona OS.
create table if not exists public.kona_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.kona_profiles enable row level security;
create policy "kona_select_own" on public.kona_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "kona_insert_own" on public.kona_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "kona_update_own" on public.kona_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "kona_delete_own" on public.kona_profiles for delete to authenticated using ((select auth.uid()) = user_id);
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.kona_profiles to authenticated;
-- Nunca crear políticas TO anon para esta tabla.
