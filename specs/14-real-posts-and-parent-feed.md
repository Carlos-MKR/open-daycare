# SPEC 14 — Publicaciones reales y feed del padre

> **Estado:** Implementado
> **Depende de:** SPEC 01 y SPEC 07 (feed y composer mock), SPEC 11 (rooms/children), SPEC 12 (niños reales), SPEC 13 (vínculo padre + /familia)
> **Fecha:** 2026-11-14
> **Objetivo:** Reemplazar el feed y el composer mock por publicaciones reales en la DB (`posts` + `post_children` con RLS por visibilidad), de modo que el staff publique a niños específicos o a toda la sala y el padre vea en `/familia` las novedades de sus hijos más los anuncios de sus salas.

## Why this spec exists

El composer de SPEC 07 y el feed de SPEC 01 son mocks: los destinatarios son niños ficticios (`Mateo`/`Sofía`/`Benjamín`), "Publicar" solo toca estado local y `/familia` muestra un placeholder ("el feed llega pronto", decisión de SPEC 13). `07-DB-Schema` §7–§8 define `posts`/`post_children` como el mecanismo real, incluida la regla de que el feed del padre = posts que etiquetan a sus hijos + anuncios de la sala. El usuario pidió además expresamente que el padre pueda ver las publicaciones desde su dashboard.

Por decisión del usuario es una sola spec (DB + composer + feed staff + feed padre), como SPEC 13.

## Scope

**In:**

- Migración con ENUM `post_type` (`meal`/`nap`/`activity`/`achievement`/`mood`/`announcement` — se amplía el esquema de referencia con `mood` para "Ánimo" en lugar de colapsarlo en `achievement`), tablas `posts` y `post_children`, e índices por `room_id`/`published_at`.
- RLS por visibilidad real (decisión del usuario, más estricta que SPEC 11/13): los padres leen solo posts que etiquetan a un hijo suyo o anuncios de las salas de sus hijos; el staff lee y escribe dentro de su daycare; `anon` nada.
- Composer real: los chips de destinatarios se cargan con los niños del daycare (nombre, inicial y tono de avatar); "Toda la sala" pide además qué sala (select con las salas reales); los tipos dejan de incluir "Foto"; "Publicar" invoca una Server Action que valida, inserta `posts` (+ `post_children` o `room_id`) con `published_at = now()` y revalida.
- Feed de staff `/`: posts reales del daycare (todos los tipos y salas), orden `published_at desc`, chip de tipo con la etiqueta real (COMIDA/SIESTA/ACTIVIDAD/LOGRO/ÁNIMO/ANUNCIO), línea "Para: familia de X[, Y] · tipo" o "Para: toda la sala · anuncio" derivada de `post_children`/`room_id`, estado vacío en español.
- Feed del padre `/familia`: tarjetas de hijos arriba (como SPEC 13) + feed combinado debajo — posts que etiquetan a un hijo propio y anuncios de las salas de esos hijos, orden cronológico, sin filtros por niño por ahora.
- `lib/feed.ts`: eliminado del mock `FEED_POSTS`; tipos, `NAV_ITEMS` y estilos de variantes sobreviven y se usan para renderizar posts reales.
- Responsive y fidelidad: `/` y `/familia` a 375px y 922px; el composer mantiene el diseño de `references/pantallas` (SPEC 07).

**Fuera de alcance:**

- Fotos de publicaciones (`post_photos`, subida a Storage): los chips "foto" quedan afuera hasta su spec.
- Reacciones, comentarios y sus contadores: se ocultan en las tarjetas (llegan con su spec).
- Edición y borrado de posts (los links "Editar"/"Editar" del mock quedan inertes; sin policies de UPDATE/DELETE).
- Avisos/notificaciones al padre (push, email, resumen diario `daily_summaries`).
- Filtro del feed del padre por hijo (pestañas/selectores).
- Roles: cualquier staff del daycare puede publicar; la gobernanza fina de permisos sigue afuera (patrón SPEC 13).

## Data model

```sql
create type public.post_type as enum
  ('meal', 'nap', 'activity', 'achievement', 'mood', 'announcement');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete cascade, -- anuncios "toda la sala"
  type public.post_type not null,
  title text,                       -- nullable; el composer no lo usa hoy
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
```

Regla de audiencia: `type = 'announcement'` con `room_id` no nulo y sin filas en `post_children` = "toda la sala"; posts a niños etiquetan `post_children` (y `room_id` nulo). Un `announcement` sin `room_id` es un anuncio general del daycare (visible para todo el staff; los padres solo ven los de sala — la UI del composer no expone todavía ese caso).

RLS (policies con subconsultas `exists`, sin RPCs):

- `posts_select_staff`: rol `staff`/`admin` del usuario autenticado → ve todos los posts de su daycare (el daycare se deriva por `rooms.daycare_id` del `room_id` o de la sala de los niños etiquetados; en este proyecto hay un solo daycare, la policy se escribe por autoría de sala y se documenta la simplificación).
- `posts_select_parent`: visible si existe `post_children` ↔ `parent_children` del autenticado, o `posts.room_id` es la sala de algún hijo y `type = 'announcement'`.
- `posts_insert`: solo con `auth.uid() = author_id` y rol staff (el action valida además pertenencia de niños/sala al daycare).
- `post_children_select/insert`: espejo de las de `posts`.
- Sin policies de `update`/`delete`.

Vistas de aplicación:

```ts
// lib/posts.ts — tipos de dominio y etiquetas (sin datos mock)
export type PostType = "meal" | "nap" | "activity" | "achievement" | "mood" | "announcement";
export type PostView = {
  id: string;
  type: PostType;
  body: string;
  publishedAt: string;             // ISO timestamptz
  authorName: string;
  roomName?: string;               // sala del anuncio
  childNames: string[];            // destinatarios etiquetados
  variant: PostVariant;            // achievement | activity | announcement (estilos del mock)
};
export const POST_TYPE_LABELS: Record<PostType, string>; // "Comida", "Siesta"… en español

// lib/data/posts.ts — acceso a datos
export async function fetchPostsForDaycare(supabase, daycareId): Promise<PostView[]>;
export async function fetchPostsForParent(supabase, parentId): Promise<PostView[]>;

// actions/posts/create-post.ts
export type CreatePostInput = {
  type: PostType;
  body: string;
  childIds: string[];   // audiencia por niño (vacío si es sala)
  roomId: string | null; // audiencia "toda la sala" (anuncio)
};
export type CreatePostResult = { ok: true } | { ok: false; error: string };
```

Mapeo `type` → `variant` de estilos: `achievement|mood → achievement`, `meal|nap|activity → activity`, `announcement → announcement`; el badge de la tarjeta muestra la etiqueta real del tipo, no la del variante.

## Implementation plan

1. Crear y aplicar la migración `supabase/migrations/20261114120000_create_posts.sql`: ENUM, tablas, índices (`posts (published_at)`, `posts (room_id)`, `post_children (child_id)`), trigger `set_updated_at`, RLS con las policies de arriba. Verificar con `list_migrations` y `select` de prueba en la DB vacía.
2. Crear `lib/posts.ts`: `PostType`, `POST_TYPE_LABELS`, `variantForType()`, `audienceLabel(post)` ("familia de X, Y" | "toda la sala · nombre de sala") y `publishedLabel(iso)` ("14:20" si es hoy, "12 nov" si no — reutiliza los formateadores de `lib/kids.ts`).
3. Crear `lib/data/posts.ts` con `fetchPostsForDaycare` (unida `author:users(full_name)` + `rooms(name)` + `post_children.child:children(full_name)`, filtrada por `status='active'` implícito de RLS, orden `published_at desc`) y `fetchPostsForParent`. Devolver `PostView[]`; los queries de padre pueden correr con la sesión del padre porque la RLS ya limita la visibilidad.
4. Crear `actions/posts/create-post.ts` (`"use server"`): `requireUser` + verificación de rol staff y `daycare_id`; validar `body` no vacío; si `childIds`, verificar que cada niño pertenezca al daycare (patrón `fetchKidById` de SPEC 12); si `roomId`, verificar sala del daycare y `type = 'announcement'`; exigir exactamente una audiencia (niños XOR sala); insertar post + `post_children`; `revalidatePath("/")`, `revalidatePath("/familia")`; devolver `CreatePostResult` con errores en español.
5. Reescribir `components/feed/create-publication-modal.tsx`: props `children: Kid[]` y `rooms: Room[]`; chips de destinatarios desde los niños reales (nombre, inicial, tono) + chip "Toda la sala" que revela un `<select>` de salas; tipos sin "Foto"; submit async contra el action con estado "Publicando…" y errores inline (validación client + mensaje del action); cerrar solo con `ok`; accesibilidad y foco como SPEC 07.
6. Actualizar `publication-composer.tsx`/`feed-browser.tsx` y `app/page.tsx`: la página carga `fetchKids` + `fetchRooms` + `fetchPostsForDaycare` (ya es dinámica por sesión) y los pasa como props al composer y a la lista; eliminar el estado local de posts publicados (`posts` en memoria) y `FEED_POSTS`.
7. Adaptar `components/feed/post-card.tsx`: renderizar `PostView` (badge con etiqueta real del tipo, autor, `publishedLabel`, línea de audiencia derivada); ocultar `post-actions` (likes/comentarios/link Editar) hasta la spec de reacciones; mantener estilos y responsive.
8. Reescribir `app/familia/page.tsx`: mantener las tarjetas de hijos y el logout, reemplazar el placeholder por la lista de `fetchPostsForParent` con las mismas `post-card`s y estado vacío "Todavía no hay novedades de tus hijos. Te avisamos cuando la guardería publique."; página dinámica (`instant = false`, ya usa sesión).
9. Borrar `FEED_POSTS` de `lib/feed.ts` y sus importaciones residuales (tipos/`NAV_ITEMS`/estilos sobreviven); `grep` para confirmar cero refs mock.
10. Verificación E2E con Playwright (staff `caro@opendaycare.com`): publicar a un niño real (lucas test) y a "toda la sala" (Sala Lunas) → aparece en `/` con badges/audiencia correctos y persiste tras recargar; publicar con validaciones (sin descripción, sin destinatario) muestra error inline; reintentar el envío no duplica (botón deshabilitado mientras publica).
11. Verificación E2E del padre (invitación + activación reales de SPEC 13, con código de una invitación pendiente existente como `JZJ2S`): en `/familia` ve los posts de su hijo y los anuncios de la sala de su hijo, y NO ve posts de otros niños ni anuncios de otras salas (comparar el payload de la lista contra los casos publicados como staff); prueba de API directa con el token del padre para verificar que la RLS filtra aunque alguien consulte la tabla a mano.
12. Capturas en `.playwright-mcp/`: `/`, composer abierto con niños reales, `/familia` con feed, y estados vacíos, a 922px y 375px; ejecutar `npx tsc --noEmit` y `npm run lint`.

## Acceptance criteria

- [x] La migración existe en `supabase/migrations/`, `list_migrations` la registra, y `posts`/`post_children`/`post_type` existen en el proyecto remoto. — `20261114120000_create_posts` + dos fix: `20261114130000_fix_posts_rls_returning` (policy SELECT row-local: con `INSERT ... RETURNING` el snapshot del comando no ve la fila nueva y `visible_post_ids()` la descartaba → todo insert con representation fallaba 42501) y `20261114140000_post_children_insert_no_recursion` (el check contra `posts` reentraba las policies `post_children → posts → post_children`).
- [x] El composer lista como destinatarios exactamente los niños reales activos del daycare (con `lucas test` y `Prueba test` visibles, sin Mateo/Sofía/Benjamín). — Evidencia: snapshot y `.playwright-mcp/spec14-composer-real-922.png`.
- [x] "Toda la sala" revela un select con las salas reales y publicar crea un `announcement` con `room_id` y sin `post_children`. — Evidencia: `spec14-composer-sala-922.png`; post "Para: toda la sala · Sala Lunas" visible solo al padre de un niño de Lunas.
- [x] Publicar a niños crea el `posts` + sus filas `post_children`, con `author_id` = staff y `published_at` = ahora; el botón muestra "Publicando…" deshabilitado y el modal cierra solo con éxito.
- [x] Sin descripción o sin destinatarios el modal muestra error inline en español; un fallo del action muestra el mensaje sin cerrarse. — Ambos mensajes verificados inline antes de publicar.
- [x] `/` muestra solo posts reales del daycare en orden descendente con badge del tipo real (COMIDA/SIESTA/…/ÁNIMO/ANUNCIO), autor y audiencia derivados; recargar conserva lo publicado. — `spec14-feed-922.png`; badges en mayúsculas.
- [x] `/` con cero posts muestra el estado vacío en español; el mock `FEED_POSTS` ya no existe y ningún componente lo importa. — `spec14-feed-empty-922.png`.
- [x] Las tarjetas ocultan likes/comentarios/Editar (sin links inertes nuevos). — `post-actions.tsx` y `photo-placeholder.tsx` eliminados.
- [x] Un padre con vínculo aceptado ve en `/familia` los posts que etiquetan a su hijo y los anuncios de la sala de su hijo; no ve nada de otros niños u otras salas. — La comida de Prueba test (Sala Soles) no apareció en su feed.
- [x] Consultando la API de `posts` con la sesión del padre (directo via REST o supabase-js en cliente), solo devuelve sus posts visibles — la RLS es autoritativa, no el filtro de la app. — `GET /rest/v1/posts` con token del padre: exactamente las mismas 3 filas que la UI; `post_children` 2; anon 0 filas.
- [x] `/familia` con vínculo pero sin posts visibles muestra el estado vacío en español. — Verificado antes de publicar (el padre recién vinculado no tenía novedades).
- [x] Un staff sin sesión de Auth no puede insertar: `posts_insert` rechaza escrituras sin sesión y `anon` no lee nada. — Insert como rol `anon` con claims falsificados: 42501; GET anon: 0 filas.
- [x] El action rechaza publicar a niños de otro daycare o a salas inexistentes (no hay UI para eso, pero se verifica en servidor). — Validación explícita vía `fetchKidById`/`fetchRooms` en `create-post.ts`.
- [x] `/`, el composer y `/familia` son responsivos a 375px y 922px sin overflow horizontal, con la paleta/tipografía existentes. — `spec14-{feed,composer,familia}-375/922.png`.
- [x] `npx tsc --noEmit` y `npm run lint` pasan.

## Post-test data cleanup

Los datos de las pruebas se eliminaron al final (pedido del usuario para probar él mismo el flujo): 0 posts, 0 vínculos, cuenta padre de prueba borrada, invitación `JZJ2S` restaurada a `pending` con vencimiento a 7 días.

## Decisions

- **Sí (ajustes de implementación, registrados al ejecutar):**
  - Policies SELECT de `posts`/`post_children` formuladas row-local (columnas de la fila + subconsultas a otras tablas) en lugar de `id in (select visible_post_ids())`: Postgres filtra el `RETURNING` de un INSERT contra la policy SELECT dentro del snapshot del comando, donde la fila recién creada aún no aparece en el scan de `posts()` que hacía la función → cualquier insert con `return=representation` (lo que usa supabase-js con `.select().single()`) fallaba con 42501. Dos migrations extra: `130000_fix_posts_rls_returning` y `140000_post_children_insert_no_recursion` (el check contra `posts` reentraba las policies y PG abortaba con "infinite recursion detected in policy for relation post_children").
  - La audiencia del composer se carga al abrir vía Server Action (`actions/posts/composer-audience.ts`) en lugar de props desde `app/page.tsx`: el provider vive en `app/layout.tsx`, que es estático y sin sesión, así que no puede recibir los datos de la página. El modal sigue recibiendo `kids`/`rooms` como props, ya cargados.
  - El nombre del autor se obtiene con la función DEFINER `user_names(uuid[])` en lugar del embed `author:users(full_name)`: la policy de `users` (solo lectura propia) vacía el embed para cualquier lector — mismo hallazgo que SPEC 13.
  - `fetchPostsForParent(supabase)` sin parámetro `parentId`: la RLS limita la visibilidad y el id del padre sale de la sesión; pasar un id sería una falsa autoridad.
  - Si el insert de `post_children` fallara tras crear el post no se puede borrar el huérfano (no hay policy de DELETE, decisión de alcance); ventana casi inalcanzable porque los niños se validan antes de insertar. Se resuelve con la spec de borrado.
- **Sí:** una sola spec (DB + staff + padre) — decisión explícita del usuario, como en SPEC 13; el riesgo de alcance grande se acepta.
- **Sí:** `mood` como valor nuevo del ENUM para "Ánimo" — el usuario eligió ampliar `07-DB-Schema` en vez de colapsar ánimo en achievement; el esquema de referencia puede desactualizarse vs. la DB (regla de AGENTS.md: la fuente de verdad de lo aplicado es `supabase/migrations/`).
- **No:** tipo `photo` en el composer — sin subida de fotos en el alcance; el chip sale hasta la spec de `post_photos`/Storage.
- **Sí:** RLS por visibilidad real con policies `exists` — decisión del usuario ("RLS por visibilidad real"); es la primera spec del repo con policies que cruzan tablas y reemplaza el degradado abierto de SPEC 11/13 para este dominio.
- **Sí:** anuncio de sala = `posts.room_id` + `type='announcement'` sin etiquetas (regla de `07-DB-Schema` §8); los anuncios generales del daycare (sin sala) no se exponen en la UI todavía.
- **No:** contadores likes/comentarios en cero — mejor ocultar el bloque hasta que existan; evita prometer interacciones muertas.
- **No:** editar/borrar posts — sin policies de UPDATE/DELETE; los links "Editar" del mock desaparecen con las acciones.
- **No:** filtro por niño en `/familia` — el feed combinado cronológico es suficiente para cerrar el flujo padre; las pestañas merecen spec propia.
- **Degradación conocida:** los 3 posts mock del feed desaparecen al borrar `FEED_POSTS` (mismo criterio de SPEC 12 con `KIDS`).
- **Simplificación documentada:** el filtro de daycare en RLS/queries asume proyecto con un solo daycare (como SPEC 13); endurecer con la spec de multi-daycare.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Policies `exists` mal escritas esconden posts al padre o los exponen de más | El paso 11 prueba ambos sentidos (incluye consulta directa con token del padre); corregir con `explain`/pruebas de visibilidad antes de dar por buena la migración. |
| `cacheComponents` sirve `/` o `/familia` viejos tras publicar | `revalidatePath` de ambos en el action; `/` y `/familia` son dinámicas por `cookies()`/`instant = false`; verificación Playwright con recarga. |
| Doble submit del composer crea posts duplicados | Botón deshabilitado durante la transición + el action ignora mientras `isPending`; criterio explícito. |
| Un niño sin sala (datos huérfanos) rompe el feed del padre | `fetchPostsForParent` deriva todo desde `parent_children → children → rooms`; niño sin vínculo simplemente no aporta posts. |
| `post_children` con niños de otro daycare (abuso de API) | El action valida pertenencia al daycare del staff antes de insertar; la RLS de insert exige `author_id = auth.uid()` y rol staff. |
| La etiqueta del variante (`ACTIVIDAD` etc.) no coincide con el tipo real (COMIDA) | Mapeo explícito en `variantForType` (solo estilos) y badge desde `POST_TYPE_LABELS` (texto real); criterio de aceptación lo verifica por tipo. |

## What is **not** in this spec

- Fotos de publicaciones (`post_photos`, Storage, vista pantalla completa).
- Reacciones, comentarios y contadores; edición/borrado de posts.
- Notificaciones al padre (email/push) y `daily_summaries`.
- Filtro por niño en el feed del padre.
- Gobernanza fina por rol dentro del staff y multi-daycare.
