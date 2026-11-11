# SPEC 07 — Modal nueva publicación

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-11
> **Objetivo:** Implementar un modal responsive para crear publicaciones desde el feed, siguiendo la referencia `references/pantallas/crear-publicacion.dc.html`.

## Scope

**In:**

- Abrir el modal desde "Nueva publicación" en el sidebar desktop, disponible en cualquier pantalla con sidebar.
- Navegar al feed al publicar desde una pantalla distinta para mostrar la tarjeta creada.
- Abrir el mismo modal desde `ComposerPrompt` y el FAB móvil.
- Mostrar el encabezado con "Cancelar", "Nueva publicación" y "Publicar".
- Seleccionar uno o varios destinatarios entre Mateo, Sofía, Benjamín y "Toda la sala".
- Hacer "Toda la sala" excluyente respecto de los niños individuales.
- Seleccionar un tipo entre Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio.
- Capturar una descripción mediante textarea.
- Mostrar el control visual de fotos y permitir marcarlo como seleccionado sin subir archivos ni mostrar previews reales.
- Renderizar `ComposerPrompt` con ancho completo, igual que las tarjetas del feed.
- Validar destinatario, tipo y descripción con errores inline en español.
- Agregar la publicación creada al inicio del feed mientras la página permanezca abierta.
- Mantener el formulario vacío al abrirse, con Mateo seleccionado inicialmente.
- Cerrar con Cancelar, Escape, clic fuera de la tarjeta o publicación válida.
- Manejar accesibilidad con `role="dialog"`, `aria-modal`, nombre accesible, foco inicial, foco contenido y retorno del foco al disparador.
- Mantener el diseño responsive para móvil menor a `768px` y desktop desde `768px`.
- Igualar la referencia en paleta, tipografías Fredoka/Nunito, bordes, radios, sombra y espaciado.

**Fuera de alcance:**

- API, base de datos, autenticación, permisos o publicación remota.
- Persistencia al recargar, cambiar de ruta o cerrar la sesión.
- Subida real de archivos, almacenamiento de imágenes o previews de fotografías.
- Edición, eliminación o detalle de la publicación recién creada.
- Nueva ruta para el formulario.
- Notificaciones reales a las familias.
- Rediseño de las tarjetas existentes del feed.

## Data model

El flujo reutiliza `FeedPost` de `lib/feed.ts` y agrega estado local para el modal y la lista visible del feed:

```ts
type PublicationTarget = "mateo" | "sofia" | "benjamin" | "all";

type PublicationType =
  | "comida"
  | "siesta"
  | "actividad"
  | "logro"
  | "animo"
  | "foto"
  | "anuncio";

type CreatePublicationFormState = {
  targets: PublicationTarget[];
  type: PublicationType;
  description: string;
  photoSelected: boolean;
};

type CreatePublicationFormErrors = {
  targets?: string;
  type?: string;
  description?: string;
};
```

Valores iniciales:

- `targets`: `["mateo"]`.
- `type`: `"comida"`.
- `description`: vacío.
- `photoSelected`: `false`.

Al publicar correctamente, el estado local crea un `FeedPost` con un identificador único, hora visible de la sesión, autor `publicado por vos`, audiencia derivada de los destinatarios, cuerpo igual a la descripción y variante visual derivada del tipo:

- `logro` y `animo` → `achievement`.
- `comida`, `siesta`, `actividad` y `foto` → `activity`.
- `anuncio` → `announcement`.

## UI y comportamiento

- `Sidebar`, `ComposerPrompt` y `MobileTabBar` reciben un callback común para abrir el modal en lugar de navegar a `#`.
- La página conserva su estructura server-side y delega el estado interactivo del feed a un wrapper client, por ejemplo `components/feed/feed-browser.tsx`.
- El modal se renderiza sobre un overlay que bloquea la interacción con el feed.
- En desktop la tarjeta usa ancho máximo aproximado de `580px`, fondo `#FBF4EC`, borde `#ECE0D0`, radio `24px` y sombra suave.
- En móvil la tarjeta ocupa el ancho disponible con padding lateral reducido y scroll vertical sin overflow horizontal.
- El botón de destinatario seleccionado usa fondo oscuro y texto blanco; los no seleccionados usan fondo claro.
- Seleccionar "Toda la sala" elimina los destinatarios individuales; seleccionar un niño elimina "Toda la sala".
- El tipo seleccionado mantiene el color de la referencia y los tipos restantes conservan sus colores diferenciados.
- La acción de fotos cambia el estado visual del control a seleccionado, pero no abre una subida ni conserva un archivo.
- Un envío inválido conserva el modal abierto, muestra el error bajo el grupo correspondiente y enfoca el primer campo inválido.
- Un envío válido agrega la tarjeta al inicio del feed, cierra el modal y restablece el formulario para la próxima apertura.
- Cancelar, X, Escape o clic sobre el overlay cierran el modal sin agregar publicaciones y restablecen el formulario.
- Al abrirse, el foco se coloca en el primer control de destinatarios; al cerrarse, vuelve al disparador que abrió el modal.
- El foco no puede escapar del modal mientras esté abierto.

## Implementation plan

1. Crear `components/feed/create-publication-modal.tsx` como componente client con el estado del formulario, opciones, validación, cierre y manejo de foco.
2. Implementar en el modal la selección múltiple de destinatarios, la exclusividad de "Toda la sala", la selección de tipos, el control visual de fotos y los mensajes inline.
3. Crear `components/feed/feed-browser.tsx` para mantener localmente la apertura del modal y la lista de `FeedPost`, iniciándola con `FEED_POSTS`.
4. Actualizar `app/page.tsx` para renderizar `FeedBrowser` y conservar el layout responsive existente.
5. Actualizar `components/feed/sidebar.tsx`, `components/feed/composer-prompt.tsx` y `components/feed/mobile-tabbar.tsx` para usar el callback de apertura en sus tres disparadores.
6. Integrar la publicación válida al inicio del feed y mapear sus siete tipos a las tres variantes visuales existentes sin rediseñar `PostCard`.
7. Aplicar la composición visual de `crear-publicacion.dc.html` usando los tokens existentes de `app/globals.css` y los iconos SVG del proyecto.
8. Verificar manualmente el flujo a `922px` y `375px`, guardando capturas en `.playwright-mcp/` y comparándolas con la referencia.
9. Ejecutar `npx tsc --noEmit` y `npm run lint`.

## Acceptance criteria

- [x] "Nueva publicación" del sidebar abre el modal sin cambiar la URL en cualquier pantalla con sidebar. — Evidencia: `.playwright-mcp/create-publication-from-kids.yml` desde `/kids`.
- [x] Publicar desde una pantalla distinta del feed agrega la tarjeta y navega al feed. — Evidencia: tarjeta "Probando publicación desde Niños" visible en `/` tras abrirla desde `/kids`.
- [x] `ComposerPrompt` y el FAB móvil abren el mismo modal. — Evidencia: snapshots desktop y `.playwright-mcp/create-publication-mobile.yml`.
- [x] `ComposerPrompt` ocupa el mismo ancho que las tarjetas del feed. — Evidencia: composer y tarjeta miden `584px` a `922px`.
- [x] El modal muestra Cancelar, Nueva publicación y Publicar. — Evidencia: snapshots desktop y móvil.
- [x] Se muestran los cuatro destinos: Mateo, Sofía, Benjamín y Toda la sala. — Evidencia: snapshot desktop.
- [x] Mateo inicia seleccionado. — Evidencia: botón `Mateo [pressed]` en snapshots.
- [x] Se pueden seleccionar varios niños individuales. — Evidencia: `toggleTarget` conserva destinos individuales.
- [x] Seleccionar Toda la sala deselecciona los niños individuales. — Evidencia: `toggleTarget` asigna exclusivamente `["all"]`.
- [x] Seleccionar un niño deselecciona Toda la sala. — Evidencia: `toggleTarget` elimina `all` antes de añadir destinos individuales.
- [x] Se muestran los siete tipos de publicación de la referencia. — Evidencia: snapshot lista Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio.
- [x] Comida inicia seleccionada. — Evidencia: botón `Comida [pressed]` en snapshots.
- [x] La descripción inicia vacía y muestra el placeholder de la referencia. — Evidencia: textbox con `Contá cómo le fue hoy…`.
- [x] El control Agregar foto cambia su estado visual al hacer clic sin subir archivos. — Evidencia: estado `photoSelected` muestra `Agregada`.
- [x] Publicar sin destinatario muestra un error inline y mantiene el modal abierto. — Evidencia: validación `targets` en `handleSubmit`.
- [x] Publicar sin tipo muestra un error inline y mantiene el modal abierto. — Evidencia: validación `type` en `handleSubmit`.
- [x] Publicar sin descripción muestra un error inline y mantiene el modal abierto. — Evidencia: `.playwright-mcp/create-publication-validation.yml`.
- [x] Una publicación válida cierra el modal y agrega una tarjeta al inicio del feed. — Evidencia: nueva tarjeta encontrada antes de las existentes tras publicar.
- [x] La tarjeta creada muestra una audiencia derivada de la selección y el texto introducido. — Evidencia: snapshot muestra `familia de Mateo · comida` y el cuerpo enviado.
- [x] Cancelar, X, Escape y clic fuera cierran el modal sin agregar una tarjeta. — Evidencia: handlers `close`, `onKeyDown` y overlay en `create-publication-modal.tsx`.
- [x] Cada nueva apertura restablece destinatario Mateo, tipo Comida, descripción vacía y fotos no seleccionadas. — Evidencia: `INITIAL_FORM` y reset en `close`.
- [x] El modal expone `role="dialog"`, `aria-modal="true"` y un nombre accesible. — Evidencia: snapshot muestra `dialog "Nueva publicación"`.
- [x] El foco entra al modal, permanece contenido y vuelve al disparador al cerrarse. — Evidencia: `firstControlRef`, trampa de Tab y `triggerRef`.
- [x] A `922px` la composición coincide visualmente con `crear-publicacion.dc.html`. — Evidencia: `.playwright-mcp/create-publication-desktop.yml`.
- [x] A `375px` el modal no produce overflow horizontal y permite scroll vertical. — Evidencia: `.playwright-mcp/create-publication-mobile.yml`.
- [x] Recargar la página elimina las publicaciones creadas durante la sesión anterior. — Evidencia: estado en memoria inicializado desde `FEED_POSTS`.
- [x] `npx tsc --noEmit` pasa. — Evidencia: ejecución final sin errores.
- [x] `npm run lint` pasa. — Evidencia: ejecución final sin errores.

## Decisions

- **Sí:** el modal se abre desde sidebar, composer y FAB — evita que entradas visibles del feed permanezcan inertes.
- **Sí:** estado local — mantiene el alcance mock de las specs existentes y evita inventar una API.
- **Sí:** publicación válida visible inmediatamente — permite verificar el resultado del formulario.
- **Sí:** Mateo seleccionado inicialmente y descripción vacía — conserva el ejemplo de la referencia sin publicar contenido accidental.
- **Sí:** selección múltiple con Toda la sala excluyente — representa correctamente el alcance de la publicación.
- **Sí:** validación inline — mantiene el contexto del usuario y coincide con el patrón de SPEC 05 y SPEC 06.
- **Sí:** los siete tipos se mapean a las tres variantes existentes — evita rediseñar las tarjetas del feed para este flujo.
- **Sí:** fotos con estado visual local — permite interacción verificable sin introducir carga de archivos.
- **No:** ruta independiente — la referencia representa un modal sobre el feed.
- **No:** persistencia local o remota — no forma parte del flujo mock actual.
- **No:** previews ni subida de imágenes — queda para una spec de medios si fuera necesaria.

## Risks

| Riesgo | Mitigación |
|---|---|
| Convertir toda la página del feed en client component | Limitar el estado a `feed-browser.tsx` y mantener el layout presentacional existente. |
| El modal producir overflow en móvil | Usar ancho fluido, scroll vertical y verificación específica a `375px`. |
| El foco escapar al contenido del feed | Implementar foco inicial, trampa de foco, Escape y retorno al disparador. |
| La publicación creada no coincidir con el modelo de tarjetas | Reutilizar `FeedPost` y centralizar el mapeo de tipos a variantes. |
| La selección de destinatarios generar estados contradictorios | Aplicar exclusividad explícita entre `all` y los destinos individuales. |

## What is **not** in this spec

- Persistencia en base de datos, `localStorage` o API.
- Subida, almacenamiento o preview real de fotografías.
- Edición, eliminación o detalle de publicaciones.
- Notificaciones a familias.
- Autenticación, permisos o roles reales.
- Nueva ruta independiente para crear publicaciones.
