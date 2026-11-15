-- Fix 2 SPEC 14: post_children_insert sin referencia a posts.
-- Motivo: el check existia sobre posts, cuya policy SELECT vuelve a
-- referenciar post_children (rama de niños etiquetados), y Postgres detecta
-- reentrada de policies por la cadena post_children -> posts -> post_children
-- ("infinite recursion detected in policy for relation post_children").
-- La policy queda como is_staff() solamente: la autoria del post la exige
-- posts_insert y la pertenencia de los niños al daycare la valida la Server
-- Action (SPEC 14, paso 4), igual que en las simplificaciones de SPEC 11/13.

drop policy post_children_insert on public.post_children;

create policy post_children_insert on public.post_children
  for insert to authenticated
  with check (public.is_staff());
