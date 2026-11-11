<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# open-daycare

Next.js 16.4.5 + React 19 + Tailwind v4 app for a daycare platform. Currently a `create-next-app` scaffold; the product UI (`app/`) is being built from the design references below.

## Commands

- `npm run dev` — dev server on `http://localhost:3000` (Turbopack)
- `npm run lint` — flat-config ESLint (lints the repo root by default)
- `npx tsc --noEmit` — typecheck (there is **no** typecheck script; run this before considering work done)
- There are no tests yet.

## Framework quirks

- `next.config.ts` enables `cacheComponents` and `partialPrefetching`; data access must respect async request APIs (no synchronous dynamic data). When unsure, check `node_modules/next/dist/docs/`.
- Tailwind v4 via `@tailwindcss/turbopack` — **no `tailwind.config.*` file**; theme and custom tokens live in `app/globals.css` (`@theme`).
- Path alias `@/*` maps to the repo root.

## Design references (source of truth for UI)

- `references/pantallas/*.dc.html` — static HTML mockups of each screen (login, feed, ninos, perfil-nino, publicaciones, cuenta, etc.).
- `references/screenshots/*.png` — reference screenshots of those screens.
- When implementing or restyling a screen in `app/`, match the corresponding mockup; they are the agreed designs, not suggestions.

## Spec-driven development workflow

- Custom skills live in `.agents/skills/` (`/spec`, `/spec-impl`). Use `/spec` before starting a large feature; it saves specs to `specs/` (numbered, created on demand).
- Specs and replies should be written in the language the user starts with (existing guidance assumes Spanish).
- `/spec` — Usar esta skill para crear las especificaciones.
- `/spec-impl` — Usaremos esta skill para hacer las implementaciones.
- `/verify-spec` — Usar este comando para verificar que los criterios de aceptación de un spec están completos y son correctos. Valida contra la implementación actual usando Playwright (comparación visual) y Context7 (recomendaciones de Next.js).

## MCPs

- Playwright MCP: screenshots and any Playwright output must go in `.playwright-mcp/`.
- context7 MCP: use it to fetch up-to-date framework docs (Next.js, React, Tailwind) before writing framework-specific code.
- Supabase MCP (remote, configurado en `~/.config/opencode/opencode.json` con `Authorization: Bearer <PAT>` — el flujo OAuth tiene un bug conocido de DCR entre OpenCode y Supabase, no intentar `opencode mcp auth supabase`):
  - Project ref: `rsquxsqzjffagtidrgkp` — URL: `https://rsquxsqzjffagtidrgkp.supabase.co`.
  - Features habilitadas: docs, account, database, debugging, development, functions, branching, feedback, notebooks.
  - Herramientas disponibles vía `execute` bajo `tools.supabase` (27 tools: schema, migrations, SQL, logs, branches, edge functions, etc.).
  - Antes de cambiar schema, inspeccionar las tablas existentes; el SQL corre contra el proyecto remoto, aplicar cambios con cuidado.
- Lint ignora `references/**` (mockups estáticos).

## Supabase skills

- Skill global `supabase` (instalada via `npx skills add supabase/agent-skills`): usarla para CUALQUIER tarea de Supabase (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues, RLS, migraciones, debugging de errores HTTP/Postgres).
- `07-DB-Schema` (referencia externa, `C:\Users\cmsc0\Desktop\OpenCode\07-DB-Schema`) — esquema de base de datos de referencia (tablas, columnas, relaciones). **Aún no está implementado en la DB**; es el diseño a seguir al crear migraciones.
- Preferir desarrollo local con Supabase CLI (`supabase start`, migraciones locales, `supabase db push`) antes de aplicar cambios al proyecto remoto.

## Reglas de código
- Usar código limpio, nombres, funciones, variables etc en inglés.

## Reglas de diseño
- Toda pantalla o feature nuevo se especifica e implementa responsive desde su spec (móvil <768px / desktop ≥768px); ver SPEC 02.
