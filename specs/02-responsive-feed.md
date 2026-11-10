# SPEC 02 — Responsive del feed (móvil <768px)

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-09
> **Objetivo:** Hacer responsive esta es una feature de SPEC 01: el feed se adapta a móvil (<768px) con bottom tab bar, top bar y FAB, sin alterar el render de desktop (≥768px).

## Scope

**In:**

- 2 estados de layout: ≥768px exactamente como SPEC 01; <768px versión móvil.
- Móvil: top bar fija (logo + nombres, avatar "C" y logout), tab bar inferior fija (Feed/Niños/Avisos/Cuenta, inercias `href="#"`) y FAB "+" con el gradiente del CTA.
- Contenedor fluido: padding lateral 40px → 16px, ancho completo (sin `max-w-[760px]` en móvil) y clearance inferior para tab bar + FAB.
- Reutilizar `NAV_ITEMS` y los tokens existentes; `NavLink` (desktop) intacto y un componente de tab compacto para móvil.
- Verificación visual: desktop 922px idéntico, móvil 375px correcto.

**Out of scope (specs futuros):**

- Rutas reales de las pantallas — los tabs siguen inercias.
- Estados 768–1023px separados (tablet usa el layout de desktop).
- Animaciones de tab bar o drawer.
- Otras pantallas.

## Data model

No introduce datos persistentes. Mueve `NAV_ITEMS` de `sidebar.tsx` a `lib/feed.ts` (`{ href, label, icon }`) para compartirlo entre sidebar desktop y tab bar móvil.

## Implementation plan

1. `lib/feed.ts`: exportar `NAV_ITEMS` y refactor de `sidebar.tsx` para importarlo. *(Manual: desktop sin cambios visuales.)*
2. `app/page.tsx`: layout responsive — sidebar `hidden md:flex`, `main` con scroll interno solo en `md:`, contenedor con padding fluido y clearance móvil.
3. `components/feed/mobile-topbar.tsx` (fija, `md:hidden`): logo, nombres, avatar y logout.
4. `components/feed/mobile-tabbar.tsx` (fija abajo, `md:hidden`) con `tab-link.tsx` de 4 items y FAB "+".
5. Verificación: `tsc`, `lint`, capturas en `.playwright-mcp/` (922px y 375px).

## Acceptance criteria

- [x] A 922px el render es idéntico a la captura aprobada de SPEC 01 (`feed-impl-final-top.png`).
- [x] A 375px: sidebar oculta, top bar fija arriba, tab bar de 4 items fija abajo, FAB "+" visible.
- [x] En móvil no hay overflow horizontal (el contenido cabe a 375px sin scroll lateral).
- [x] Los tabs del móvil navegan nada (inercias `href="#"`), igual que desktop.
- [x] Las barras móviles usan solo tokens existentes (`bg-surface`, `border-line`, `chip-active`, gradiente del CTA).
- [x] npx tsc --noEmit y npm run lint pasan.

## Decisions

- **Sí:** bottom tab bar + top bar en móvil — patrón estándar, sin JS, solo CSS (`hidden`/`md:`).
- **No:** hamburguesa/drawer — exige JS de estado y contradice la dirección del feed.
- **No:** riel de iconos en tablet — sería un tercer estado y la spec pide 2.
- **Sí:** `NAV_ITEMS` compartido en `lib/feed.ts` — DRY entre sidebar y tab bar.
- **Sí:** FAB "+" reutiliza el gradiente del CTA desktop — coherencia visual sin diseño nuevo.
- **Sí:** regla repo (AGENTS.md): todo feature nuevo se especifica e implementa responsive.

## What is **not** in this spec

- Contenido real (auth, BD), pantallas de tabs, tablet intermedio.
