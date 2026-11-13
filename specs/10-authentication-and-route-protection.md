# SPEC 10 — Autenticación real y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 09
> **Fecha:** 2026-11-12
> **Objetivo:** Reemplazar el login mock por autenticación real con Supabase Auth (email y contraseña), proteger todas las rutas de la app con el patrón oficial de Supabase SSR (proxy.ts + verificación en páginas) y conectar el Cerrar sesión existente.

## Scope

**In:**

- Login real con `supabase.auth.signInWithPassword` usando `createClient` de `utils/supabase/client.ts`, sin valores precargados.
- Errores de credenciales inline en español bajo el formulario, sin navegación cuando fallan.
- Redirección a `/` tras un login exitoso.
- Protección en `proxy.ts` (`updateSession`): rutas sin sesión fuera de la lista pública redirigen a `/login`; `/login` con sesión activa redirige a `/`.
- Verificación autoritativa por página con `getUser()` en los Server Components de `/`, `/kids` y `/kids/[slug]` mediante un helper común `requireUser()`.
- Logout como Server Action (`signOut` + redirect a `/login`) conectado a los disparadores "Cerrar sesión" ya existentes en `sidebar.tsx` y `mobile-topbar.tsx`, sin cambiar su apariencia.
- Sesión persistida en cookies gestionadas por `@supabase/ssr`; recargar una ruta protegida con sesión mantiene el acceso.
- Usuario demo real: `caro@opendaycare.com` / `daycare123` (seed de la migración `20261112000000_create_users.sql`).
- Mantener el diseño responsive y la fidelidad visual de `/login` de SPEC 04.

**Fuera de alcance:**

- Registro/signup, confirmación de email y activación real de invitaciones (`/activar-cuenta` sigue mock).
- Recuperación de contraseña ("¿Olvidaste tu contraseña?" permanece inerte).
- Lectura de datos reales de `public.users` (nombre, avatar, rol) — el contenido de feed/kids sigue mock.
- Autorización por rol (staff vs parent): todo usuario autenticado accede a todas las rutas protegidas.
- OAuth, MFA, magic links.
- Redirección de retorno con query param `next` tras el login.
- Migraciones de base de datos (no se necesitan: el seed y el RLS ya existen).

## Data model

No introduce datos persistentes nuevos. La sesión vive en cookies `sb-*` escritas por `@supabase/ssr`. Cambia el estado local del login:

```ts
type LoginFormState = {
  email: string; // inicia vacío (ya no es mock)
  password: string;
};

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string; // error de autenticación remota, inline bajo el formulario
};
```

Rutas públicas (constante en `utils/supabase/middleware.ts`):

```ts
const PUBLIC_PATHS = ["/login", "/activar-cuenta"];
```

## Implementation plan

1. Crear `lib/auth/require-user.ts`: `const user = await requireUser()` usa `createClient` de `utils/supabase/server.ts`, llama `getUser()` y `redirect("/login")` si no hay usuario. Verificación: importable desde cualquier Server Component sin `"use client"`.
2. Actualizar `utils/supabase/middleware.ts` (`updateSession`): tras `await supabase.auth.getUser()` — que debe mantenerse **antes** de generar la respuesta para que el refresh escriba las cookies (patrón oficial de `@supabase/ssr`) — redirigir a `/login` si no hay usuario y la ruta no es pública, y a `/` si hay usuario en `/login`. Verificación: entrar a `/kids` sin sesión aterriza en `/login`.
3. Convertir `components/auth/login-form.tsx` a autenticación real: submit async con `signInWithPassword`, estado `submitting` (botón "Ingresando…" deshabilitado), limpiar `email` inicial, mapear errores a mensajes inline en español ("Email o contraseña incorrectos.", "No pudimos conectar con el servidor. Intentá de nuevo."). No navegar si el login falla. Verificación: credenciales malas muestran error y permanecen en `/login`.
4. Crear `actions/auth/logout.ts` como Server Action (`"use server"`): `signOut()` con el cliente de `utils/supabase/server.ts` y `redirect("/login")`. Verificación: navega a `/login` y una ruta protegida ya no es accesible.
5. Conectar los botones "Cerrar sesión" de `components/feed/sidebar.tsx` y `components/feed/mobile-topbar.tsx` envolviéndolos en `<form action={logout}>` con `button type="submit"`, conservando exactamente sus estilos actuales. Verificación: el ícono se ve igual a 922px y 375px.
6. Agregar `await requireUser()` a `app/page.tsx`, `app/kids/page.tsx` y `app/kids/[slug]/page.tsx`. Verificación: la defensa en profundidad funciona aunque `proxy.ts` no cubra una ruta futura.
7. Ejecutar `npx tsc --noEmit` y `npm run lint`; capturar con Playwright en `.playwright-mcp/`: login exitoso → feed, credenciales inválidas → error inline, `/kids` sin sesión → `/login`, logout → `/login`, `/login` con sesión → feed, y `/login` a 922px y 375px.

## Acceptance criteria

- [ ] `/login` inicia con email y contraseña vacíos (sin prefill demo).
- [ ] `caro@opendaycare.com` / `daycare123` navega a `/` y la sesión queda en cookies.
- [ ] Credenciales inválidas muestran "Email o contraseña incorrectos." inline y no navegan.
- [ ] El botón muestra "Ingresando…" y se deshabilita mientras se autentica.
- [ ] `/`, `/kids` y `/kids/[slug]` sin sesión redirigen a `/login` (vía proxy y vía `requireUser()`).
- [ ] `/login` con sesión activa redirige a `/`.
- [ ] `/activar-cuenta` sigue accesible sin sesión.
- [ ] Recargar una ruta protegida con sesión conserva el acceso.
- [ ] "Cerrar sesión" del sidebar (desktop) y del topbar (móvil) destruye la sesión y lleva a `/login`.
- [ ] Tras logout, volver a `/` redirige a `/login`.
- [ ] La apariencia de `/login`, el sidebar y el topbar no cambia respecto de SPEC 04/01/02 a 922px y 375px.
- [ ] `proxy.ts` llama `getUser()` antes de generar cualquier respuesta (refresh de cookies no se pierde).
- [ ] No hay migraciones ni cambios de schema en este spec.
- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm run lint` pasa.

## Decisions

- **Sí:** protección en dos capas — `proxy.ts` redirige (primera barrera y refresh de cookies) y cada página verifica con `getUser()` (autoritativa, defensa en profundidad). Recomendado por la documentación de `@supabase/ssr` consultada en Context7: `getUser()` valida el token contra el servidor de Auth y debe correr antes de commitear la respuesta para que `setAll` pueda escribir las cookies refrescadas.
- **Sí:** solo email + contraseña (`signInWithPassword`) — único método de acceso acordado.
- **Sí:** logout como Server Action — los disparadores "Cerrar sesión" ya viven en Server Components; envolverlos en `<form action={...}>` agrega cero JavaScript al cliente.
- **Sí:** helper `requireUser()` centralizado en `lib/auth/` — evita duplicar el guard en cada página y deja la regla lista para rutas futuras.
- **Sí:** lista `PUBLIC_PATHS` en el middleware — una sola fuente para qué rutas no piden sesión.
- **No:** prefilled `caro@opendaycare.com` — con auth real el prefill filtraría un usuario demo a la UI de producción.
- **No:** redirección con `next=` de retorno — simple redirect a `/`; el deep-link de vuelta queda fuera de alcance.
- **No:** datos reales de `public.users` en pantalla — este spec solo abre la puerta; hidratar perfil/feed es otra spec.
- **No:** roles — RLS ya gobierna datos; la autorización por rol merece spec propia.
- **Degradación conocida:** el submit mock de `/activar-cuenta` navega a `/`, que ahora exige sesión → el usuario cae de vuelta en `/login`. Se acepta hasta la spec de activación real.
- **No:** recuperación de contraseña — el link permanece inerte.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents`/`partialPrefetching` podría servir HTML cacheado de rutas protegidas | Las páginas protegidas consumen `cookies()` (vía `getUser()`), lo que las hace dinámicas; verificar en Playwright que el contenido de `/` no aparece tras logout. |
| Perder el refresh de sesión si `getUser()` corre tarde en el proxy | Mantener la llamada de auth como primera operación de `updateSession`, antes de construir cualquier `NextResponse` (requisito documentado de `@supabase/ssr`). |
| El envío mock de activación queda "roto" (rebota a `/login`) | Documentado como degradación conocida; la spec de activación real lo resuelve. |
| `signInWithPassword` filtra mensajes genéricos imposibles de traducir por caso | Un único mensaje honesto para credenciales inválidas; distinguir error de red con `try/catch` del `fetch` fallido. |
| Logout con `redirect()` dentro de Server Action puede re-renderizar páginas cacheadas | `signOut()` borra las cookies vía `setAll`; la siguiente navegación vuelve a pasar por el proxy sin sesión. |

## What is **not** in this spec

- Registro de usuarios nuevos, confirmación por email y activación real de invitaciones.
- Recuperación de contraseña.
- Login por proveedores OAuth, MFA o magic links.
- Lectura de `public.users` para nombre, avatar o rol en pantalla.
- Autorización por rol (staff/parent/admin).
- Retorno a la ruta original (`next`) tras iniciar sesión.
- Cambios de esquema o migraciones.
