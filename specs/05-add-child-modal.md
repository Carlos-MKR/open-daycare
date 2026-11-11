# SPEC 05 — Modal agregar niño

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 03
> **Fecha:** 2026-11-11
> **Objetivo:** Implementar el flujo mock para agregar un niño desde `/kids`, usando como referencia `references/pantallas/agregar-nino.dc.html`.

## Scope

**In:**

- Abrir un modal al hacer clic en el botón existente "Agregar niño" de `/kids`.
- Modal con encabezado, acciones "Cancelar" y "Guardar", y formulario.
- Campos: nombre completo, fecha de nacimiento, sala, alergias y notas médicas.
- Validación inline en español para nombre completo, fecha de nacimiento y sala.
- Campos de alergias y notas médicas opcionales.
- Selector de sala con al menos la opción "Soles".
- Cierre mediante "Cancelar" y tecla `Escape`.
- Guardado mock en estado local; no se requiere persistencia ni backend.
- Responsive móvil <768px y desktop ≥768px.
- Fidelidad visual a la referencia: paleta, Fredoka/Nunito, bordes, radios, sombra, espaciado y overlay.

**Fuera de alcance:**

- Persistencia en base de datos o API.
- Edición o eliminación de niños.
- Carga de fotografía.
- Vinculación de padres.
- Validación remota o cálculo de edad.
- Nueva ruta `/kids/add`; el flujo vive en `/kids`.

## Data model

El formulario usa estado local en un componente client:

```ts
type AddChildFormState = {
  fullName: string;
  birthDate: string;
  room: string;
  allergies: string;
  medicalNotes: string;
};

type AddChildFormErrors = Partial<Record<keyof AddChildFormState, string>>;
```

Valores iniciales:

- `fullName`: vacío.
- `birthDate`: vacío.
- `room`: `Soles`.
- `allergies`: vacío.
- `medicalNotes`: vacío.

## UI y comportamiento

- El botón "Agregar niño" deja de navegar a `#` y abre el modal.
- El modal se renderiza sobre un overlay y expone `role="dialog"`, `aria-modal="true"` y un nombre accesible.
- En desktop tiene ancho máximo aproximado de `520px`, fondo `#FBF4EC`, borde `#ECE0D0`, radio `24px` y sombra suave.
- En desktop, fecha de nacimiento y sala aparecen en dos columnas; en móvil pasan a una columna.
- El contenido del modal puede desplazarse verticalmente en pantallas pequeñas.
- "Cancelar" cierra el modal y restablece los valores del formulario.
- "Guardar" valida y, si es válido, agrega el niño al estado local del listado y cierra el modal.
- Si hay errores, el modal permanece abierto, se muestran mensajes inline y se enfoca el primer campo inválido.
- Al abrirse, el foco se coloca en el primer campo. Al cerrarse, vuelve al botón "Agregar niño".
- Mientras está abierto, `Escape` cierra el modal y el foco no debe escapar de él.

## Implementation plan

1. Crear `components/kids/add-child-modal.tsx` como componente client con estado controlado, validación, cierre y manejo de foco.
2. Actualizar `app/kids/page.tsx` para controlar `isAddChildModalOpen`, conservar el botón como disparador y mantener la composición de la pantalla.
3. Permitir que `KidsBrowser` reciba el niño agregado o el listado actualizado sin introducir persistencia.
4. Implementar la estructura visual según `references/pantallas/agregar-nino.dc.html`, reutilizando los tokens de `app/globals.css` y SVG inline existentes.
5. Ajustar responsive: modal centrado en desktop, ancho fluido y campos apilados en móvil, sin overflow horizontal.
6. Verificar manualmente a 922px y 375px mediante capturas en `.playwright-mcp/` y comparar con la referencia.
7. Ejecutar `npx tsc --noEmit` y `npm run lint`.

## Acceptance criteria

- [ ] El botón "Agregar niño" en `/kids` abre el modal sin navegar.
- [ ] El modal muestra el título "Agregar niño", "Cancelar" y "Guardar".
- [ ] Se muestran los cinco campos con los labels y placeholders de la referencia.
- [ ] Nombre completo, fecha de nacimiento y sala son obligatorios.
- [ ] Alergias y notas médicas pueden permanecer vacíos.
- [ ] Un envío inválido muestra errores inline en español y conserva el modal abierto.
- [ ] Un envío válido cierra el modal y agrega el niño al listado mock local.
- [ ] "Cancelar" limpia el formulario y no agrega ningún niño.
- [ ] `Escape` cierra el modal.
- [ ] El foco inicial, el foco de retorno y el foco dentro del modal son accesibles.
- [ ] A 922px el modal coincide con la composición visual de la referencia.
- [ ] A 375px el modal cabe sin overflow horizontal y fecha/sala se apilan.
- [ ] `npx tsc --noEmit` pasa.
- [ ] `npm run lint` pasa.

## Decisions

- **Sí:** modal inline dentro de `/kids` — la referencia representa una ventana sobre la pantalla de niños y no una ruta independiente.
- **Sí:** estado local — mantiene el alcance mock actual de SPEC 03 y evita inventar una API.
- **Sí:** validación inline — conserva el contexto del usuario y es consistente con SPEC 04.
- **Sí:** sala inicial "Soles" — es la sala visible en la aplicación y en la referencia.
- **No:** `alert()` o validación nativa como única respuesta — los errores deben ser visibles y accesibles junto a cada campo.
- **No:** modificar los datos persistentes de `lib/kids.ts` — el niño agregado solo vive durante la sesión actual.

## Risks

| Riesgo | Mitigación |
|---|---|
| Convertir toda la página `/kids` en client component innecesariamente | Limitar `use client` al modal y pasar callbacks/estado mínimo desde la página o un wrapper client. |
| El modal producir overflow en móvil | Usar ancho fluido, `max-height` con scroll interno y campos apilados bajo `768px`. |
| El foco escapar al contenido de fondo | Implementar foco inicial, retorno al trigger y manejo de `Escape`/tabulación. |
| La lista mock no reflejar el nuevo registro | Mantener el listado renderizado desde estado local del flujo y actualizar el contador visible. |

## What is **not** in this spec

- Persistencia real del niño.
- Edición, eliminación o perfil detallado del nuevo registro.
- Subida de avatar.
- Vinculación de padres.
- API, autenticación o permisos.
