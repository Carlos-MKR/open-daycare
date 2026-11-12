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
