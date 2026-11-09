# SPEC 01 — Feed como Home (plantilla feed.dc.html)

> **Estado:** Borrador
> **Depende de:** ninguna
> **Fecha:** 2026-11-08
> **Objetivo:** Implementar la plantilla `references/pantallas/feed.dc.html` como la pantalla principal `/` de la app con estilo idéntico, contenido mock hardcodeado, sin autenticación ni base de datos.

## Scope

**In:**

- Layout del feed en `app/page.tsx`: sidebar de 248px sticky + columna principal con contenedor de 760px.
- Fuentes Fredoka y Nunito vía `next/font/google` en `app/layout.tsx` (reemplazando Geist).
- Paleta del diseño como tokens en `app/globals.css` (`@theme` de Tailwind v4) + scrollbar personalizada.
- Arquitectura por capas: primitivas UI (`components/ui/`), componentes del feed (`components/feed/`) y datos mock tipados en `lib/` con el alias `@/`.
- Cabecera ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun"), composer "Compartí un momento…" y separador "PUBLICADO HOY".
- 3 posts mock idénticos al mockup: logro, actividad (con placeholder de foto) y anuncio general.
- Sidebar completa: logo, botón "Nueva publicación" con gradiente, nav con "Feed" activo, bloque de usuario "Caro Giménez".
- Iconos como SVG inline (copiados del mockup).
- Todos los enlaces inertes (`href="#"`).

**Out of scope (specs futuros):**

- Rutas reales para: niños, avisos, mi cuenta, crear-publicacion, detalle-publicacion, foto, login.
- Autenticación, base de datos, publicación/likes/comentarios reales.
- Responsive/móvil.
- Fecha o saludo dinámicos.

## Data model

La feature **no introduce datos persistentes**. Solo una forma tipada para el mock inline en `lib/feed.ts` que luego la página consume:

```ts
// Identificadores de código en inglés; el texto visible queda en español
// a través de `badgeLabel` en la configuración de variantes.
type PostVariant = "achievement" | "activity" | "announcement";

type FeedPost = {
  id: string;
  title: string;          // "Mateo" | "Anuncio general" (contenido, no código)
  time: string;           // "14:20"
  authorLabel: string;    // "publicado por vos"
  variant: PostVariant;   // determina avatar y chip
  audience: string;       // "familia de Mateo" | "toda la sala"
  body: string;
  photoPlaceholder?: string; // "Foto · pintando con témperas"
  likes: number;
  comments: number;
};
```

La configuración visual de cada variante vive junta (no hay colores repetidos repartidos por los componentes):

```ts
export const POST_VARIANT_STYLES: Record<PostVariant, {
  badgeLabel: string;  // texto visible: "LOGRO" | "ACTIVIDAD" | "ANUNCIO"
  chipBg: string;      // clases de token, p. ej. "bg-success-soft"
  chipText: string;
  avatarBg: string;    // "A9D9E8" del mockup vía token
  avatarText: string;
  iconAvatar?: boolean; // "announcement" usa avatar con icono de megáfono
}> = { /* achievement, activity, announcement */ };
```

Tokens de paleta (nombres propuestos) en `app/globals.css`:

```css
@theme {
  --color-cream: #F6ECDF;           /* fondo app */
  --color-surface: #FFFDF9;         /* tarjetas, sidebar */
  --color-line: #ECE0D0;            /* bordes */
  --color-ink: #3F362E;             /* texto principal */
  --color-ink-body: #4A4038;        /* texto de posts */
  --color-muted: #A89A8B;
  --color-accent: #F2937A;          /* corail principal */
  --color-success: #3E9B6C;         --color-success-soft: #CFEBD8;    /* LOGRO */
  --color-activity: #2E89A6;        --color-activity-soft: #C7E7F1;   /* ACTIVIDAD */
  --color-announcement: #4E72C8;    --color-announcement-soft: #CCD8F4; /* ANUNCIO */
  --font-display: var(--font-fredoka);
  --font-body: var(--font-nunito);
}
```

Descomposición de archivos (cada uno pequeño y con un único motivo):

```
lib/
  feed.ts              // tipos, POST_VARIANT_STYLES y los 3 posts mock
components/
  ui/
    avatar.tsx         // avatar circular (inicial o icono) — usado por sidebar, composer y posts
    badge-chip.tsx     // chip de variante — el texto visible ("LOGRO", etc.) viene de badgeLabel
  feed/
    sidebar.tsx        // logo, botón "Nueva publicación", nav, bloque de usuario
    nav-link.tsx       // item de nav activo/inerte — reutilizable en próximas pantallas
    page-header.tsx    // eyebrow + h1 Fredoka + subtítulo
    composer-prompt.tsx
    section-label.tsx  // "PUBLICADO HOY" + línea separadora
    post-card.tsx      // compone: cabecera, chip, audiencia, cuerpo, foto, footer
    post-actions.tsx   // footer de likes/comentarios/Editar (idéntico en los 3 posts)
    photo-placeholder.tsx
app/
  layout.tsx           // solo fuentes, metadata, lang
  page.tsx             // composición del feed + import de datos mock (lógica cero)
  globals.css          // tokens @theme de la paleta + scrollbar
```

## Implementation plan

1. `app/globals.css`: tokens `@theme` de la paleta, fuentes y scrollbar; eliminar el dark-mode del scaffold. *(Manual: `npm run dev`, `/` compila.)*
2. `app/layout.tsx`: `Fredoka` (400–700) y `Nunito` (400–800, ital) con `next/font/google`, variables `--font-fredoka`/`--font-nunito`, `lang="es"`, metadata "OpenDayCare". *(Manual: `/` pinta con la nueva tipografía.)*
3. `components/ui/avatar.tsx` y `badge-chip.tsx`: primitivas con colores vía tokens. *(Manual: el build compila, aún sin uso.)*
4. `lib/feed.ts`: tipos + `POST_VARIANT_STYLES` + los 3 posts mock. *(La página queda intacta, app funcional.)*
5. `components/feed/sidebar.tsx` + `nav-link.tsx` y `app/page.tsx`: estructura flex (aside + main), `page-header.tsx`, `composer-prompt.tsx` y `section-label.tsx`. *(Manual: `/` muestra el feed sin posts.)*
6. `components/feed/post-card.tsx` + `post-actions.tsx` + `photo-placeholder.tsx`: render de los 3 posts mock.
7. Auditoría de enlaces inertes (`href="#"`), `npx tsc --noEmit`, `npm run lint` y comparación visual (captura Playwright en `.playwright-mcp/` vs `references/screenshots/feed.png`).

## Acceptance criteria

- [ ] `/` renderiza el feed con fondo cream `#F6ECDF` y superficies `#FFFDF9`, tipografía Fredoka/Nunito auto-alojada (sin llamadas de red a Google Fonts).
- [ ] Sidebar de 248px sticky con logo OpenDayCare/Sala Soles, botón gradiente "Nueva publicación", "Feed" activo con fondo `#FBE3D8`/`#D9583C` y usuario "Caro Giménez".
- [ ] Cabecera con eyebrow "GUARDERÍA · SALA SOLES" en `#D9583C`, h1 Fredoka "Buenas, Caro" y subtítulo "12 niños · martes 17 jun".
- [ ] Composer con avatar "C", texto "Compartí un momento…" y chip de cámara en `#FBE3D8`.
- [ ] Separador "PUBLICADO HOY" con línea.
- [ ] Los 3 posts con badges correctos: LOGRO (#CFEBD8/#3E9B6C), ACTIVIDAD (#C7E7F1/#2E89A6), ANUNCIO (#CCD8F4/#4E72C8).
- [ ] El post de ACTIVIDAD muestra el placeholder de foto dashed (#DBCDBA sobre #F4ECE1, 200px) con caption "Foto · pintando con témperas".
- [ ] Todo lo clicable es inerte (`href="#"`): no navega a 404 y la consola de `next dev` no muestra errores ni warnings de hidratación.
- [ ] npx tsc --noEmit pasa.
- [ ] npm run lint pasa.
- [ ] Captura de Playwright (en `.playwright-mcp/`) visualmente indistinguible de `references/screenshots/feed.png` (colores, espaciados, jerarquía).

## Decisions

- **Sí:** identificadores de código en inglés (`achievement`, `activity`, `announcement`, nombres de archivos, variables y componentes) — sigue las reglas de código del repo.
- **No:** variantes ni identificadores en español en el código — el texto visible en español vive solo en datos/UI (`badgeLabel`, contenido de los posts).

- **Sí:** `next/font/google` para Fredoka/Nunito en layout.tsx, reemplazando Geist (auto-alojado, sin red externa, evita layout shift).
- **No:** `<link>` a Google Fonts como el mockup — en Next 16 se prefiere `next/font`.
- **Sí:** paleta como tokens `@theme` en `app/globals.css` — reutilizable en las próximas pantallas (niños, avisos, etc.).
- **No:** valores hex arbitrarios inline en los componentes.
- **Sí:** primitivas transversales en `components/ui/` (avatar, badge-chip) — las próximas pantallas (niños, compositor) las reutilizan.
- **No:** todo en un `page.tsx` monolítico — duplicación de estilos (footer de posts, avatar) y sin reuso.
- **Sí:** datos y variantes en `lib/feed.ts` — cuando llegue la BD, solo cambia ese módulo por un fetch; `page.tsx` y `post-card.tsx` no se tocan.
- **Sí:** enlaces inertes `href="#"` hasta que cada pantalla tenga su propio spec (evita 404).
- **No:** rutas stub que naveguen a 404.
- **Sí:** contenido mock hardcodeado (sin BD ni auth, según el estado actual del proyecto).
- **No:** fecha/saludo dinámicos — contenido estático para comparación 1:1 con el mockup.
- **Sí:** iconos como SVG inline copiados del mockup (8 iconos, no justifica una dependencia).
- **No:** lucide-react u otra librería de iconos.
- **Sí:** desktop-first tal cual el mockup (sidebar fija 248px + main con scroll).
- **No:** responsive/móvil — spec propio cuando toque.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El scaffold de `globals.css` pisa el `background` del body (Arial + dark-mode) | El paso 1 elimina y reemplaza todo el bloque de tema; verificar body con fondo cream. |
| Pesos/variantes de fuentes incompletos | El mockup usa Fredoka 400–700 y Nunito 400–800 + italic; pasar los rangos completos a `next/font`. |
| Warnings de hidratación o lint por enlaces inertes `href="#"` | Verificar consola y lint; si aparecieran, cambiar a `<button type="button">` con el mismo estilo. |

## What is **not** in this spec

- Autenticación real.
- Base de datos persistente (publicaciones, likes, comentarios reales).
- Rutas/pantallas: niños, avisos, mi cuenta, crear-publicación, detalle-publicación, foto.
- Responsive móvil.
- Contenido dinámico (fecha, saludo personalizado).

Cada uno de estos, si llega, va en su propio spec.
