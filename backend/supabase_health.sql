create table if not exists public.health_link_codes (
  user_id uuid primary key references auth.users on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.health_imports (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  steps numeric,
  active_kcal numeric,
  basal_kcal numeric,
  weight numeric,
  received_at timestamptz not null default now(),
  primary key (user_id, day)
);

grant select, insert, update, delete on public.health_link_codes to authenticated;
grant select on public.health_imports to authenticated;
revoke all on public.health_link_codes from anon;
revoke all on public.health_imports from anon;

alter table public.health_link_codes enable row level security;
alter table public.health_imports enable row level security;

drop policy if exists "health_codes_own" on public.health_link_codes;
create policy "health_codes_own" on public.health_link_codes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "health_imports_select" on public.health_imports;
create policy "health_imports_select" on public.health_imports
  for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.to_num_or_null(p text)
returns numeric
language sql
immutable
as $$
  select nullif(substring(replace(coalesce(p, ''), ',', '') from '[0-9]+(?:[.][0-9]+)?'), '')::numeric;
$$;

create or replace function public.import_health(
  p_code text,
  p_steps text default null,
  p_active_kcal text default null,
  p_basal_kcal text default null,
  p_weight text default null,
  p_day text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_day date;
  v_steps numeric := public.to_num_or_null(p_steps);
  v_active numeric := public.to_num_or_null(p_active_kcal);
  v_basal numeric := public.to_num_or_null(p_basal_kcal);
  v_weight numeric := public.to_num_or_null(p_weight);
begin
  select user_id into v_user from public.health_link_codes where code = trim(coalesce(p_code, ''));
  if v_user is null then
    raise exception 'invalid code';
  end if;
  begin
    v_day := coalesce(nullif(trim(coalesce(p_day, '')), '')::date, (now() at time zone 'Asia/Tokyo')::date);
  exception when others then
    v_day := (now() at time zone 'Asia/Tokyo')::date;
  end;
  if v_steps is not null and (v_steps < 0 or v_steps > 200000) then v_steps := null; end if;
  if v_active is not null and (v_active < 0 or v_active > 10000) then v_active := null; end if;
  if v_basal is not null and (v_basal < 0 or v_basal > 10000) then v_basal := null; end if;
  if v_weight is not null and (v_weight < 20 or v_weight > 300) then v_weight := null; end if;
  insert into public.health_imports (user_id, day, steps, active_kcal, basal_kcal, weight, received_at)
  values (v_user, v_day, v_steps, v_active, v_basal, v_weight, now())
  on conflict (user_id, day) do update set
    steps = coalesce(excluded.steps, public.health_imports.steps),
    active_kcal = coalesce(excluded.active_kcal, public.health_imports.active_kcal),
    basal_kcal = coalesce(excluded.basal_kcal, public.health_imports.basal_kcal),
    weight = coalesce(excluded.weight, public.health_imports.weight),
    received_at = now();
  return 'ok';
end;
$$;

revoke all on function public.import_health(text, text, text, text, text, text) from public;
grant execute on function public.import_health(text, text, text, text, text, text) to anon, authenticated;
