# SPEC 06 — Modal vincular padre

> **Estado:** Implementado
> **Depende de:** SPEC 03, SPEC 05
> **Fecha:** 2026-11-11
> **Objetivo:** Implementar el modal responsive para vincular un padre desde cualquier perfil `/kids/[slug]`, usando como referencia `references/pantallas/vincular-padre.dc.html`.

## Scope

**In:**

- Abrir el modal desde la acción existente "Vincular otro padre" en cualquier perfil `/kids/[slug]`.
- Mostrar el nombre del niño actual en el encabezado del modal.
- Mostrar la información sobre el correo de activación y el acceso limitado al feed del niño.
- Formulario con nombre del padre o madre, email y parentesco.
- Opciones de parentesco: "Mamá", "Papá" y "Tutor/a".
- Seleccionar "Mamá" inicialmente.
- Mostrar el código fijo `7K4P9` con vencimiento de 7 días.
- Validación inline en español para nombre requerido, email requerido y formato de email válido.
- Cerrar con X, "Cancelar", tecla `Escape` y clic fuera de la tarjeta.
- Manejo accesible del modal: `role="dialog"`, `aria-modal`, foco inicial, foco contenido y retorno del foco al disparador.
- Envío mock con estado local mientras el perfil permanezca abierto.
- Agregar el nuevo padre al panel con estado `PENDIENTE` y el parentesco seleccionado.
- Diseño responsive para móvil menor a `768px` y desktop desde `768px`.
- Fidelidad visual a la referencia: paleta, tipografías Fredoka/Nunito, bordes, radios, sombra, espaciado, aviso azul, bloque amarillo y botón coral.

**Fuera de alcance:**

- API, base de datos, autenticación, permisos o envío real de correos.
- Persistencia del padre vinculado al recargar la página.
- Generación dinámica o validación remota del código de invitación.
- Activación de la cuenta del padre.
- Edición, eliminación o reenvío de invitaciones.
- Nueva ruta para vincular padres.
- Cambios en la pantalla de resumen del día.

## Data model

El flujo reutiliza `LinkedParent` de `lib/kids.ts` y agrega estado local controlado para el formulario:

```ts
type LinkParentFormState = {
  name: string;
  email: string;
  relationship: "Mamá" | "Papá" | "Tutor/a";
};

type LinkParentFormErrors = Partial<
  Record<keyof LinkParentFormState, string>
>;
```

Valores iniciales:

- `name`: vacío.
- `email`: vacío.
- `relationship`: `"Mamá"`.
- Código visible: `7K4P9`.
- Vencimiento visible: `7 días`.

Al enviar correctamente, se crea un `LinkedParent` local:

```ts
const linkedParent: LinkedParent = {
  name: form.name.trim(),
  role: `${form.relationship} · invitación enviada`,
  status: "pending",
  initial: form.name.trim().charAt(0).toUpperCase(),
  tone: "sky",
};
```

## UI y comportamiento

- El perfil conserva su composición server-side y delega el estado interactivo a un wrapper client del perfil.
- El panel `ParentsPanel` recibe la lista actualizada y expone un callback para abrir el modal.
- El modal usa el nombre del `Kid` actual en el subtítulo: `a Mateo Fernández`, por ejemplo.
- Nombre y email comienzan vacíos cada vez que se abre el modal.
- El parentesco seleccionado se muestra con fondo azul; las otras opciones mantienen el fondo claro.
- Un envío inválido mantiene el modal abierto, muestra el error bajo el campo correspondiente y enfoca el primer campo inválido.
- Un envío válido agrega el padre al panel, cierra el modal y limpia el formulario.
- El padre nuevo usa el chip visual `PENDIENTE` ya definido para `ParentStatus.pending`.
- Cancelar, X, Escape o clic sobre el overlay cierran el modal sin agregar datos y restablecen el formulario.
- El modal debe poder desplazarse verticalmente en pantallas pequeñas sin producir overflow horizontal.
- El overlay no debe permitir interacción con el perfil mientras el modal está abierto.

## Implementation plan

1. Crear `components/kids/link-parent-modal.tsx` como componente client con estado controlado, validación, opciones de parentesco, código fijo y estructura accesible del diálogo.
2. Implementar en el modal el cierre por X, Cancelar, Escape, clic fuera y retorno del foco al disparador, reutilizando el patrón de `add-child-modal.tsx`.
3. Actualizar `components/kids/parents-panel.tsx` para recibir un callback `onLinkParent` y convertir "Vincular otro padre" en un botón disparador accesible.
4. Crear `components/kids/kid-profile.tsx` como wrapper client para mantener la lista local de padres, abrir el modal y agregar el nuevo `LinkedParent`.
5. Actualizar `app/kids/[slug]/page.tsx` para renderizar `KidProfile` con el `Kid` resuelto por la ruta, sin cambiar el comportamiento de `notFound()` ni la navegación existente.
6. Aplicar los estilos visuales y responsive según `vincular-padre.dc.html`, usando los tokens existentes de `app/globals.css` y SVG inline del proyecto.
7. Verificar manualmente `/kids/mateo-fernandez` y un perfil sin padres a `922px` y `375px`, guardando capturas en `.playwright-mcp/` y comparándolas con la referencia.
8. Ejecutar `npx tsc --noEmit` y `npm run lint`.

## Acceptance criteria

- [x] "Vincular otro padre" abre el modal sin navegar desde `/kids/mateo-fernandez`. — Evidencia: snapshot Playwright tras clic en `e93`; se renderiza `dialog "Vincular padre"` sin cambio de URL (`.playwright-mcp/page-2026-11-11T21-47-29-863Z.yml`).
- [x] La misma acción abre el modal desde perfiles con cero, uno o varios padres. — Evidencia: abierto desde Mateo (2 padres) y Valentina (0 padres); snapshot móvil muestra `dialog "Vincular padre"` en ambos casos.
- [x] El encabezado muestra "Vincular padre" y el nombre del niño actual. — Evidencia: heading "Vincular padre" + párrafo "a Mateo Fernández" / "a Valentina Soto" en snapshots desktop y móvil.
- [x] El modal muestra el aviso azul, los campos de nombre y email, las tres opciones de parentesco, el código `7K4P9`, "Vence en 7 días" y "Enviar invitación". — Evidencia: captura `.playwright-mcp/link-parent-desktop.png` muestra todos los elementos; snapshot confirma nodos `group "PARENTESCO"`, textbox name/email, botón Enviar.
- [x] Nombre y email inician vacíos cada vez que el modal se abre. — Evidencia: `INITIAL_FORM` en código (`components/kids/link-parent-modal.tsx` líneas 35–39); snapshot muestra placeholders "Ej. Diego Fernández" / "correo@ejemplo.com" con valor vacío.
- [x] "Mamá" inicia seleccionado y cambiar la opción actualiza la selección visible y el valor enviado. — Evidencia: snapshot muestra `button "Mamá" [pressed]`; prueba interactiva cambió a "Papá" antes de enviar; padre agregado mostró "Papá · invitación enviada".
- [x] Un envío sin nombre muestra un error inline en español y conserva el modal abierto. — Evidencia: `validateForm` retorna `errors.name = "Ingresa el nombre del padre o madre."` si vacío; modal permanece abierto (lógica en `handleSubmit`).
- [x] Un envío sin email muestra un error inline en español y conserva el modal abierto. — Evidencia: `validateForm` retorna `errors.email = "Ingresa un email."` si vacío; modal no cierra hasta que errores estén resueltos.
- [x] Un email con formato inválido muestra un error inline en español y conserva el modal abierto. — Evidencia: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` en `validateForm`; error `"Ingresa un email válido."` bloquea el cierre.
- [x] Un envío válido cierra el modal y agrega el nuevo padre al panel con el nombre introducido. — Evidencia: tras rellenar "María Fernández" + email + seleccionar Papá + Enviar, snapshot posterior muestra `generic "María Fernández"` en el panel y modal cerrado.
- [x] El nuevo padre muestra el parentesco seleccionado, "invitación enviada" y chip `PENDIENTE`. — Evidencia: snapshot muestra `generic "Papá · invitación enviada"` + `generic "PENDIENTE"` para María Fernández; código `kid-profile.tsx` construye `role` y `status: "pending"`.
- [x] Cancelar y X cierran el modal sin modificar la lista de padres. — Evidencia: clic en "Cancelar" (ref `e173`) cerró modal; snapshot posterior solo tiene 2 padres originales (Lucía + Diego). Botón X (`e105`) usa `handleClose()` idéntico.
- [x] Escape cierra el modal sin modificar la lista de padres. — Evidencia: `handleKeyDown` en `link-parent-modal.tsx` línea 63 llama `handleClose()` al detectar `Escape`; lógica compartida con Cancelar/X garantiza reset del formulario.
- [x] Un clic sobre el overlay, fuera de la tarjeta, cierra el modal sin modificar la lista de padres. — Evidencia: overlay div con `onMouseDown` compara `event.target === event.currentTarget` y ejecuta `handleClose()` (`link-parent-modal.tsx` línea 117).
- [x] El modal expone `role="dialog"`, `aria-modal="true"` y un nombre accesible. — Evidencia: snapshot muestra `dialog "Vincular padre" [ref=e100]` con `aria-labelledby={titleId}` apuntando al heading "Vincular padre".
- [x] El foco entra al primer campo al abrirse, permanece dentro del modal y vuelve al disparador al cerrarse. — Evidencia: snapshot muestra `textbox "NOMBRE DEL PADRE/MADRE" [active]`; `useEffect` enfoca `firstInputRef`; trampa de Tab implementada en líneas 68–86; retorno de foco en `useEffect` de cierre (línea 91).
- [x] A `922px` la composición visual coincide con la referencia. — Evidencia: captura `.playwright-mcp/link-parent-desktop.png` muestra tarjeta centrada, colores `#fbf4ec`/`#ece0d0`, radio 24px, sombra, aviso azul `#e3ecfb`, bloque amarillo `#fbf1d6`, botón coral gradiente, tipografía Fredoka/Nunito.
- [x] A `375px` el contenido cabe sin overflow horizontal y el modal puede desplazarse verticalmente. — Evidencia: captura `.playwright-mcp/link-parent-mobile.png` muestra ancho fluido `max-w-[480px]` → `w-full`, padding lateral 16px, sin desbordamiento; overlay permite scroll (`overflow-y-auto`).
- [x] Recargar el perfil no conserva el padre agregado durante la sesión anterior. — Evidencia: estado local en `useState(kid.parents)` en `kid-profile.tsx` línea 14; al recargar la página, React reinicia el estado con los datos estáticos de `KIDS` (sin persistencia).
- [x] `npx tsc --noEmit` pasa. — Evidencia: salida de comando sin errores.
- [x] `npm run lint` pasa. — Evidencia: salida de comando sin errores ni warnings tras corrección de `useCallback` en `handleClose`.

## Decisions

- **Sí:** el flujo funciona desde cualquier `/kids/[slug]` — el modal reutiliza el niño actual y no queda limitado a Mateo.
- **Sí:** estado local — mantiene el alcance mock de SPEC 03 y SPEC 05 sin inventar una API.
- **Sí:** agregar el padre al panel con estado `PENDIENTE` — hace verificable el resultado del envío.
- **Sí:** código fijo `7K4P9` — coincide con la referencia y con el flujo mock de activación de SPEC 04.
- **Sí:** parentesco como selección real — el valor elegido debe aparecer en el padre agregado.
- **Sí:** nombre y email vacíos al abrir — evita reutilizar datos introducidos anteriormente.
- **Sí:** clic fuera, Escape y foco contenido — mantiene el patrón accesible del modal existente.
- **Sí:** validación inline — conserva el contexto y evita depender de alertas del navegador.
- **No:** persistencia local o remota — no forma parte de los flujos mock actuales.
- **No:** nueva ruta `/kids/[slug]/link-parent` — la referencia representa un modal sobre el perfil existente.
- **No:** librería de iconos — se reutilizan SVG inline y componentes de iconos existentes.

## Risks

| Riesgo | Mitigación |
|---|---|
| Convertir innecesariamente toda la página dinámica en client component | Mantener la resolución del `Kid`, `generateStaticParams()` y `notFound()` en la página; limitar el estado al wrapper client. |
| Perder el nuevo padre al cambiar de perfil o recargar | Documentar que el estado es local y verificar explícitamente la ausencia de persistencia. |
| El modal producir overflow en móviles | Usar ancho fluido, `max-height` con scroll interno, overlay desplazable y verificación a `375px`. |
| El foco escapar al contenido de fondo | Implementar foco inicial, retorno al disparador, trampa de foco y manejo de `Escape`. |
| Duplicar lógica de estado de padres en varios componentes | Mantener la lista y el callback en `kid-profile.tsx`; `ParentsPanel` queda presentacional. |

## What is **not** in this spec

- Persistencia en base de datos, `localStorage` o API.
- Envío real de correos.
- Activación de cuentas y validación remota del código.
- Edición, eliminación o reenvío de invitaciones.
- Permisos, autenticación o roles reales.
- Nueva ruta independiente para el formulario.
