# SPEC 12 — Mantenimiento de niños con datos reales

> **Estado:** Draft
> **Depende de:** SPEC 03, SPEC 05, SPEC 10, SPEC 11 (`rooms` y `children` deben existir en la DB remota)
> **Fecha:** 2026-11-12
> **Objetivo:** Conectar `/kids` a la base de datos: listar niños reales con estado vacío, guardar el "Agregar niño" del modal existente en `public.children` vía Server Action, y mostrar el perfil del niño con datos reales en `/kids/[id]`, eliminando el mock `KIDS`.

## Why this spec exists

SPEC 05 dejó el alta de niños en estado local: al recargar, el niño desaparecía. Con SPEC 11 ya existen `rooms` y `children` (tres salas seedeadas, cero niños), esta spec reemplaza el mock de `lib/kids.ts` por lecturas y escrituras reales, respetando la fidelidad visual de las referencias.

## Scope

**In:**

- Listado de `/kids` leyendo `children` (status `active`) unidas a `rooms`, filtradas por el daycare del usuario autenticado.
- Agrupación del listado por sala: una sección por sala con niños (nombre de sala + contador), reemplazando el encabezado fijo "SALA SOLES".
- Estado vacío cuando no hay ningún niño (texto en español, estilo de la app, sugiriendo el botón "Agregar niño").
- Modal "Agregar niño" (SPEC 05): el selector de sala se carga desde `rooms` reales (default "Sala Soles"); "Guardar" invoca una Server Action que inserta en `children` y refresca el listado; al recargar la página el niño persiste.
- Validaciones del modal: nombre obligatorio, fecha de nacimiento obligatoria/válida/no futura (formato `dd/mm/aaaa` como hoy), sala obligatoria; errores inline en español; error de guardado remoto inline sin cerrar el modal.
- Perfil `/kids/[id]` (nueva ruta por uuid, reemplaza `/kids/[slug]`): nombre, edad calculada desde `birth_date`, sala, "Ingresado en" desde `enrolled_at`, alergias y notas médicas desde DB.
- "Padres vinculados" muestra `0 / sin padres vinculados` para niños reales; el modal Vincular padre (SPEC 06) sigue mock sin persistencia.
- `enrolled_at` y `photo_consent` no tienen campo en el formulario: los fija la DB (default `current_date` / `true`).
- Eliminar el mock `KIDS` de `lib/kids.ts` (tipos y formateadores sobreviven).
- Responsive y fidelidad visual: 922px y 375px vs. `ninos.dc.html`, `agregar-nino.dc.html`, `perfil-nino.dc.html`.

**Fuera de alcance:**

- Edición y archivado/eliminación de niños.
- Vinculación real de padres (`parent_children`, `invitations`).
- CRUD de salas; el feed `/` y las publicaciones siguen mock.
- Selector de alérgenos normalizado (`allergy_tags`): el input libre se guarda en `allergies`.
- Subida de foto de niño.
- Migraciones de base de datos (ya están en SPEC 11).

## Data model

No hay cambios de schema. Estructuras de aplicación:

```ts
// lib/kids.ts — tipos de vista (sin datos mock)
export type Room = { id: string; name: string };

export type Kid = {
  id: string;                    // uuid de children
  name: string;                  // full_name
  birthDate: string;             // ISO yyyy-mm-dd
  room: string;                  // nombre de la sala
  roomId: string;
  enrolledAt: string;            // ISO yyyy-mm-dd
  allergies?: string;            // texto libre
  medicalNotes?: string;
  avatarInitial: string;
  avatarTone: AvatarTone;        // determinístico por hash del uuid
};

// lib/data/children.ts — acceso a datos (solo server)
type ChildRow = { /* selección unida children + rooms */ };

export async function fetchDaycareId(supabase): Promise<string | null>;
export async function fetchRooms(supabase, daycareId): Promise<Room[]>;
export async function fetchKids(supabase, daycareId): Promise<Kid[]>;
export async function fetchKidById(supabase, daycareId, id): Promise<Kid | null>;

// actions/kids/create-child.ts
export type CreateChildResult =
  | { ok: true }
  | { ok: false; error: string }; // mensaje en español
```

Formateo en UI: `ageLabel` se calcula desde `birthDate` (ej. "3 años"); `enrolledSince` formatea `enrolledAt` (ej. "nov 2026"); `allergyChip` = primeras 2 palabras de `allergies` en mayúsculas.

## Implementation plan

1. Reescribir `lib/kids.ts`: eliminar `KIDS`/`getKidBySlug`; conservar `AvatarTone`, `AVATAR_TONES`, `ParentStatus`, `LinkedParent`; redefinir `Kid` con `id` uuid y datos crudos (fechas ISO); agregar `computeAgeLabel(birthDate)`, `formatMonthYear(isoDate)` y `toneForId(uuid)`.
2. Crear `lib/data/children.ts` con las consultas de arriba usando `createClient` de `utils/supabase/server.ts`: `fetchDaycareId` lee la fila propia de `users` (RLS lo permite); `fetchKids` filtra por salas del daycare y `status = 'active'`, ordena por `full_name`; `fetchKidById` valida que la sala pertenezca al daycare (si no, `null` → 404).
3. Crear `actions/kids/create-child.ts` (`"use server"`): `requireUser` propio del action (no confiar en el cliente), resolver `daycareId`, validar servidor (nombre no vacío, fecha parseable `dd/mm/aaaa`, no futura, sala existente del daycare), insertar en `children` con `enrolled_at = current_date` implícito y `allergies`/`medical_notes` normalizados (vacíos → `null`), `revalidatePath("/kids")` y devolver `CreateChildResult`.
4. Actualizar `app/kids/page.tsx`: tras `requireUser()`, cargar en paralelo `fetchRooms` y `fetchKids` y pasarlos como props a `KidsView` (la página ya es dinámica por `cookies()`; mantener `instant = false`).
5. Actualizar `components/kids/kids-view.tsx`: recibir `kids` y `rooms` como props; en `onSave`, invocar el action con `useTransition`, cerrar el modal solo si `ok` (el refresco llega por `revalidatePath`), y si falla pasar el error al modal. Quitar `slugify` y el estado `setKids` local.
6. Actualizar `components/kids/add-child-modal.tsx`: recibir `rooms: Room[]` y `onSave` async (estado `saving` con "Guardando…" deshabilitado) y `serverError`; poblar el `<select>` con las salas reales, default la llamada "Sala Soles" o la primera.
7. Actualizar `components/kids/kids-browser.tsx`: secciones agrupadas por sala (nombre + "N niños") usando el encabezado de sección existente; estado vacío cuando `kids.length === 0`; `key` por `kid.id`.
8. Reemplazar `app/kids/[slug]` por `app/kids/[id]/page.tsx`: Server Component con `requireUser()` + `fetchKidById`, `notFound()` si no existe, sin `generateStaticParams`, `instant = false`. Adaptar `profile-header.tsx`, `detail-rows.tsx`, `allergy-alert.tsx` y `kid-card.tsx` al nuevo `Kid` (link a `/kids/${kid.id}`, chip de alergias desde `allergies`, padres = `[]`).
9. Ejecutar `npx tsc --noEmit` y `npm run lint`; verificar con Playwright en `.playwright-mcp/`: listado vacío inicial, alta de niño persiste tras recarga y aparece en la sección de su sala, perfil muestra datos reales, modal con error de servidor muestra mensaje sin cerrarse, y capturas de `/kids`, modal y perfil a 922px y 375px comparadas con las referencias.

## Acceptance criteria

- [ ] `/kids` sin niños muestra el estado vacío en español (sin tarjetas mock; `KIDS` ya no existe en el código).
- [ ] El selector de sala del modal muestra exactamente "Sala Soles", "Sala Lunas", "Sala Estrellas" leídas de la DB, con "Sala Soles" preseleccionada.
- [ ] "Guardar" con datos válidos inserta una fila en `public.children` con `room_id` de la sala elegida, `enrolled_at` = fecha del día, `status = 'active'`, y el niño aparece en la sección de su sala sin recargar.
- [ ] Recargar `/kids` mantiene el niño creado.
- [ ] Con fecha de nacimiento en el futuro, nombre vacío o sala no seleccionada, el modal muestra el error inline en español y no guarda.
- [ ] Si la inserción falla (red/DB), el modal permanece abierto con un mensaje de error en español y el botón "Guardar" se deshabilita mientras se guarda.
- [ ] Click en la tarjeta de un niño real abre `/kids/[id]` con nombre, edad calculada ("N años"), sala, "Ingresado en" con el mes/año de alta, alergias y notas médicas coincidentes con lo cargado.
- [ ] `/kids/[id]` con uuid inexistente o de otro daycare responde 404.
- [ ] Un niño con alergias muestra el chip en la tarjeta y la alerta en el perfil; sin alergias no se muestran.
- [ ] El perfil de un niño real muestra "sin padres vinculados"; el botón Vincular padre sigue funcionando solo en memoria (sin persistencia).
- [ ] `lib/kids.ts` no exporta datos mock y ningún componente importa `KIDS` ni `getKidBySlug`.
- [ ] La ruta antigua `/kids/[slug]` ya no existe (las 8 URLs mock devuelven 404).
- [ ] `/kids` y el perfil son responsivos a 922px y 375px sin overflow horizontal, con la misma paleta/tipografía de las referencias.
- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm run lint` pasa.
- [ ] No hay migraciones ni cambios de schema en este spec.

## Decisions

- **Sí:** Server Action (`actions/kids/create-child.ts`) en lugar de Route Handler — patrón establecido en `actions/auth/logout.ts`, cero API pública propia, y la autenticación/RLS ya cubren la autorización.
- **Sí:** el action revalida y el cliente cierra el modal solo con `ok: true` — evita optimismo que mienta si la DB rechaza.
- **Sí:** ruta de detalle `/kids/[id]` con uuid — los nombres de niños reales pueden repetirse (colisión de slugs) y un slug derivado del nombre quedaría obsoleto al renombrar; se sacrifica la URL linda por unicidad. Con `id` real, `generateStaticParams` desaparece y la página es dinámica (ya usa `cookies()`).
- **Sí:** agrupar el listado por sala con sección por sala con niños — con 3 salas el encabezado único "SALA SOLES" mentiría; reutiliza el patrón visual de sección existente.
- **Sí:** validar también en el servidor (fecha, nombre, sala del daycare) — la validación del modal es UX, no seguridad.
- **No:** `enrolled_at` editable en el formulario — default `current_date` (decidido en SPEC 11).
- **No:** escribir en `allergy_tags` — el input es texto libre en español; va a `allergies`. La chip se deriva de las primeras palabras.
- **No:** edición/borrado — alcance confirmado: solo listar + alta + detalle.
- **No:** permisos por rol — las policies de SPEC 11 dejan escribir a cualquier autenticado (SPEC 10 decidió no gobernar roles todavía).
- **Degradación conocida:** los 8 niños mock y sus perfiles dejan de existir al borrar el mock; era la intención (tabla vacía por diseño).

## Risks

| Riesgo | Mitigación |
|---|---|
| `cacheComponents`/`partialPrefetching` sirve el listado viejo tras crear un niño | `revalidatePath("/kids")` al final del action; las páginas ya son dinámicas por `cookies()`/`instant = false`. Verificar con Playwright recargando tras el alta. |
| Parseo de `dd/mm/aaaa` con desfase de zona horaria al construir la fecha ISO | Convertir a `YYYY-MM-DD` con aritmética de strings (no `new Date(str)`); validar rangos contra la fecha local de hoy en el servidor. |
| El usuario autenticado no tiene `daycare_id` (perfil sin daycare) | `fetchDaycareId` devuelve `null` → el listado muestra estado vacío y el action devuelve error "No pudimos identificar tu guardería."; no revienta la página. |
| Sala borrada de la DB dejaría niños invisibles | `children` sin sala coincidente queda fuera del listado; no aplica hoy (sin UI de borrado de salas, FK RESTRICT en SPEC 11). |
| RLS abierto permite crear niños en otras salas del mismo proyecto | Único daycare seed; la verificación de que la sala pertenece al daycare del usuario ya limita el daño; endurecimiento definitivo con la spec de roles. |
| Componentes del perfil asumen `parents`/campos mock | Paso 8 adapta `profile-header`, `detail-rows`, `kid-card` explícitamente; `tsc` detecta cualquier import residual del mock. |

## What is **not** in this spec

- Editar o archivar/eliminar niños.
- Vinculación real de padres y `parent_children`.
- Administración de salas desde la UI.
- Feed, publicaciones y `/mi-cuenta` con datos reales.
- Subida de fotos de niños.
- Cambios de schema o migraciones.
