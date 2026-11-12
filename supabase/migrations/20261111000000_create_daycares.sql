-- daycares: entidad raíz del esquema OpenDayCare.
-- Referencia: 07-DB-Schema §1 + columna `address` (adición acordada, SPEC 08).
-- RLS se activa sin policies: acceso denegado por defecto hasta la spec de `users`.

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Barrio Tournón, San José'),
  ('Guardería Pequeños Pasos', 'Escazún, San José'),
  ('Guardería Los Pollitos', 'Curridenad, San José'),
  ('Guardería Arcoíris', 'Heredia');
