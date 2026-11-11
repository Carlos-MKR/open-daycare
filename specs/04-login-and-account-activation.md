# SPEC 04 — Login y activación de cuenta

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-11
> **Objetivo:** Implementar las referencias `login.dc.html` y `activar-cuenta.dc.html` como las rutas `/login` y `/activar-cuenta`, con formularios mock funcionales, responsive y sin selector de Personal/Familia en el login.

## Scope

**In:**

- Ruta `/login` con panel de branding coral en desktop y formulario de inicio de sesión.
- Ruta `/activar-cuenta` con branding, invitación a Mateo en Sala Soles, código, email, contraseña y consentimiento de fotos.
- El login muestra únicamente el acceso de Personal; no muestra la opción Familia.
- Componentes compartidos para logo, shell visual y campos de formulario.
- Estado controlado en ambos formularios.
- Validación básica inline en español: campos requeridos, formato de email y consentimiento obligatorio.
- Navegación mock a `/` después de un envío válido en ambas pantallas.
- Link entre `/login` y `/activar-cuenta`.
- Diseño responsive: desktop desde `768px`; en móvil se oculta el panel coral del login y se muestra solo el formulario.
- Fidelidad visual a las referencias: colores, tipografías Fredoka/Nunito, espaciado, gradientes, bordes, sombras y textos.

**Fuera de alcance:**

- Autenticación real, sesión, cookies, tokens o backend.
- Persistencia de credenciales, código de invitación o consentimiento.
- Recuperación de contraseña; “¿Olvidaste tu contraseña?” queda inerte.
- Selector de Familia o flujo alternativo de acceso.
- Validación contra una invitación existente o contra una base de datos.
- Pantalla de confirmación posterior a la activación.
- Cambios en el feed existente, salvo recibir la navegación mock a `/`.

## Data model

No introduce datos persistentes. Los formularios usan estado local en componentes client:

```ts
type LoginFormState = {
  email: string;
  password: string;
};

type ActivationFormState = {
  invitationCode: string;
  email: string;
  password: string;
  photoConsent: boolean;
};

type FormErrors<T> = Partial<Record<keyof T, string>>;
```

Valores mock iniciales:

- Login: `caro@opendaycare.com`, contraseña vacía.
- Activación: código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña vacía, consentimiento marcado.
- Invitación: `Mateo · Sala Soles`, avatar con inicial `M`.

## Implementation plan

1. Crear `components/auth/auth-logo.tsx` con el ícono de OpenDayCare y estilos reutilizables. Verificación manual: el componente renderiza sin depender de datos de servidor.
2. Crear `components/auth/auth-shell.tsx` para compartir fondo, ancho máximo, paddings y variantes del panel coral del login. Verificación manual: el shell permite renderizar contenido de formulario en desktop y móvil.
3. Crear `components/auth/form-field.tsx` para labels, inputs y mensajes de error inline accesibles. Verificación manual: un error se muestra debajo del campo sin usar `alert`.
4. Crear `components/auth/login-form.tsx` como client component con email, contraseña, validación y navegación válida a `/`. Verificación manual: un envío vacío muestra errores y un envío válido navega al feed.
5. Crear `app/login/page.tsx` con el panel de branding, el formulario compartido, el link inerte de recuperación y el link a `/activar-cuenta`. Verificación manual: `/login` coincide con la referencia sin selector de Familia.
6. Crear `components/auth/activation-form.tsx` como client component con código, email, contraseña, checkbox real y validación del consentimiento. Verificación manual: desmarcar el consentimiento bloquea el envío y muestra un error inline.
7. Crear `app/activar-cuenta/page.tsx` con la invitación de Mateo, el formulario y los links a `/` y `/login`. Verificación manual: `/activar-cuenta` coincide con la referencia y un envío válido navega al feed.
8. Ajustar responsive y accesibilidad: ocultar el panel coral del login debajo de `768px`, mantener controles con labels asociados y evitar overflow horizontal. Verificación manual: ambas rutas se leen completas a 375px.
9. Ejecutar `npx tsc --noEmit`, `npm run lint` y capturar ambas rutas a 922px y 375px en `.playwright-mcp/` para compararlas con las referencias.

## Acceptance criteria

- [x] `/login` renderiza el branding coral de OpenDayCare en desktop y el formulario con “Iniciar sesión”.
- [x] `/login` no renderiza las opciones “Personal” ni “Familia” como selector; solo presenta el acceso de Personal.
- [x] `/login` inicia con `caro@opendaycare.com` y la contraseña vacía.
- [x] Un envío vacío o inválido en `/login` no navega y muestra errores inline en español.
- [x] Un email válido y una contraseña no vacía en `/login` navegan a `/`.
- [x] “¿Olvidaste tu contraseña?” permanece inerte.
- [x] `/activar-cuenta` renderiza “Bienvenida a OpenDayCare”, “Mateo · Sala Soles”, código `7K4P9` y el email `lucia.fernandez@gmail.com`.
- [x] El consentimiento de fotos es un checkbox real, inicia marcado y puede desmarcarse.
- [x] Un envío de activación sin código, email válido, contraseña o consentimiento no navega y muestra errores inline en español.
- [x] Un envío válido de activación navega a `/`.
- [x] `/login` enlaza a `/activar-cuenta`, `/activar-cuenta` enlaza a `/login` y no se usan referencias `.dc.html` en la app.
- [x] A 922px ambas pantallas conservan la composición de las referencias.
- [x] A 375px el panel coral del login está oculto, el contenido cabe sin overflow horizontal y ambas pantallas son utilizables.
- [x] `npx tsc --noEmit` pasa.
- [x] `npm run lint` pasa.

## Decisions

- **Sí:** `/login` y `/activar-cuenta` como rutas reales de Next.js — reemplazan los nombres de archivos estáticos de las referencias.
- **Sí:** el login solo representa al Personal — el producto no necesita el selector Familia en esta pantalla.
- **Sí:** navegación mock a `/` — reutiliza el feed existente mientras no haya autenticación real.
- **Sí:** componentes compartidos en `components/auth/` — evita duplicar logo, shell y campos entre ambas pantallas.
- **Sí:** validación client-side básica con errores inline — permite probar el flujo sin backend y mantiene el usuario en contexto.
- **Sí:** checkbox real inicialmente marcado y obligatorio — conserva el estado de la referencia y hace explícita la autorización.
- **No:** persistencia o autenticación real — requieren una spec de identidad y backend.
- **No:** panel coral en móvil — el formulario necesita todo el ancho disponible y la referencia debe seguir siendo usable en pantallas pequeñas.
- **No:** alertas del navegador o mensajes flotantes — los errores inline son más claros y accesibles.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La navegación a `/` puede parecer un login real aunque no exista autenticación | Documentar el flujo como mock y dejar explícita la autenticación fuera de alcance. |
| El layout de login puede quedar demasiado estrecho en móvil | Ocultar el panel coral bajo `768px`, usar padding fluido y verificar a 375px. |
| El uso de componentes client puede aumentar el alcance de hidratación | Limitar `"use client"` exclusivamente a los formularios y mantener shell/presentación como server components cuando sea posible. |

## What is **not** in this spec

- Autenticación real, sesiones, cookies, tokens o base de datos.
- Recuperación de contraseña.
- Login como Familia.
- Validación remota del código de invitación.
- Persistencia del consentimiento o de los campos.
- Pantalla posterior específica para la activación.
