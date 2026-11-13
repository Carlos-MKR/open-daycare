-- rooms + children: salas de la guardería y niños inscritos.
-- Referencia: 07-DB-Schema §3 y §4 (con desviación documentada: columna extra
-- "allergies" de texto libre; allergy_tags queda reservado, default '{}').
-- RLS: policies abiertas a authenticated (sin autorización por rol todavía,
-- mismo criterio que SPEC 10). El filtrado por daycare se hace en la app.
-- Seed: tres salas por defecto para "Guardería Sala Soles". Sin niños.

create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete restrict,
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  allergies text,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index children_room_id_idx on public.children (room_id);
create index children_status_idx on public.children (status);

-- updated_at automático (reutiliza la función creada en SPEC 09).
create trigger set_updated_at
  before update on public.children
  for each row
  execute function public.set_updated_at();

alter table public.rooms enable row level security;
alter table public.children enable row level security;

-- Las salas son visibles para cualquier usuario autenticado.
create policy rooms_select on public.rooms
  for select to authenticated
  using (true);

create policy children_select on public.children
  for select to authenticated
  using (true);

create policy children_insert on public.children
  for insert to authenticated
  with check (true);

-- Sin policy de delete: el borrado es lógico vía status = 'archived'.
create policy children_update on public.children
  for update to authenticated
  using (true)
  with check (true);

-- Seed: exactamente tres salas para la guardería demo.
insert into public.rooms (daycare_id, name)
select d.id, s.name
from public.daycares d
cross join (values ('Sala Soles'), ('Sala Lunas'), ('Sala Estrellas')) as s(name)
where d.name = 'Guardería Sala Soles';
