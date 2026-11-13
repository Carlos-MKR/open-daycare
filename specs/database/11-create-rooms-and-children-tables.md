# SPEC 11 — Tablas rooms + children + salas por defecto

> **Estado:** Implementado
> **Depende de:** SPEC 08 (`daycares` con seed "Guardería Sala Soles"), SPEC 09 (`users` y su RLS como patrón)
> **Fecha:** 2026-11-12
> **Objetivo:** Crear las tablas `public.rooms` y `public.children` con el ENUM `child_status`, sus policies RLS y el seed de tres salas por defecto (incluida "Sala Soles"), sin sembrar ningún niño, mediante una migración SQL versionada aplicada al proyecto remoto `rsquxsqzjffagtidrgkp`.

## Why this spec exists

El mantenimiento de niños (SPEC 12) necesita dónde persistir. `rooms` y `children` son el par de tablas que convierte `/kids` de mock a datos reales. El seed de las tres salas deja la app usable desde el primer login sin pantalla de administración de salas, y la ausencia de seed de niños obliga a que la UI maneje el estado vacío desde el inicio.

## Scope

**In:**

- ENUM `public.child_status` (`active` / `archived`).
- Tabla `public.rooms` según referencia §3: `id`, `daycare_id` (FK → `daycares`), `name`, `created_at`.
- Tabla `public.children` según referencia §4: `id`, `room_id` (FK → `rooms`), `full_name`, `birth_date`, `enrolled_at`, `allergies` (columna extra, ver Decisiones), `medical_notes`, `allergy_tags`, `photo_consent`, `status`, `created_at` / `updated_at`.
- Trigger `set_updated_at` reutilizando la función de SPEC 09 sobre `children`.
- Índices en `rooms(daycare_id)` y `children(room_id)` + `children(status)`.
- RLS habilitado en ambas tablas con policies (ver sección RLS).
- Seed de exactamente tres salas para "Guardería Sala Soles": `"Sala Soles"`, `"Sala Lunas"`, `"Sala Estrellas"`.
- Sin seed de niños.
- Aplicar con `apply_migration` y verificar vía MCP.

**Fuera de alcance:**

- `parent_children`, `invitations` y sus ENUMs (`relationship_type`, `invitation_status`) — salen con la spec de vinculación de padres real.
- CRUD de salas (la UI solo lee; las salas se administran por seed/migraciones por ahora).
- Edición, borrado lógico o archivo de niños desde la UI (SPEC 12 solo lista y crea).
- Normalización de `allergy_tags` a tabla `allergies`.
- Cualquier cambio en `app/`, `components/` o `lib/` (es SPEC 12).

## Data model

```sql
create type public.child_status as enum ('active', 'archived');
```

Tabla `public.rooms`:

| Columna | Tipo | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | NOT NULL, FK → `daycares(id)` ON DELETE CASCADE |
| `name` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |

Tabla `public.children`:

| Columna | Tipo | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `room_id` | `uuid` | NOT NULL, FK → `rooms(id)` ON DELETE RESTRICT |
| `full_name` | `text` | NOT NULL |
| `birth_date` | `date` | NOT NULL |
| `enrolled_at` | `date` | NOT NULL, default `current_date` |
| `allergies` | `text` | Nullable — texto libre en español (desviación de la referencia, ver Decisiones) |
| `medical_notes` | `text` | Nullable |
| `allergy_tags` | `text[]` | NOT NULL, default `'{}'` — reservado para el futuro selector de alérgenos normalizado |
| `photo_consent` | `boolean` | NOT NULL, default `true` |
| `status` | `child_status` | NOT NULL, default `'active'` |
| `created_at` / `updated_at` | `timestamptz` | NOT NULL, default `now()` |

Seed (idempotente):

```sql
insert into public.rooms (daycare_id, name)
select d.id, s.name
from public.daycares d
cross join (values ('Sala Soles'), ('Sala Lunas'), ('Sala Estrellas')) as s(name)
where d.name = 'Guardería Sala Soles';
```

`rooms` no declara UNIQUE (`daycare_id`, `name`) en esta spec. No hay UI de creación de salas, así que la colisión no es alcanzable por el usuario; el seed corre una sola vez dentro de la migración.

## RLS

- `rooms`: habilitar RLS; única policy `rooms_select` — `TO authenticated USING (true)`. Las salas son visibles para cualquier usuario autenticado (no hay datos sensibles y el escaneo por daycare se hace en la query).
- `children`: habilitar RLS; policies:
  - `children_select` — `TO authenticated USING (true)`.
  - `children_insert` — `TO authenticated WITH CHECK (true)`.
  - `children_update` — `TO authenticated USING (true) WITH CHECK (true)` (deja listo el archivado futuro sin abrir DELETE).
- Sin policy de DELETE: el borrado es lógico vía `status = 'archived'`.
- Coherente con la decisión de SPEC 10 "sin autorización por rol todavía". El filtrado por daycare se aplica en la capa de datos de la app (SPEC 12); la política abierta se documenta como limitación temporal en Risks.

## Implementation plan

1. Crear `supabase/migrations/20261112120000_create_rooms_and_children.sql` con: ENUM, `rooms`, `children`, índices, trigger `set_updated_at` sobre `children`, RLS + policies, y el seed de las tres salas.
2. Aplicar al proyecto remoto `rsquxsqzjffagtidrgkp` con `apply_migration`, `name = 20261112120000_create_rooms_and_children`.
3. Verificar vía MCP: tablas y columnas con tipos/defaults correctos, ENUM con dos valores, RLS activo con las policies listadas, exactamente 3 filas en `rooms` vinculadas al daycare "Guardería Sala Soles", 0 filas en `children`, migración registrada en `list_migrations`.

## Acceptance criteria

- [x] El archivo `supabase/migrations/20261112120000_create_rooms_and_children.sql` existe y es la única fuente del cambio (no se ejecutó DDL suelto fuera de `apply_migration`).
- [x] `child_status` existe con valores `active` y `archived`.
- [x] `rooms` y `children` tienen las columnas, tipos, defaults y FKs de la tabla Data model.
- [x] `children.updated_at` se actualiza automáticamente en un UPDATE de prueba.
- [x] Índices presentes: `rooms(daycare_id)`, `children(room_id)`, `children(status)`.
- [x] RLS habilitado en ambas tablas; `rooms` solo con SELECT para `authenticated`; `children` con SELECT/INSERT/UPDATE para `authenticated` y sin DELETE.
- [x] `rooms` contiene exactamente "Sala Soles", "Sala Lunas" y "Sala Estrellas", todas con el `daycare_id` de "Guardería Sala Soles".
- [x] `children` está vacía tras la migración.
- [x] La migración figura en el historial del proyecto remoto con el mismo nombre que el archivo.

## Decisions

- **Sí:** dos specs separadas (esta DB + SPEC 12 UI) — convención del repo (specs de base de datos viven en `specs/database/`).
- **Sí:** tres salas por defecto "Sala Soles", "Sala Lunas" y "Sala Estrellas" — confirmadas por el usuario; el nombre se guarda completo ("Sala Soles"), no solo "Soles" como sugería el ejemplo de la referencia.
- **Sí:** columna extra `allergies text` de texto libre además de `allergy_tags text[]` — el modal actual captura alergias como texto libre en español y `allergy_tags` exige un selector normalizado en inglés que todavía no existe. `allergy_tags` queda reservado (default `'{}'`) para la spec de alérgenos. Desviación explícita de la referencia §4, documentada aquí.
- **Sí:** `enrolled_at` con default `current_date` en la columna y sin campo en el formulario — el alta se registra el día del alta.
- **Sí:** policies RLS abiertas a `authenticated` sin check de rol — mismo criterio que SPEC 10; evita una función helper SECURITY DEFINER para leer el rol y su recursión con la policy propia de `users`.
- **No:** UNIQUE (`daycare_id`, `name`) en `rooms` — no hay UI de creación de salas; agregable sin riesgo en una spec futura.
- **No:** seed de niños — el usuario pidió empezar con la tabla vacía; la UI debe soportar estado vacío.
- **No:** policy DELETE en `children` — el modelo prevé borrado lógico (`archived`).

## Risks

| Riesgo | Mitigación |
|---|---|
| RLS abierto: cualquier usuario autenticado puede leer/crear niños de cualquier daycare (hoy hay un solo daycare y un solo usuario demo) | Documentado como limitación temporal; la spec de autorización por rol/multi-daycare agrega el filtro por `daycare_id`. El seed es un solo daycare, nada que filtrar hoy. |
| `allergies` duplica semántica con `allergy_tags` y puede confundir a futuras specs | Esta spec deja explícito cuál usa la UI (SPEC 12 escribe `allergies`); la spec de alérgenos decidirá migrar o fusionar. |
| `rooms(daycare_id)` ON DELETE CASCADE borraría salas y `children` quedaría referenciado | FK `children.room_id` es ON DELETE RESTRICT: no se puede borrar una sala con niños; y `daycares` no tiene UI de borrado. |

## What is **not** in this spec

- `parent_children`, `invitations`, `posts` y demás tablas del esquema.
- Pantallas, componentes o queries de la app (SPEC 12).
- Administración de salas (crear/renombrar/borrar desde UI).
- Selector de alérgenos normalizado (`allergy_tags`).
- Archivado de niños desde la UI.
