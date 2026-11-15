-- posts + post_children: publicaciones reales del daycare (SPEC 14).
-- Referencia: 07-DB-Schema §7 y §8, con `mood` agregado al ENUM (decisión de
-- la spec: "Ánimo" no se colapsa en achievement).
-- RLS por visibilidad real: primera vez que las policies cruzan tablas. Para
-- evitar recursión infinita entre posts ↔ post_children, toda la lógica de
-- visibilidad vive en `visible_post_ids()` (SECURITY DEFINER: lee sin policies
-- y termina la cadena). Las policies solo comparan ids contra esa función.
-- Simplificación documentada (como SPEC 13): proyecto de un solo daycare.

create type public.post_type as enum
  ('meal', 'nap', 'activity', 'achievement', 'mood', 'announcement');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  -- sala destino para anuncios de "toda la sala"; nulo para posts a niños
  -- etiquetados (audiencia vía post_children).
  room_id uuid references public.rooms (id) on delete cascade,
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  primary key (post_id, child_id)
);

create index posts_published_at_idx on public.posts (published_at desc);
create index posts_room_id_idx on public.posts (room_id);
create index post_children_child_id_idx on public.post_children (child_id);

create trigger set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- is_staff: el autenticado tiene rol staff/admin en su fila de users.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('staff', 'admin')
  );
$$;

-- my_daycare_id: daycare de la fila propia de users.
create or replace function public.my_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.daycare_id from public.users u where u.id = auth.uid()
$$;

-- user_names: nombres de autor para el feed (users solo permite leer la fila
-- propia bajo RLS; esta función DEFINER expone únicamente full_name).
create or replace function public.user_names(p_ids uuid[])
returns table (id uuid, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.full_name from public.users u where u.id = any (p_ids)
$$;

-- visible_post_ids: regla de audiencia de 07-DB-Schema §8.
--   staff/admin: posts cuya sala es de su daycare, posts que etiquetan un niño
--   de su daycare, y anuncios generales sin sala (sin post_children).
--   padre: posts que etiquetan a un hijo suyo + announcement de la sala de un hijo.
-- SECURITY DEFINER: corta la recursión de policies entre posts y post_children.
create or replace function public.visible_post_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.posts p
  where
    (
      public.is_staff()
      and (
        p.room_id in (
          select r.id from public.rooms r
          where r.daycare_id = public.my_daycare_id()
        )
        or exists (
          select 1
          from public.post_children pc
          join public.children c on c.id = pc.child_id
          join public.rooms r on r.id = c.room_id
          where pc.post_id = p.id
            and r.daycare_id = public.my_daycare_id()
        )
        or (
          p.room_id is null
          and not exists (
            select 1 from public.post_children pc2 where pc2.post_id = p.id
          )
        )
      )
    )
    or (
      exists (
        select 1
        from public.post_children pc
        join public.parent_children pl on pl.child_id = pc.child_id
        where pc.post_id = p.id
          and pl.parent_id = auth.uid()
      )
      or (
        p.type = 'announcement'
        and p.room_id in (
          select c.room_id
          from public.parent_children pl
          join public.children c on c.id = pl.child_id
          where pl.parent_id = auth.uid()
        )
      )
    )
$$;

alter table public.posts enable row level security;
alter table public.post_children enable row level security;

create policy posts_select on public.posts
  for select to authenticated
  using (id in (select public.visible_post_ids()));

-- Solo staff autenticado, como autor propio. La pertenencia de niños/sala al
-- daycare la valida la Server Action (los insert de post_children corren con
-- la sesión del staff).
create policy posts_insert on public.posts
  for insert to authenticated
  with check (public.is_staff() and author_id = auth.uid());

-- Sin policies de update/delete: edición y borrado quedan fuera de SPEC 14.

create policy post_children_select on public.post_children
  for select to authenticated
  using (post_id in (select public.visible_post_ids()));

create policy post_children_insert on public.post_children
  for insert to authenticated
  with check (
    public.is_staff()
    -- solo sobre posts propios recién creados (el join interno usa la propia
    -- policy de select de posts; un post sin sala ni hijos es visible para
    -- staff, así que este check no recursa)
    and exists (
      select 1 from public.posts p
      where p.id = post_children.post_id
        and p.author_id = auth.uid()
    )
  );
