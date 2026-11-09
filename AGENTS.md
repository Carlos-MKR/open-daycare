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
- /spec Usar esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implmentaciones

## MCPs

- Playwright MCP: screenshots and any Playwright output must go in `.playwright-mcp/`.
- context7 MCP: use it to fetch up-to-date framework docs (Next.js, React, Tailwind) before writing framework-specific code.
