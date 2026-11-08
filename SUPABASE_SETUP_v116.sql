-- Mis Tareas v116 · Supabase
-- Ejecuta este archivo completo UNA VEZ en Supabase > SQL Editor.
-- No pongas nunca una service_role key dentro de la web.

create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi familia',
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent')),
  joined_at timestamptz not null default now(),
  primary key (family_id,user_id)
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

revoke all on public.families from anon;
revoke all on public.family_members from anon;
grant select,insert,update,delete on public.families to authenticated;
grant select,insert,update,delete on public.family_members to authenticated;

drop policy if exists "families_select_members" on public.families;
create policy "families_select_members"
on public.families for select to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.family_members fm
    where fm.family_id = families.id
      and fm.user_id = (select auth.uid())
  )
);

drop policy if exists "families_insert_owner" on public.families;
create policy "families_insert_owner"
on public.families for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "families_update_members" on public.families;
create policy "families_update_members"
on public.families for update to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.family_members fm
    where fm.family_id = families.id
      and fm.user_id = (select auth.uid())
  )
)
with check (
  owner_id = (select owner_id from public.families f2 where f2.id = families.id)
);

drop policy if exists "families_delete_owner" on public.families;
create policy "families_delete_owner"
on public.families for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "members_select_self" on public.family_members;
create policy "members_select_self"
on public.family_members for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "members_insert_owner_self" on public.family_members;
create policy "members_insert_owner_self"
on public.family_members for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.families f
    where f.id = family_members.family_id
      and f.owner_id = (select auth.uid())
  )
);

drop policy if exists "members_delete_self" on public.family_members;
create policy "members_delete_self"
on public.family_members for delete to authenticated
using (user_id = (select auth.uid()));

create or replace function public.join_family(p_code text)
returns table(family_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select f.id into v_family
  from public.families f
  where upper(f.invite_code) = upper(trim(p_code))
  limit 1;

  if v_family is null then
    raise exception 'invalid invite code';
  end if;

  insert into public.family_members(family_id,user_id,role)
  values(v_family,auth.uid(),'parent')
  on conflict (family_id,user_id) do nothing;

  return query select v_family;
end;
$$;

revoke all on function public.join_family(text) from public, anon;
grant execute on function public.join_family(text) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='families'
  ) then
    execute 'alter publication supabase_realtime add table public.families';
  end if;
end $$;
