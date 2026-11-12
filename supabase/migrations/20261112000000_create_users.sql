-- users: perfiles vinculados 1:1 a auth.users y N:1 a daycares.
-- Referencia: 07-DB-Schema §2.
-- RLS: solo lectura propia (auth.uid() = id). Denegado por defecto para lo demás
-- hasta la spec de autenticación (SPEC 04 / login real).

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key default gen_random_uuid()
    references auth.users (id) on delete cascade,
  daycare_id uuid references public.daycares (id) on delete set null,
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users
  for select
  using (auth.uid() = id);

-- updated_at automático en todo UPDATE de users.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- Crea la fila de perfil en public.users al registrarse en auth.users.
-- Lee full_name / role / daycare_id de raw_user_meta_data. SECURITY DEFINER
-- con search_path fijo para insertar en public.users pese al RLS.
-- Metadata sucia (role o daycare_id inválidos) no aborta el signup: cae a
-- role = 'parent' y daycare_id = null.
create extension if not exists pgcrypto;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, role, daycare_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    (new.raw_user_meta_data ->> 'role')::user_role,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    -- reintentar con fallbacks seguros para que el signup nunca falle
    insert into public.users (id, full_name, role, daycare_id)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      'parent',
      null
    )
    on conflict (id) do nothing;
    return new;
end $$;

create trigger handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
