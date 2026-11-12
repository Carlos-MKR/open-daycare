# SPEC 09 — Tabla users + ENUMs + usuario staff de prueba

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (`daycares` debe existir en la DB remota para la FK y el seed)
> **Fecha:** 2026-11-12
> **Objetivo:** Crear la tabla `public.users` con sus ENUMs (`user_role`, `user_status`) en Supabase mediante una migración SQL versionada, incluyendo trigger de creación de perfil desde `auth.users`, policy RLS de lectura propia y un seed de usuario staff (`caro@opendaycare.com`) vinculado a "Guardería Sala Soles" para probar.

## Why this spec exists

Segunda pieza de persistencia tras SPEC 08. `users` es la tabla que sostiene la autenticación: se vincula N:1 con `daycares` (un usuario tiene un daycare, un daycare tiene muchos usuarios) y 1:1 con Supabase Auth. La SPEC 08 postergó las policies de RLS para esta spec, y se necesita un usuario staff real para probar el futuro login real.

## Scope

**In:**

- ENUMs `user_role` (`staff`/`parent`/`admin`) y `user_status` (`pending`/`active`).
- Tabla `public.users` según referencia §2: `id` (PK, FK → `auth.users` ON DELETE CASCADE), `daycare_id` (FK → `daycares`, nullable), `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`/`updated_at`.
- Función `public.set_updated_at()` + trigger para `users.updated_at`.
- Función `public.handle_new_user()` (SECURITY DEFINER) + trigger `AFTER INSERT` en `auth.users` que crea la fila de perfil desde `raw_user_meta_data` (`full_name`, `role`, `daycare_id`).
- RLS habilitado en `users` con única policy de SELECT: `auth.uid() = id`.
- Seed vía SQL: insert en `auth.users` (contraseña bcrypt con pgcrypto, email confirmado) con metadata para que el trigger genere el perfil staff.
- Aplicar con `apply_migration` al proyecto `rsquxsqzjffagtidrgkp` y verificar vía MCP.

**Fuera de alcance:**

- Los otros cuatro ENUMs del esquema (`relationship_type`, `invitation_status`, `post_type`, `child_status`) — con las tablas que los consumen.
- Tablas `rooms`, `children`, etc.
- Usuarios admin (el enum los admite, sin seed).
- Cliente `supabase-js` en Next.js, login real, reemplazo del mock de `/login` (SPEC 04).
- Policies de escritura de usuario o lectura por staff (salen cuando exista autenticación real con rol en sesión).

## Data model

ENUMs (valores en inglés, convención de idioma de la referencia):

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');
```

Tabla `public.users` (referencia `07-DB-Schema` §2):

| Columna | Tipo | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()`, FK → `auth.users(id)` ON DELETE CASCADE |
| `daycare_id` | `uuid` | FK → `daycares(id)` ON DELETE SET NULL, nullable |
| `role` | `user_role` | NOT NULL |
| `status` | `user_status` | NOT NULL, default `'active'` |
| `full_name` | `text` | NOT NULL |
| `avatar_url` | `text` | Nullable |
| `notify_on_post` | `boolean` | NOT NULL, default `true` |
| `daily_summary_enabled` | `boolean` | NOT NULL, default `true` |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, default `now()` |

Trigger `updated_at`:

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();
```

Trigger de perfil `handle_new_user` (SECURITY DEFINER, `set search_path = public`): lee `raw_user_meta_data` → `full_name`, `role`, `daycare_id`; inserta en `public.users` con `on conflict (id) do nothing`; si `role`/`daycare_id` traen valores inválidos, cae a fallback `role = 'parent'` / `daycare_id = null` en bloque `exception`, de modo que un signup nunca falle por metadata sucia.

Seed (un solo insert en `auth.users`; el trigger crea el perfil — prueba la misma ruta que usará el signup real):

```sql
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  confirmation_sent_at, is_sso_user
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), 'authenticated', 'authenticated', 'caro@opendaycare.com',
  crypt('daycare123', gen_salt('bf')), now(),
  jsonb_build_object(
    'full_name', 'Caro',
    'role', 'staff',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(), now(), now(), false
);
```

Resultado esperado en `public.users`: una fila `full_name = 'Caro'`, `role = 'staff'`, `status = 'active'`, `daycare_id` = id de "Guardería Sala Soles".

## Implementation plan

1. Crear `supabase/migrations/20261112000000_create_users.sql`: ENUMs, `CREATE TABLE public.users` con columnas/tipos/defaults exactos de la referencia §2, `ENABLE ROW LEVEL SECURITY` y la policy de SELECT propio.
2. En el mismo archivo: `create extension if not exists pgcrypto;`, función `set_updated_at()` + trigger; función `handle_new_user()` + trigger `AFTER INSERT ON auth.users`.
3. En el mismo archivo: seed del usuario staff con el `insert into auth.users` de arriba (comentario en español indicando que es usuario de demo).
4. Aplicar con `apply_migration` del MCP, versión `20261112000000_create_users` (igual al nombre del archivo).
5. Verificar con `execute_sql`: los 2 ENUMs con valores exactos (`pg_type`/`pg_enum`); las 9 columnas con tipos/defaults (incluidos `notify_on_post` y `daily_summary_enabled`); FKs `id → auth.users` (CASCADE) y `daycare_id → daycares` (SET NULL); `relrowsecurity = true` y exactamente 1 policy; ambos triggers existentes; la fila staff en `public.users` con `daycare_id` de Sala Soles; `encrypted_password = crypt('daycare123', encrypted_password)`.
6. Confirmar con `list_migrations` que la migración figura en el historial.

## Acceptance criteria

- [ ] `supabase/migrations/20261112000000_create_users.sql` existe en el repo con ENUMs + tabla + triggers + RLS + seed.
- [ ] Existen los ENUMs `public.user_role` ('staff','parent','admin') y `public.user_status` ('pending','active') con valores y orden exactos.
- [ ] `public.users` existe con las 9 columnas de la tabla anterior (tipos, defaults y nullability exactos), con FK `id → auth.users(id)` ON DELETE CASCADE y FK `daycare_id → daycares(id)` ON DELETE SET NULL.
- [ ] RLS está habilitado en `users` con exactamente una policy que habilita `SELECT` cuando `auth.uid() = id`; no existen policies de INSERT/UPDATE/DELETE.
- [ ] Existe un trigger `AFTER INSERT` en `auth.users` que crea la fila en `public.users` desde `raw_user_meta_data`; metadata con `role` o `daycare_id` inválidos no aborta el signup (fallback `parent`/`null`).
- [ ] Existe exactamente una fila en `public.users` con `role = 'staff'`, `full_name = 'Caro'`, `status = 'active'` y `daycare_id` apuntando a "Guardería Sala Soles".
- [ ] La fila de `auth.users` para `caro@opendaycare.com` existe con `email_confirmed_at` no nulo y `encrypted_password = crypt('daycare123', encrypted_password)` (hash bcrypt válido para GoTrue).
- [ ] `updated_at` de `public.users` se actualiza automáticamente en un UPDATE (trigger `set_updated_at` activo).
- [ ] La migración figura en el historial del proyecto remoto con versión `20261112000000_create_users`.
- [ ] No hay cambios en `app/` ni `lib/` (spec solo de base de datos).

## Decisions

- **Sí:** solo los 2 ENUMs de `users` — cada spec crea lo que su tabla necesita; los demás van con `rooms`/`children`/`posts`/`invitations`.
- **Sí:** seed directo en `auth.users` vía SQL con pgcrypto — no hay CLI ni Admin API accesibles desde el MCP; queda versionado y reproducible. Para producción se usará el flujo de signup/admin API en la spec de autenticación.
- **Sí:** el seed pasa por `raw_user_meta_data` + trigger, no un insert manual en `public.users` — ejercita la misma ruta que usará el signup real y valida el contrato de metadata.
- **Sí:** credenciales `caro@opendaycare.com` / `daycare123`, rol `staff`, daycare "Guardería Sala Soles" — coincide con el mock actual de `/login` (SPEC 04).
- **Sí:** `daycare_id` nullable con `ON DELETE SET NULL` — la referencia no lo marca NOT NULL (puede existir un usuario sin daycare asignado, ej. admin de plataforma); borrar un daycare no borra usuarios.
- **Sí:** trigger `handle_new_user` en esta spec — la nota de implementación de la referencia §2 lo define como el mecanismo Supabase de esta tabla.
- **Sí:** RLS con solo SELECT propio — sin sesión real no hay forma de probar más; deny-by-default para el resto hasta la spec de autenticación.
- **No:** usuario `admin` en el seed — no se usa todavía; el enum lo admite para cuando haga falta.
- **No:** columnas `email`/`password_hash` en `public.users` — `auth.users` ya las gestiona (referencia §2).
- **No:** policies para que staff lea padres — depende de tener rol en la sesión (JWT claims), fuera de alcance.

## Risks

| Riesgo | Mitigación |
|---|---|
| Insert directo en `auth.users` es patrón no soportado; GoTrue podría cambiar su schema | El seed solo toca columnas core estables; en producción se usará Admin API/signup con la spec de autenticación. |
| El trigger `handle_new_user` podría bloquear signups si falla | `SECURITY DEFINER` con `search_path` fijo, bloque `exception` con fallback (`parent`/`null`) y `on conflict (id) do nothing`. |
| Metadata de signup en manos del cliente: un usuario podría pedir `role = 'admin'` en `raw_user_meta_data` | Aceptable mientras no haya signup público (login es mock); la spec de autenticación real debe validar/forzar el rol en el server. Queda documentado aquí como deuda. |
| Hash bcrypt de pgcrypto incompatible con GoTrue | `crypt(..., gen_salt('bf'))` genera `$2a$`, el formato que GoTrue valida; el criterio 7 lo comprueba en la DB. |
| Historial MCP y repo divergen | Mismo patrón de SPEC 08: archivo SQL primero, `apply_migration` con idéntica versión. |

## What is **not** in this spec

- ENUMs y tablas de los demás dominios (`rooms`, `children`, `invitations`, `posts`, `reactions`, `comments`, `daily_summaries`).
- Autenticación real en Next.js (`supabase-js`, sesiones, cookies, reemplazo del mock de `/login`).
- Policies de escritura o lectura multi-rol en `users`.
- UI de administración de usuarios.
