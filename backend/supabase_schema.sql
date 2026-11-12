create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  participant_code text,
  role text not null default 'participant' check (role in ('participant', 'admin')),
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_records (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null,
  data jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.profiles enable row level security;
alter table public.user_records enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, participant_code, consent_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'participant_code',
    nullif(new.raw_user_meta_data ->> 'consent_at', '')::timestamptz
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (display_name, participant_code, consent_at) on public.profiles to authenticated;

drop policy if exists "records_select" on public.user_records;
create policy "records_select" on public.user_records
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "records_insert_own" on public.user_records;
create policy "records_insert_own" on public.user_records
  for insert with check (user_id = auth.uid());

drop policy if exists "records_update_own" on public.user_records;
create policy "records_update_own" on public.user_records
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "records_delete_own" on public.user_records;
create policy "records_delete_own" on public.user_records
  for delete using (user_id = auth.uid());
