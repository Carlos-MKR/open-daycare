# SPEC 08 — Tabla daycares

> **Estado:** Implementado.
> **Depende de:** — (primera spec de base de datos)
> **Fecha:** 2026-11-11
> **Objetivo:** Crear la tabla raíz `daycares` en Supabase mediante una migración SQL versionada en el repo, aplicada al proyecto remoto `rsquxsqzjffagtidrgkp` vía MCP.

## Why this spec exists

Las specs 01–07 son frontend con datos mock. Esta es la primera pieza de persistencia del proyecto y establece el **patrón de migraciones** que todas las tablas futuras seguirán: archivo SQL en `supabase/migrations/` + aplicación al proyecto remoto con `apply_migration` del MCP de Supabase.

## Scope

**In:**

- Crear la estructura de carpetas `supabase/migrations/` en el repo.
- Migración `20261111000000_create_daycares.sql` que crea `public.daycares` con `id uuid PK default gen_random_uuid()`, `name text NOT NULL`, `address text NOT NULL`, `created_at timestamptz NOT NULL default now()`.
- Activar RLS sobre `daycares` sin crear policies (acceso público denegado por defecto).
- Seed de cuatro guarderías: `"Guardería Sala Soles"` más tres adicionales con direcciones ficticias.
- Aplicar la migración al proyecto remoto vía MCP (`apply_migration` con el mismo nombre de versión que el archivo del repo).
- Verificar vía MCP: columnas/tipos/defaults correctos, RLS activo, fila seed presente, migración registrada en el historial.

**Fuera de alcance:**

- Las demás tablas del esquema (`users`, `rooms`, `children`, etc.) — cada una en su propia spec.
- ENUMs (ningún enum es necesario para `daycares`).
- Policies de RLS (dependen de `users.daycare_id`; se escriben con la spec de `users`).
- Cliente `supabase-js` en Next.js, `lib/`, tipos, o cualquier cambio en `app/`.
- CRUD de guarderías ni pantalla de administración.
- Instalación de Docker / CLI de Supabase para stack local.

## Data model

Tabla `public.daycares` (estricto a `07-DB-Schema/opendaycare-database-schema.md` §1):

| Columna | Tipo | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `address` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

La migración además: `ALTER TABLE public.daycares ENABLE ROW LEVEL SECURITY;` y el seed:

```sql
insert into public.daycares (name, address) values
  ('Guardería Sala Soles', 'Barrio Tournón, San José'),
  ('Guardería Pequeños Pasos', 'Escazún, San José'),
  ('Guardería Los Pollitos', 'Curridenad, San José'),
  ('Guardería Arcoíris', 'Heredia');
```

> `address` no figura en la referencia `07-DB-Schema` §1 — se agrega por decisión explícita del usuario (ver Decisions).

## Implementation plan

1. Crear `supabase/migrations/20261111000000_create_daycares.sql` con el `CREATE TABLE` (id, name, address, created_at), el `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` y el `INSERT` seed de las cuatro guarderías. Comentario en español al inicio indicando que es la entidad raíz del esquema.
2. Verificar el SQL contra la referencia `07-DB-Schema` §1 (nombres de columna, tipos, defaults exactos), salvo `address` que es adición acordada.
3. Aplicar al proyecto remoto con `apply_migration` del MCP, versión `20261111000000_create_daycares` (igual al nombre del archivo, para que una futura migración con CLI no la reaplique).
4. Verificar con `run_sql`/`get_table` vía MCP: tabla existe, 4 columnas con tipos y defaults correctos, `relrowsecurity = true`, 0 policies, exactamente 4 filas seed.
5. Confirmar con `list_migrations` que la migración aparece en el historial del proyecto.

## Acceptance criteria

- [x] `supabase/migrations/20261111000000_create_daycares.sql` existe en el repo con el contenido del plan paso 1. — Evidencia: archivo creado en `supabase/migrations/`.
- [x] La tabla `public.daycares` existe en `rsquxsqzjffagtidrgkp` con exactamente `id` (uuid PK, default `gen_random_uuid()`), `name` (text NOT NULL), `address` (text NOT NULL), `created_at` (timestamptz NOT NULL default now()). — Evidencia: `execute_sql` contra `information_schema.columns` devolvió las 4 columnas con tipos y defaults exactos.
- [x] RLS está habilitado en `daycares` y no existe ninguna policy. — Evidencia: `pg_class.relrowsecurity = true`, conteo de policies en `pg_policies` = 0.
- [x] Existen exactamente cuatro filas seed, incluyendo una con `name = 'Guardería Sala Soles'`, cada una con `address` no nulo. — Evidencia: query sobre `public.daycares` retornó Sala Soles, Pequeños Pasos, Los Pollitos y Arcoíris, todas con `address` presente.
- [x] La migración figura en el historial de migraciones del proyecto remoto con versión `20261111000000_create_daycares`. — Evidencia: `list_migrations` mostró el nombre registrado.
- [x] No hay policies en `pg_policies` para `daycares` (deny-by-default efectivo sobre la anon key). — Evidencia: misma consulta del criterio anterior (`policy_count = 0`).

## Decisions

- **Sí:** SQL versionado en `supabase/migrations/` + `apply_migration` vía MCP — sin Docker ni CLI instalados, es el único flujo reproducible hoy; deja historial en el repo.
- **No:** `supabase db push` local — requiere CLI y setup adicional.
- **Sí:** schema estricto a la referencia (sin `updated_at`) — `daycares` es una entidad casi estática; la convención general es un piso, la tabla concreta la acota.
- **Sí:** RLS activo sin policies — deny-by-default es el estado seguro; una tabla legible por la anon key sería un riesgo antes de tener `users`.
- **Sí:** columna `address text NOT NULL` — el usuario la pide explícitamente aunque no figure en `07-DB-Schema` §1; la referencia queda desactualizada para esta tabla.
- **No:** `address` nullable — no hay caso de guardería sin dirección y el seed cubre todas las filas.
- **Sí:** seed "Guardería Sala Soles" en la migración — la app mock necesita un `daycare_id` fijo para demos de clase.
- **Sí:** cuatro guarderías en el seed — el usuario quiere más de una fila para demostrar multi-tenant; nombres y direcciones ficticios editables en el SQL sin afectar el schema.
- **No:** seed aparte en `seed.sql` — sin CLI no hay consumidor de ese archivo.
- **Sí:** mismo nombre de versión en archivo y en `apply_migration` — mantiene compatible un futuro `supabase db push` (reconoce la migración como ya aplicada).

## Risks

| Riesgo | Mitigación |
|---|---|
| Historial MCP y repo divergen si alguien aplica cambios directos en la DB | Usar siempre el patrón de esta spec: archivo SQL primero, luego `apply_migration` con la misma versión. |
| Futuro `supabase db push` reaplica o choca con la migración | Nomenclatura de versión idéntica (`20261111000000_create_daycares`); CLI la marca como existente al comparar. |
| RLS sin policies bloquea también lecturas futuras esperadas por el staff | Es intencional; las policies se agregan con la spec de `users`, cuando exista `daycare_id` para filtrar. |

## What is **not** in this spec

- Tablas `users`, `rooms`, `children` y demás del esquema.
- Policies de RLS.
- Cliente Supabase en Next.js, tipos, `lib/`, cambios en `app/`.
- CRUD o UI de guarderías.
- Stack local (Docker + CLI).
