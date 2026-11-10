-- MIS TAREAS v118 · FAMILIA COMPARTIDA SIN LOGIN
create extension if not exists pgcrypto;
create table if not exists public.shared_families_v118 (
  id uuid primary key default gen_random_uuid(), family_code text not null unique,
  family_name text not null default 'Mi familia', payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.shared_families_v118 enable row level security;
revoke all on public.shared_families_v118 from anon, authenticated;
create or replace function public.create_shared_family_v118(p_code text,p_name text,p_payload jsonb)
returns table(family_name text,family_revision bigint) language plpgsql security definer set search_path=public as $$
declare v_code text := upper(regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g'));
begin
 if length(v_code)<6 then raise exception 'invalid family code'; end if;
 insert into public.shared_families_v118(family_code,family_name,payload) values(v_code,coalesce(nullif(trim(p_name),''),'Mi familia'),coalesce(p_payload,'{}'::jsonb));
 return query select f.family_name,f.revision from public.shared_families_v118 f where f.family_code=v_code;
end; $$;
create or replace function public.get_shared_family_v118(p_code text)
returns table(family_name text,family_payload jsonb,family_revision bigint) language sql security definer set search_path=public as $$
 select f.family_name,f.payload,f.revision from public.shared_families_v118 f where f.family_code=upper(regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g')) limit 1; $$;
create or replace function public.update_shared_family_v118(p_code text,p_expected_revision bigint,p_payload jsonb)
returns table(ok boolean,new_revision bigint) language plpgsql security definer set search_path=public as $$
declare v_code text := upper(regexp_replace(coalesce(p_code,''),'[^A-Z0-9]','','g')); v_revision bigint;
begin
 update public.shared_families_v118 set payload=coalesce(p_payload,'{}'::jsonb),revision=revision+1,updated_at=now() where family_code=v_code and revision=p_expected_revision returning revision into v_revision;
 if v_revision is null then return query select false,coalesce((select revision from public.shared_families_v118 where family_code=v_code),0); else return query select true,v_revision; end if;
end; $$;
revoke all on function public.create_shared_family_v118(text,text,jsonb) from public;
revoke all on function public.get_shared_family_v118(text) from public;
revoke all on function public.update_shared_family_v118(text,bigint,jsonb) from public;
grant execute on function public.create_shared_family_v118(text,text,jsonb) to anon, authenticated;
grant execute on function public.get_shared_family_v118(text) to anon, authenticated;
grant execute on function public.update_shared_family_v118(text,bigint,jsonb) to anon, authenticated;
