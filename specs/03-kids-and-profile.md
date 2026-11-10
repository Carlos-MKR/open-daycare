# SPEC 03 — Niños: listado `/kids` y perfil `/kids/[slug]`

> **Estado:** implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-10
> **Objetivo:** Implementar las plantillas `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` como las rutas `/kids` y `/kids/[slug]` con contenido mock hardcodeado, navegación real desde el menú y responsive móvil según el patrón de SPEC 02.

## Scope

**In:**

- Ruta `/kids`: cabecera (eyebrow "GESTIÓN", h1 "Niños", botón gradiente "Agregar niño"), buscador funcional client-side, separador "SALA SOLES · 8 niños" y grid de 8 cards (2 columnas desktop / 1 columna móvil).
- Cards de niño con lógica de derecha: chip de alergia ("MANÍ", "LACTOSA") si aplica, chip "VINCULAR" si no tiene padres, chevron en el resto. Cada card navega a `/kids/[slug]`.
- Ruta `/kids/[slug]`: perfil completo — link "Volver a Niños", cabecera con avatar 84px + botón "Editar", panel de alergias, filas de datos (Fecha de nacimiento / Sala / Ingreso), columna derecha con botón oscuro "Resumen del día" y panel "Padres vinculados" (2 padres + "Vincular otro padre").
- Navegación real: `NAV_ITEMS` de "Niños" apunta a `/kids` (sidebar desktop y tab bar móvil). Estado activo derivado de `usePathname` en `NavLink` y `TabLink` (pasan a ser client components).
- `notFound()` para slugs desconocidos.
- Datos mock tipados en `lib/kids.ts` con slugs kebab-case del nombre completo.
- Responsive móvil <768px según SPEC 02: top bar + tab bar + FAB "+", grid de 1 columna, perfil apilado.

**Out of scope (specs futuros):**

- Pantallas agregar-niño, editar, resumen-del-día, vincular-padre, crear-publicación, avisos, mi cuenta — sus links quedan inertes (`href="#"`).
- Autenticación, base de datos, búsqueda server-side (query params/fetch).
- Cambiar el header del feed ("12 niños") — cada mockup manda en su pantalla.
- Chips clicables o acción real de "VINCULAR".
- Estados 768–1023px separados (tablet usa el layout de desktop).
- Back button del navegador vs "Volver a Niños" (es un link normal a `/kids`).

## Data model

No introduce datos persistentes. Mock tipado en `lib/kids.ts`:

```ts
// Identificadores de código en inglés; el texto visible queda en español (datos mock).
type AvatarTone = "sky" | "rose" | "mint" | "amber" | "violet";

type ParentStatus = "active" | "pending";

type LinkedParent = {
  name: string;        // "Lucía Fernández"
  role: string;        // "Mamá · activa" | "Papá · invitación enviada"
  status: ParentStatus; // "ACTIVA" | "PENDIENTE" (chip del panel)
  initial: string;     // "L"
  tone: AvatarTone;    // avatar sólido con texto blanco
};

type Kid = {
  slug: string;          // "mateo-fernandez" (kebab del nombre)
  name: string;          // "Mateo Fernández"
  ageLabel: string;      // "3 años"
  birthDate: string;     // "12 mar 2022"
  room: string;          // "Soles"
  enrolledSince: string; // "feb 2025"
  allergyChip?: string;  // "MANÍ" | "LACTOSA" — chip en la card (opcional)
  allergyNote?: string;  // texto del panel de alergias del perfil
  avatarInitial: string; // "M"
  avatarTone: AvatarTone;
  parents: LinkedParent[];
};
```

Derivaciones (sin duplicar datos):

- `linkedParentsLabel(kid)`: `"2 padres vinculados" | "1 padre vinculado" | "sin padres vinculados"` según `parents.length`.
- Derecha de la card: `allergyChip` → chip de alergia; `parents.length === 0` → chip "VINCULAR"; si no → chevron.

`AVATAR_TONES: Record<AvatarTone, { bg, text }>` centraliza los 5 pares de color; se agregan como tokens en `app/globals.css` (renombrando el par existente `child-avatar` → `avatar-sky` y actualizando `POST_VARIANT_STYLES`):

```css
--color-avatar-sky: #a9d9e8;    --color-avatar-sky-text: #1f7a93;
--color-avatar-rose: #f4b8cc;   --color-avatar-rose-text: #c44a7a;
--color-avatar-mint: #b9dec4;   --color-avatar-mint-text: #3e8b62;
--color-avatar-amber: #f4dc8e; --color-avatar-amber-text: #9a7b1e;
--color-avatar-violet: #c9b6e8; --color-avatar-violet-text: #7b5fc0;
```

Los 8 niños mock (orden del mockup, sala Soles):

| slug | nombre | edad | chip | tono | padres |
| --- | --- | --- | --- | --- | --- |
| mateo-fernandez | Mateo Fernández | 3 años | MANÍ | sky | 2 (Lucía activa, Diego pendiente) |
| sofia-mendez | Sofía Méndez | 2 años | — | rose | 1 |
| benjamin-ruiz | Benjamín Ruiz | 3 años | — | mint | 2 |
| valentina-soto | Valentina Soto | 2 años | VINCULAR | amber | 0 |
| tomas-diaz | Tomás Díaz | 3 años | LACTOSA | violet | 1 |
| emma-castro | Emma Castro | 2 años | — | rose | 1 |
| lucas-romero | Lucas Romero | 3 años | — | sky | 1 |
| olivia-vega | Olivia Vega | 2 años | — | mint | 1 |

El mockup solo define el perfil completo de Mateo; los otros 7 se completan con datos mock coherentes (fecha de nacimiento acorde a la edad, `enrolledSince`, padres acordes al conteo, `allergyNote` solo para Mateo y Tomás).

Descomposición de archivos:

```
lib/
  kids.ts                    // tipos, AVATAR_TONES, KIDS, helpers (linkedParentsLabel, getKidBySlug)
app/kids/
  page.tsx                   // composición server: header, buscador+grid, separador
  [slug]/page.tsx            // perfil: await params, notFound(), back link + paneles
components/kids/
  kids-browser.tsx           // "use client": estado de búsqueda + filtrado por nombre + grid
  kid-card.tsx               // card del listado (pura, server-safe)
  profile-header.tsx         // avatar 84px + nombre + "Editar"
  allergy-alert.tsx          // panel rosa "Alergias y notas"
  detail-rows.tsx            // filas Fecha de nacimiento / Sala / Ingreso
  parents-panel.tsx          // padres vinculados + "Vincular otro padre"
components/feed/
  nav-link.tsx               // client + usePathname (activo por ruta)
  tab-link.tsx               // client + usePathname
  sidebar.tsx                // sin prop active
  mobile-tabbar.tsx          // sin prop active
lib/feed.ts                  // NAV_ITEMS: href "children" → "/kids"
app/globals.css              // tokens de tonos de avatar
```

Lógica de estado activo: `pathname === href` para `/` (Feed) y `pathname.startsWith("/kids")` para Niños (cubre `/kids/[slug]`); los items con `href="#"` nunca quedan activos.

## Implementation plan

1. `app/globals.css`: renombrar `--color-child-avatar(-text)` → `--color-avatar-sky(-text)` y agregar los 4 pares nuevos (rose, mint, amber, violet); actualizar `POST_VARIANT_STYLES` en `lib/feed.ts`. *(Manual: `npm run dev`, `/` compila idéntico.)*
2. `lib/kids.ts`: tipos, `AVATAR_TONES`, `KIDS` (8) y helpers. *(Manual: build compila, aún sin uso.)*
3. Estado activo por ruta: `NavLink` y `TabLink` pasan a client components con `usePathname`; `NAV_ITEMS.children.href → "/kids"`; quitar `active` hardcodeado de `sidebar.tsx` y `mobile-tabbar.tsx`. *(Manual: `/` muestra "Feed" activo, "Niños" navega — aún 404.)*
4. `app/kids/page.tsx` + `kids-browser.tsx` + `kid-card.tsx`: listado completo con buscador. *(Manual: `/kids` lista 8 y filtra al escribir.)*
5. `app/kids/[slug]/page.tsx` + componentes del perfil (`profile-header`, `allergy-alert`, `detail-rows`, `parents-panel`). *(Manual: `/kids/mateo-fernandez` renderiza el perfil; slug inválido → 404.)*
6. Responsive móvil: grid 1 columna, perfil apilado (columna derecha debajo), paddings fluidos y clearance para tab bar + FAB según SPEC 02. *(Manual: 375px sin overflow horizontal.)*
7. Verificación: `npx tsc --noEmit`, `npm run lint` y capturas en `.playwright-mcp/` (922px y 375px, `/kids` y `/kids/mateo-fernandez`) comparadas con los mockups.

## Acceptance criteria

- [x] `/kids` renderiza eyebrow "GESTIÓN", h1 Fredoka "Niños" y botón gradiente "Agregar niño" (inerte).
- [x] El buscador filtra en vivo por nombre (p. ej. "sof" deja solo a Sofía Méndez); vaciarlo restaura las 8 cards.
- [x] Separador "SALA SOLES · 8 niños" con línea y grid de 8 cards en el orden del mockup.
- [x] Chips correctos: Mateo "MANÍ" y Tomás "LACTOSA" (fondo `#FBD8CC`), Valentina "VINCULAR" (fondo `#F9D2DE`); el resto chevron.
- [x] Cada card navega a su propio slug (p. ej. `/kids/valentina-soto`).
- [x] `/kids/mateo-fernandez` renderiza: back link "Volver a Niños" (→ `/kids`), avatar 84px "M", "3 años · Sala Soles", panel de alergias con el texto del mockup, filas "12 mar 2022" / "Soles" / "feb 2025", botón oscuro "Resumen del día" (inerte) y 2 padres (Lucía ACTIVA, Diego PENDIENTE) + "Vincular otro padre" (inerte).
- [x] Un slug desconocido (p. ej. `/kids/pepe`) devuelve el 404 de Next vía `notFound()`.
- [x] "Niños" queda activo (fondo `#FBE3D8` / `#D9583C`) en sidebar desktop y tab bar móvil tanto en `/kids` como en `/kids/[slug]`; "Feed" activo solo en `/`.
- [x] A 375px: grid de 1 columna, perfil apilado, top bar + tab bar + FAB visibles y sin overflow horizontal.
- [x] A 922px el render de `/` sigue idéntico (sin regresión del estado activo ni de tokens).
- [x] `npx tsc --noEmit` y `npm run lint` pasan.

## Decisions

- **Sí:** `usePathname` en `NavLink`/`TabLink` (client components) para el estado activo — DRY, ninguna página pasa props y sirve para las pantallas futuras.
- **No:** prop `activeId` por página — repetiría configuración en cada `page.tsx`.
- **Sí:** slug kebab-case del nombre completo + `notFound()` para desconocidos — URLs legibles y comportamiento estándar de Next.
- **Sí:** cada mockup verbatim — `/kids` muestra 8 niños; el feed mantiene "12 niños". Los mocks son por pantalla hasta que llegue la BD.
- **Sí:** buscador funcional client-side (`kids-browser.tsx`) — pequeño, sin backend y con la UI por defecto idéntica al mockup.
- **No:** búsqueda con query params/server-side — no hay BD; overkill.
- **Sí:** links salientes inertes (`Agregar niño`, `Editar`, `Resumen del día`, `Vincular otro padre`) — cada pantalla tendrá su spec.
- **Sí:** FAB "+" visible en móvil en ambas pantallas — mantiene el patrón de SPEC 02.
- **Sí:** tonos de avatar como tokens `@theme` (5 pares bg/text) reemplazando el par único `child-avatar` — reuso en cards, perfil y padres.
- **No:** hex arbitrarios inline en componentes.
- **Sí:** `linkedParentsLabel` derivado de `parents.length` — evita duplicar datos que pueden desincronizarse.
- **Sí:** completar los 7 perfiles restantes con datos mock coherentes — el mockup solo define el de Mateo y las cards enlazan a los 8.
- **No:** librería de iconos — SVG inline copiado del mockup (chevron, alerta, lupa, sol).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Next 16: `params` es async en páginas dinámicas | Usar `await params` (o los helpers tipados `PageProps<"/kids/[slug]">`); verificar en `node_modules/next/dist/docs/`. |
| `usePathname` obliga a client components y el repo usa server components | Limitar `"use client"` a `nav-link.tsx`, `tab-link.tsx` y `kids-browser.tsx`; el resto de las páginas sigue siendo server. |
| Renombrar `child-avatar` puede romper `POST_VARIANT_STYLES` | Actualizar las referencias en el mismo paso y verificar `/` sin cambios visuales (criterio 922px). |
| `cacheComponents` activo: la búsqueda no debe tocar datos de servidor | El filtrado es estado local de React sobre datos ya renderizados; sin fetch ni cookies. |

## What is **not** in this spec

- Pantallas agregar/editar niño, resumen del día, vincular padre, crear publicación, avisos, mi cuenta.
- Autenticación y base de datos.
- Búsqueda persistente o server-side.
- Ajustes al feed existente (header "12 niños").
