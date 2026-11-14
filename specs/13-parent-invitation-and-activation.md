# SPEC 13 — Vinculación de padre con invitación real y registro por código

> **Estado:** Aprobado
> **Depende de:** SPEC 06 (modal vincular padre), SPEC 10 (auth real), SPEC 11 (rooms/children), SPEC 12 (perfiles reales)
> **Fecha:** 2026-11-14
> **Objetivo:** Hacer real el flujo completo "Vincular padre": guardar la invitación en la DB, enviarla por correo con Resend desde Next.js, y permitir que el padre registre su cuenta y active el vínculo usando el código del enlace.

## Why this spec exists

El modal de SPEC 06 y la activación de SPEC 04 son mocks: el código es fijo (`7K4P9`), nada persiste y `/activar-cuenta` no crea cuentas. El esquema de referencia (`07-DB-Schema` §5–§6) ya define `invitations` y `parent_children` como puente del onboarding de familias. Esta spec conecta ambos extremos del flujo. Por decisión del usuario se especifica como una sola spec (definición rápida sin división en dos), cubriendo DB, correo y registro.

## Scope

**In:**

- Migración con ENUMs `relationship_type` (`mother`/`father`/`guardian`) e `invitation_status` (`pending`/`accepted`/`expired`/`cancelled`), tablas `invitations` y `parent_children` según `07-DB-Schema`, con RLS en el estilo de SPEC 11 (escritura solo staff autenticado) y tres funciones `SECURITY DEFINER`: `validate_invitation`, `accept_invitation` y expiración perezosa.
- Modal "Vincular padre" (SPEC 06): "Enviar invitación" invoca una Server Action real que valida, genera código único de 5 caracteres, guarda la invitación `pending` con `expires_at = now() + 7 días` y envía el correo con Resend (SDK `resend` en el servidor de Next.js).
- Correo HTML simple con link de activación `${NEXT_PUBLIC_SITE_URL}/activar-cuenta?code=XXXXX` y el código visible; remitente `onboarding@resend.dev` configurable por env.
- Reutilización de invitación pendiente para el mismo (`child_id`, `email`): no duplica código; un envío fallido deja la invitación `pending` y el reintento reenvía el mismo código.
- Panel "Padres vinculados" de `/kids/[id]` con datos reales: invitados `pending` (chip PENDIENTE), vencida (chip EXPIRADA) y padres aceptados vía `parent_children` (chip ACTIVO); persiste tras recargar.
- `/activar-cuenta` real y público: lee `?code=`, valida la invitación con `validate_invitation`, muestra niño + nombre del invitado; si es inválida/expirada/aceptada muestra estado de error en español.
- Registro: `supabase.auth.signUp` (confirmación de email desactivada en el proyecto) con `full_name`/`role: 'parent'` y `photo_consent` en `raw_user_meta_data`; tras el signup el action llama `accept_invitation` (crea `parent_children`, marca `accepted`).
- Redirección por rol: login y activación llevan a `/familia` si el rol es `parent` y a `/` si es `staff`; rutas de staff (`/`, `/kids`, `/kids/[id]`) redirigen padres a `/familia` y viceversa.
- Página `/familia` (nueva, simple): tarjeta con el(s) niño(s) vinculados (nombre, sala, edad) + placeholder "El feed de tu hijo llega pronto"; responsive 375/922 con la paleta existente.
- Env vars en `.env.local`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` (documentar en README o `.env.example` si existe).

**Fuera de alcance:**

- Feed real para padres con publicaciones (posts siguen mock; `/familia` es placeholder).
- UI de cancelación, edición o reenvío explícito de invitaciones (el reintento del modal reenvía; no hay lista de acciones).
- Login/registro sin invitación, recuperación de contraseña, OAuth, roles admin.
- Plantillas `@react-email` ni dominios verificados de Resend.
- Notificaciones al padre (resumen diario, avisos de posts).
- Concurrencia multi-daycare (proyecto con daycare único; endurecer cuando exista UI de daycares).

## Data model

```sql
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

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);
```

Funciones `SECURITY DEFINER` (patrón `handle_new_user` de SPEC 09):

- `validate_invitation(p_code text)` → `jsonb` con `{ status, full_name, email, relationship, child_id, child_name, room_name, expires_at }` o `null`; si `status='pending'` y `expires_at < now()` la marca `expired` antes de responder (expiración perezosa, sin cron).
- `accept_invitation(p_code text, p_email text)` → inserta `parent_children (auth.uid(), child_id, relationship)` y marca `accepted/accepted_at` si la invitación sigue `pending` y el email coincide; todo o nada.

Estructuras de aplicación:

```ts
// lib/invitations.ts — tipos compartidos (server)
export type Relationship = "mother" | "father" | "guardian"; // modal: Mamá/Papá/Tutor/a

// lib/data/invitations.ts — acceso a datos
export type InvitedParent = {
  kind: "invitation" | "accepted";
  name: string;
  relationshipLabel: string; // "Mamá" | "Papá" | "Tutor/a"
  status: "pending" | "expired" | "active";
};
export async function fetchLinkedParents(supabase, childId): Promise<InvitedParent[]>;
export async function fetchLinkedChildren(supabase, parentId): Promise<Kid[]>;

// lib/email/invitation.ts — solo servidor
export async function sendInvitationEmail(invitation): Promise<{ ok: boolean; error?: string }>;

// actions/kids/link-parent.ts
export type LinkParentResult =
  | { ok: true; code: string }
  | { ok: false; error: string }; // mensaje en español

// actions/auth/activate-account.ts
export type ActivationResult =
  | { ok: true }              // sesión creada; redirect("/familia")
  | { ok: false; error: string };
```

Cambios de estado existentes: `LinkedParent` de `lib/kids.ts` pasa a consumirse desde `InvitedParent` real; el wrapper client `kid-profile.tsx` (SPEC 06) elimina su estado local de padres; el modal deja de mostrar `7K4P9` fijo (muestra "se genera al enviar" o nada hasta la respuesta).

## Implementation plan

1. Crear migración `supabase/migrations/20261114000000_create_invitations_and_parent_children.sql` con ENUMs, tablas, índices (`invitations (child_id, status)`, `parent_children (child_id)`), RLS (staff autenticado puede seleccionar/insertar/editar; `parent_children` visible para el propio padre) y las dos funciones `SECURITY DEFINER` con `search_path` fijo. Aplicarla con `apply_migration` al proyecto `rsquxsqzjffagtidrgkp` y verificar con `list_migrations`.
2. Instalar `resend`; agregar a `.env.local` `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (default `onboarding@resend.dev`) y `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` en dev). Documentar las tres variables.
3. Crear `lib/email/invitation.ts` con `sendInvitationEmail`: asunto "Te invitaron a OpenDayCare", HTML simple (nombre del staff, niño, sala, parentesco, código en grande, link de activación, vencimiento). Sin importar el SDK en ningún componente client.
4. Crear `actions/kids/link-parent.ts` (`"use server"`): `requireUser` + verificar `role = 'staff'` y que el niño pertenezca al daycare del usuario; validar nombre/email/parentesco (mapeo Mamá→mother etc.); reutilizar `pending` existente para el mismo niño+email o generar código único (alfabeto sin `0O1IL`, reintento ante colisión) con `expires_at = now() + 7 days`; enviar el correo; si Resend falla, devolver error en español dejando la invitación `pending` para el reintento; `revalidatePath("/kids/[id]")`.
5. Conectar `link-parent-modal.tsx` y `kid-profile.tsx` al action: submit async con estado "Enviando…", errores inline sin cerrar el modal, cierre solo con `ok`; eliminar el código fijo `7K4P9` del modal.
6. Crear `lib/data/invitations.ts` (`fetchLinkedParents`, `fetchLinkedChildren`) y reemplazar el panel de `parents-panel.tsx` por datos reales: accepted → ACTIVO, pending vigente → PENDIENTE, pending vencida → EXPIRADA; el botón disparador del modal se conserva.
7. Reescribir `/activar-cuenta` (página + `activation-form.tsx`): Server Component público que lee `?code=`, llama `validate_invitation` y renderiza invitación válida o estados de error (inexistente, expirada, ya aceptada); el formulario muestra código y email pre-llenados no editables, contraseña (mínimo 8) y consentimiento de fotos obligatorio.
8. Crear `actions/auth/activate-account.ts`: re-validar la invitación en el servidor, `signUp({ email, password }, { data: { full_name, role: 'parent', photo_consent } })` (autoconfirm), luego `accept_invitation(code, email)` con el cliente SSR ya autenticado; errores de Auth (email en uso, red) mapeados a mensajes en español; éxito → `redirect("/familia")`.
9. Cambiar el post-login de `components/auth/login-form.tsx`: tras `signInWithPassword`, leer el rol desde `public.users` (RLS propia) y navegar a `/familia` si es `parent`, `/` si es `staff`.
10. Crear `app/familia/page.tsx` (Server Component con `requireUser` + `fetchLinkedChildren`, `instant = false`) con la tarjeta simple del niño y placeholder del feed; actualizar el guard de rutas: helper `requireRole("staff")` en `/`, `/kids`, `/kids/[id]` (padres → `/familia`) y `requireRole("parent")` implícito en `/familia` (staff → `/`); agregar `/familia` a las rutas protegidas de `utils/supabase/middleware.ts` (ya lo es por defecto: no está en `PUBLIC_PATHS`).
11. Desactivar "Confirm email" en el proyecto Supabase (`rsquxsqzjffagtidrgkp`) desde la config de Auth (Dashboard o herramienta MCP disponible) y verificar que un `signUp` devuelve sesión sin confirmación. Registrar la dependencia de config en el README.
12. Ejecutar `npx tsc --noEmit` y `npm run lint`; verificar end-to-end con Playwright en `.playwright-mcp/`: enviar invitación real (correo a bandeja de prueba), abrir el link, activar cuenta con contraseña, ver `/familia` con el niño, revisar el panel del perfil con chip ACTIVO, y recargar para confirmar persistencia; capturas de modal, activación y `/familia` a 922px y 375px.

## Acceptance criteria

- [ ] Existe la migración en `supabase/migrations/` y `list_migrations` la registra en el proyecto remoto con `invitations`, `parent_children`, los dos ENUMs y las dos funciones.
- [ ] "Enviar invitación" con datos válidos crea una fila `invitations` `pending` con `code` de 5 caracteres, `expires_at` a 7 días e `invited_by` = usuario actual, y el botón muestra "Enviando…" mientras corre.
- [ ] El destinatario recibe un correo desde `RESEND_FROM_EMAIL` con el nombre del niño, el código y un link `/activar-cuenta?code=XXXXX`.
- [ ] Si Resend falla, el modal permanece abierto con error en español y la invitación queda `pending`; reenviar reutiliza el mismo código (no hay fila duplicada para el mismo niño+email).
- [ ] Validaciones de nombre/email/parentesco siguen funcionando inline como en SPEC 06.
- [ ] El panel "Padres vinculados" muestra las invitaciones y padres reales del niño y persiste tras recargar; sin datos muestra "sin padres vinculados".
- [ ] Una invitación vencida (`expires_at < now()`) aparece como EXPIRADA y `validate_invitation` la marca `expired`.
- [ ] `/activar-cuenta` sin código, con código inexistente, expirado o ya aceptado muestra su estado de error en español sin formularios de registro.
- [ ] Con código válido, la página muestra el nombre del invitado, niño y sala, y el formulario con código y email pre-llenados no editables.
- [ ] Activar con contraseña ≥8 y consentimiento crea el usuario Auth con `role: 'parent'` y `photo_consent` en `raw_user_meta_data`, crea la fila `parent_children`, marca la invitación `accepted` y deja la sesión iniciada en `/familia` (cookies `sb-*`).
- [ ] Contraseña corta o consentimiento desmarcado muestran error inline y no crean cuenta.
- [ ] Intentar activar dos veces el mismo código falla la segunda vez con error claro y no duplica `parent_children`.
- [ ] Un padre que hace logout y entra a `/login` con sus credenciales va a `/familia`; si navega a `/kids` lo redirige a `/familia`. `caro@opendaycare.com` (staff) sigue yendo a `/`.
- [ ] `/familia` lista en español los niños del padre (nombre, sala, edad) con placeholder del feed; `/` sin sesión redirige a `/login` (regresión SPEC 10 sigue viva).
- [ ] No se expone `RESEND_API_KEY` ni el SDK fuera de módulos de servidor (ningún componente `"use client"` los importa).
- [ ] `npx tsc --noEmit` y `npm run lint` pasan.

## Decisions

- **Sí:** una sola spec para vinculación + correo + registro — decisión explícita del usuario ("No, una sola spec grande"); se acepta romper la regla del objetivo de una oración por unidad de flujo.
- **Sí:** Resend SDK llamado desde Server Actions de Next.js — confirmado por el usuario; sin Edge Functions.
- **Sí:** remitente `onboarding@resend.dev` con env `RESEND_FROM_EMAIL` — no hay dominio verificado todavía; cambiar la env basta.
- **Sí:** correo HTML simple con link `?code=` — sin `@react-email`; el código además se muestra en el cuerpo por si el link se rompe.
- **Sí:** código de 5 caracteres alfanumérico sin `0/O/1/I/L`, UNIQUE con reintento, `expires_at` 7 días, expiración perezosa en `validate_invitation` — coincide con la referencia (7K4P9 / "Vence en 7 días") y evita cron.
- **Sí:** reutilizar invitación `pending` para el mismo niño+email — reintento sin códigos zombis ni duplicados.
- **Sí:** RPCs `SECURITY DEFINER` (`validate_invitation`, `accept_invitation`) — el acceso pre-sesión no puede pasar por RLS con la anon key; se descartó service role en `.env.local` (credencial demasiado poderosa en la app) y policies por email sin sesión (filtraría datos).
- **Sí:** desactivar "Confirm email" del proyecto — el invitado ya fue validado por el staff; evita doble correo (Resend + Supabase) y deja sesión inmediata tras el signup. Es config del proyecto, no migración.
- **Sí:** `photo_consent` en `raw_user_meta_data` — sin columna nueva; la spec de fotos decidirá dónde migrarla si hace falta consultarla.
- **Sí:** `/familia` como destino del padre con placeholder — los posts siguen mock; cumplir "solo verá el feed de su niño" requiere la spec de publicaciones.
- **Sí:** redirección por rol leída de `public.users` — SPEC 10 decidió no gobernar roles todavía; esta spec introduce el primer uso (`requireRole`) acotado a staff-vs-padre.
- **No:** UI de cancelar/revocar invitaciones — fuera del alcance acordado.
- **No:** persistir el envío del correo (logs de email) — Resend ya guarda el historial.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `signUp` en Server Action no fija las cookies de sesión (`@supabase/ssr` necesita escribir cookies en la respuesta) | Verificar temprano (paso 11) que tras `signUp` el cliente SSR del action tenga sesión para llamar `accept_invitation`; si falla, la alternativa es `signInWithPassword` inmediato post-signup en el mismo action. |
| Desactivar confirmación de email afecta a cualquier signup futuro | Es el único signup existente (activación); documentado en README y en Decisions. |
| `cacheComponents` sirve `/activar-cuenta` o `/kids/[id]` viejos tras aceptar | `/activar-cuenta` es público dinámico (usa `searchParams`); `revalidatePath("/kids")`/`revalidatePath("/kids/[id]")` en `accept_invitation` callers; verificación Playwright con recarga. |
| Race: dos activaciones simultáneas del mismo código | `accept_invitation` hace UPDATE ... WHERE status='pending' y aborta (todo o nada) si no tomó la fila; UNIQUE (parent_id, child_id) cubre duplicados. |
| Correo cae en spam o `onboarding@resend.dev` limita destinos | En dev se prueba con la bandeja propia; el link de verificación de Resend y el cambio a dominio propio quedan como siguiente paso operativo. |
| Email ya registrado en Auth (el padre tenía cuenta) | `signUp` devuelve error "usuario ya existe" → mensaje en español "Ya tenés una cuenta. Ingresá con tu contraseña." sin aceptar la invitación (quedan `pending` para reintento manual futuro). |
| RLS de staff sin roles reales deja escribir invitaciones a cualquier autenticado | Mismo degradado conocido de SPEC 11; el action verifica `role = 'staff'` en `public.users` antes de insertar. |

## What is **not** in this spec

- Feed real para padres ni publicaciones por niño (posts siguen mock).
- Cancelar, editar o reenviar invitaciones desde una lista de gestión.
- Registro sin invitación, recuperación de contraseña, OAuth, roles admin.
- Plantillas React Email, dominio propio en Resend, historial de envíos.
- Consumo real del `photo_consent` (se guarda, no se usa aún).
- Multi-daycare y endurecimiento de RLS por rol.
