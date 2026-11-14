-- invitations + parent_children: puente del onboarding de familias (SPEC 13).
-- Referencia: 07-DB-Schema §5 y §6.
-- RLS: estilo SPEC 11 — abierta a authenticated; el chequeo de rol staff se hace
-- en la Server Action (degradado conocido, ver Risks de la spec).
-- parent_children no tiene policy de insert: solo la escribe accept_invitation.
-- Funciones SECURITY DEFINER (patrón handle_new_user de SPEC 09): permiten
-- validar/aceptar invitaciones sin sesión (validate_invitation) o antes de que
-- el padre tenga permisos propios (accept_invitation). Son llamadas por RPC con
-- la anon key, por eso devuelven solo los datos mínimos de la invitación.

create type public.relationship_type as enum ('mother', 'father', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  invited_by uuid not null references public.users (id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_child_id_status_idx on public.invitations (child_id, status);
create index invitations_email_idx on public.invitations (email);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_children_child_id_idx on public.parent_children (child_id);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- Staff autenticado: leer y gestionar invitaciones (el rol se verifica en la app).
create policy invitations_select on public.invitations
  for select to authenticated
  using (true);

create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (true);

create policy invitations_update on public.invitations
  for update to authenticated
  using (true)
  with check (true);

-- El vínculo padre↔niño es legible por autenticados (staff lo muestra en el
-- perfil del niño; el padre en /familia). Sin delete por ahora: revocar vínculos
-- queda fuera del alcance de SPEC 13.
create policy parent_children_select on public.parent_children
  for select to authenticated
  using (true);

-- validate_invitation: datos mínimos de una invitación por código, con
-- expiración perezosa (pending vencida -> expired antes de responder).
-- Devuelve null si el código no existe.
create or replace function public.validate_invitation(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  update public.invitations
  set status = 'expired'
  where code = p_code
    and status = 'pending'
    and expires_at < now();

  select jsonb_build_object(
    'status', i.status,
    'full_name', i.full_name,
    'email', i.email,
    'relationship', i.relationship,
    'child_id', c.id,
    'child_name', c.full_name,
    'room_name', r.name,
    'expires_at', i.expires_at
  )
  into result
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = p_code;

  return result;
end $$;

-- accept_invitation: consume un código pendiente a nombre del usuario autenticado.
-- Todo o nada: si la fila ya no está pending (o el email no coincide o venció),
-- no inserta el vínculo. devolvemos false en ese caso (doble activación, race).
create or replace function public.accept_invitation(p_code text, p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where code = p_code
    and status = 'pending'
    and expires_at >= now()
    and lower(email) = lower(p_email)
  returning *
  into inv;

  if inv.id is null then
    return false;
  end if;

  -- on conflict: reactivación de un padre ya vinculado al mismo niño no duplica.
  insert into public.parent_children (parent_id, child_id, relationship)
  values (uid, inv.child_id, inv.relationship)
  on conflict (parent_id, child_id) do nothing;

  return true;
end $$;
