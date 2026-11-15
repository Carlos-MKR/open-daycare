-- Fix SPEC 14: policies SELECT de posts/post_children en línea (row-local).
-- Motivo: la version original usaba `id in (select visible_post_ids())`.
-- Con INSERT ... RETURNING (Prefer: return=representation, lo que hace
-- supabase-js con .select().single()), Postgres filtra las filas devueltas
-- contra la policy SELECT dentro del snapshot del propio comando, donde la
-- fila recien insertada aun no es visible para el scan de posts() de la
-- funcion: todo insert con RETURNING fallaba con 42501.
-- Nueva formulacion: solo columnas de la fila actual + subconsultas a otras
-- tablas (post_children, parent_children, children, rooms). Sin recursión
-- posts <-> post_children y sin enumerar posts dentro de su propia policy.
-- visible_post_ids se elimina; la visibilidad efectiva es la misma regla:
--   staff: su daycare (room o niños etiquetados) + posts sin sala (anuncios
--     generales y posts a niños antes de etiquetar);
--   padre: posts que etiquetan a un hijo suyo + announcement de la sala de un hijo.
-- Simplificación conocida (igual que la migración anterior): daycare único.

drop policy posts_select on public.posts;
drop policy post_children_select on public.post_children;
drop function public.visible_post_ids();

create policy posts_select on public.posts
  for select to authenticated
  using (
    (
      public.is_staff()
      and (
        posts.room_id in (
          select r.id from public.rooms r
          where r.daycare_id = public.my_daycare_id()
        )
        or posts.room_id is null
        or exists (
          select 1
          from public.post_children pc
          join public.children c on c.id = pc.child_id
          join public.rooms r on r.id = c.room_id
          where pc.post_id = posts.id
            and r.daycare_id = public.my_daycare_id()
        )
      )
    )
    or (
      exists (
        select 1
        from public.post_children pc
        join public.parent_children pl on pl.child_id = pc.child_id
        where pc.post_id = posts.id
          and pl.parent_id = auth.uid()
      )
      or (
        posts.type = 'announcement'
        and posts.room_id in (
          select c.room_id
          from public.parent_children pl
          join public.children c on c.id = pl.child_id
          where pl.parent_id = auth.uid()
        )
      )
    )
  );

-- Las etiquetas son visibles para el staff y para los padres de cada niño
-- etiquetado; nunca referencian posts, así que no hay ciclo con la policy
-- de arriba.
create policy post_children_select on public.post_children
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.parent_children pl
      where pl.child_id = post_children.child_id
        and pl.parent_id = auth.uid()
    )
  );
